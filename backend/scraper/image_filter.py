"""Image quality pipeline for Layout 2.

Pipeline: fetch bytes -> Pillow validate -> size/aspect/social reject
-> perceptual-hash dedup -> solid-bar detection -> score -> top 3.
Every threshold comes from `settings` so Week 0 calibration is a config
change, not a code change.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from io import BytesIO

import httpx
import imagehash
import numpy as np
from PIL import Image, UnidentifiedImageError

from backend.config import settings
from backend.schemas.api import RankedImage

_MEGAPIXEL_CAP = 5.0
_ABOVE_FOLD_PIXEL_Y = 800
_SOCIAL_CDN_MARKERS = (
    "fbcdn.net",
    "facebook.com",
    "twimg.com",
    "twitter.com",
    "cdninstagram.com",
    "instagram.com",
    "licdn.com",
    "linkedin.com",
    "tiktokcdn.com",
    "tiktok.com",
    "pinimg.com",
    "pinterest.com",
)
_IMAGE_FETCH_TIMEOUT_SECONDS = 5
_IMAGE_BYTE_CAP = 10 * 1024 * 1024  # 10MB; larger than this is almost certainly not a hero image


@dataclass(slots=True)
class CandidateImage:
    """A pre-filter image candidate surfaced by the scraper."""

    url: str
    raw_bytes: bytes | None = None
    y_position: int | None = None
    in_hero_section: bool = False


@dataclass(slots=True, frozen=True)
class _ValidatedImage:
    url: str
    width: int
    height: int
    pixels: np.ndarray
    size_bytes: int
    y_position: int | None
    in_hero_section: bool


async def filter_and_rank(images: list[CandidateImage]) -> list[RankedImage]:
    """Run the full filter pipeline and return the top 3 ranked images."""
    if not images:
        return []

    fetched = await _fetch_missing_bytes(images)
    validated = [candidate for candidate in (_validate(image) for image in fetched) if candidate]
    cleaned = [candidate for candidate in (_strip_solid_bars(image) for image in validated) if candidate]
    scored = [(candidate, _score(candidate)) for candidate in cleaned]
    deduped = _dedupe(scored)
    deduped.sort(key=lambda pair: pair[1], reverse=True)

    return [
        RankedImage(
            url=candidate.url,
            width=candidate.width,
            height=candidate.height,
            score=round(score, 4),
        )
        for candidate, score in deduped[:3]
    ]


async def _fetch_missing_bytes(images: list[CandidateImage]) -> list[CandidateImage]:
    """Download any candidate that didn't ship with raw_bytes pre-attached."""
    to_fetch = [image for image in images if image.raw_bytes is None]
    if not to_fetch:
        return images

    async with httpx.AsyncClient(timeout=_IMAGE_FETCH_TIMEOUT_SECONDS, follow_redirects=True) as client:
        results = await asyncio.gather(
            *(_fetch_one(client, image) for image in to_fetch),
            return_exceptions=True,
        )
    for image, result in zip(to_fetch, results):
        if isinstance(result, Exception) or result is None:
            continue
        image.raw_bytes = result
    return [image for image in images if image.raw_bytes is not None]


async def _fetch_one(client: httpx.AsyncClient, image: CandidateImage) -> bytes | None:
    try:
        response = await client.get(image.url)
    except httpx.HTTPError:
        return None
    if response.status_code >= 400:
        return None
    content = response.content
    if len(content) > _IMAGE_BYTE_CAP:
        return None
    return content


def _validate(candidate: CandidateImage) -> _ValidatedImage | None:
    """Reject by URL heuristics and basic Pillow validation."""
    if candidate.raw_bytes is None:
        return None

    url_lower = candidate.url.lower()
    if any(marker in url_lower for marker in _SOCIAL_CDN_MARKERS):
        return None

    size_bytes = len(candidate.raw_bytes)
    if size_bytes < settings.image_min_file_size_kb * 1024:
        return None

    try:
        with Image.open(BytesIO(candidate.raw_bytes)) as raw:
            raw.load()
            rgb_image = raw.convert("RGB")
            width, height = rgb_image.size
            pixels = np.asarray(rgb_image)
    except (UnidentifiedImageError, OSError, ValueError):
        return None

    if width < settings.image_min_width or height < settings.image_min_height:
        return None

    aspect = max(width / height, height / width)
    if aspect > settings.image_max_aspect_ratio:
        return None

    return _ValidatedImage(
        url=candidate.url,
        width=width,
        height=height,
        pixels=pixels,
        size_bytes=size_bytes,
        y_position=candidate.y_position,
        in_hero_section=candidate.in_hero_section,
    )


def _strip_solid_bars(candidate: _ValidatedImage) -> _ValidatedImage | None:
    """Crop uniform-color bars off top/bottom. Reject if >= `solid_bar_max_pct`."""
    pixels = candidate.pixels
    height = pixels.shape[0]

    top_bar = _detect_bar_height(pixels, from_top=True)
    bottom_bar = _detect_bar_height(pixels, from_top=False)
    bar_ratio = (top_bar + bottom_bar) / height if height else 0

    if bar_ratio >= settings.image_solid_bar_max_pct:
        return None

    if top_bar == 0 and bottom_bar == 0:
        return candidate

    cropped = pixels[top_bar : height - bottom_bar]
    new_height = cropped.shape[0]
    if new_height < settings.image_min_height:
        return None

    return _ValidatedImage(
        url=candidate.url,
        width=candidate.width,
        height=new_height,
        pixels=cropped,
        size_bytes=candidate.size_bytes,
        y_position=candidate.y_position,
        in_hero_section=candidate.in_hero_section,
    )


def _detect_bar_height(pixels: np.ndarray, *, from_top: bool) -> int:
    """Count consecutive rows whose per-channel spread is below tolerance."""
    rows = pixels if from_top else pixels[::-1]
    tolerance = settings.image_solid_bar_tolerance
    bar_rows = 0
    for row in rows:
        channel_max = row.max(axis=0)
        channel_min = row.min(axis=0)
        if int(channel_max.max()) - int(channel_min.min()) < tolerance:
            bar_rows += 1
        else:
            break
    return bar_rows


def _score(candidate: _ValidatedImage) -> float:
    """Score = clamped pixel area + color variance + position bonuses."""
    area_megapixels = (candidate.width * candidate.height) / 1_000_000
    score = min(area_megapixels, _MEGAPIXEL_CAP)
    score += _color_variance(candidate.pixels) * 2.0

    if candidate.y_position is not None and candidate.y_position < _ABOVE_FOLD_PIXEL_Y:
        score += 3.0
    if candidate.in_hero_section:
        score += 5.0

    return score


def _color_variance(pixels: np.ndarray) -> float:
    """Normalised std-dev across RGB channels. 0 = flat, ~1 = very diverse."""
    if pixels.size == 0:
        return 0.0
    std = float(np.std(pixels.astype(np.float32)))
    return std / 255.0


def _dedupe(scored: list[tuple[_ValidatedImage, float]]) -> list[tuple[_ValidatedImage, float]]:
    """Drop perceptual-hash duplicates, keeping the highest scorer."""
    scored.sort(key=lambda pair: pair[1], reverse=True)
    kept: list[tuple[_ValidatedImage, float]] = []
    hashes: list[imagehash.ImageHash] = []
    threshold = settings.image_phash_distance_threshold

    for candidate, score in scored:
        image = Image.fromarray(candidate.pixels)
        phash = imagehash.phash(image)
        if any((phash - prior) < threshold for prior in hashes):
            continue
        hashes.append(phash)
        kept.append((candidate, score))
    return kept

"""Unit tests for the image filter.

Synthetic images generated with Pillow so we don't depend on fixture
files. Each test isolates one branch of the pipeline.
"""

from __future__ import annotations

import io

import pytest
from PIL import Image

from backend.scraper.image_filter import CandidateImage, filter_and_rank


def _make_image_bytes(
    *,
    width: int,
    height: int,
    fill: tuple[int, int, int] = (120, 45, 200),
    noise: bool = True,
) -> bytes:
    """Create a solid-or-noisy PNG in memory."""
    image = Image.new("RGB", (width, height), color=fill)
    if noise:
        pixels = image.load()
        # Deterministic "noise": diagonal bands vary color a lot so the
        # phash distance between distinct images is above threshold.
        for y in range(0, height, 4):
            for x in range(0, width, 4):
                pixels[x, y] = ((x * 5) % 256, (y * 7) % 256, ((x + y) * 3) % 256)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _candidate(
    *,
    url: str,
    width: int,
    height: int,
    fill: tuple[int, int, int] = (120, 45, 200),
    noise: bool = True,
) -> CandidateImage:
    return CandidateImage(
        url=url,
        raw_bytes=_make_image_bytes(width=width, height=height, fill=fill, noise=noise),
    )


@pytest.mark.asyncio
async def test_rejects_too_small() -> None:
    small = _candidate(url="https://cdn.example.com/small.png", width=200, height=150)
    result = await filter_and_rank([small])
    assert result == []


@pytest.mark.asyncio
async def test_rejects_extreme_aspect_ratio() -> None:
    banner = _candidate(url="https://cdn.example.com/banner.png", width=2400, height=200)
    result = await filter_and_rank([banner])
    assert result == []


@pytest.mark.asyncio
async def test_rejects_social_cdn_url() -> None:
    social = _candidate(
        url="https://scontent.fbcdn.net/v/image.png", width=800, height=600
    )
    result = await filter_and_rank([social])
    assert result == []


@pytest.mark.asyncio
async def test_dedupes_identical_images() -> None:
    identical_bytes = _make_image_bytes(width=800, height=600)
    first = CandidateImage(url="https://cdn.example.com/a.png", raw_bytes=identical_bytes)
    second = CandidateImage(url="https://cdn.example.com/b.png", raw_bytes=identical_bytes)

    result = await filter_and_rank([first, second])

    assert len(result) == 1
    assert result[0].url in {"https://cdn.example.com/a.png", "https://cdn.example.com/b.png"}


@pytest.mark.asyncio
async def test_accepts_well_formed_image_and_returns_ranked_payload() -> None:
    valid = _candidate(url="https://cdn.example.com/hero.png", width=1200, height=800)
    result = await filter_and_rank([valid])
    assert len(result) == 1
    ranked = result[0]
    assert ranked.url == "https://cdn.example.com/hero.png"
    assert ranked.width == 1200
    assert ranked.height == 800
    assert ranked.score > 0

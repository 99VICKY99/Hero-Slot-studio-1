"""Orchestrates the /fetch-site pipeline.

Composes scraper + palette + image filter. Returns partial results on
partial failure — the contract is "give the LLM whatever we got, let
generation proceed without blocking".
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from backend.scraper.image_filter import CandidateImage, filter_and_rank
from backend.scraper.palette import extract_palette
from backend.scraper.playwright_scraper import ScrapedSite, ScraperError, scrape
from backend.schemas.api import (
    FetchSiteResponse,
    Palette,
    RankedImage,
    SiteMeta,
)

_logger = logging.getLogger("hero_studio.fetch_site")

_FALLBACK_PALETTE = Palette(
    primary="#1a1a2e",
    secondary="#16213e",
    accent="#e94560",
    background="#ffffff",
    text="#0f0f1a",
)


@dataclass(slots=True)
class FetchSiteOutcome:
    """Wrapper returned by the service so the route can distinguish hard
    failures (no data at all) from partial results worth surfacing."""

    response: FetchSiteResponse | None
    error_code: str | None = None
    error_message: str | None = None


async def run_fetch_site(url: str) -> FetchSiteOutcome:
    """Run scrape + palette + image filter. Never raises; returns an outcome."""
    try:
        scraped = await scrape(url)
    except ScraperError as exc:
        _logger.warning("Scraper raised %s for %s: %s", exc.code, url, exc.message)
        return FetchSiteOutcome(
            response=None,
            error_code=exc.code,
            error_message=exc.message,
        )

    palette = _extract_palette_safe(scraped.screenshot_path)
    ranked_images = await _filter_images_safe(scraped.candidate_image_urls)
    meta = SiteMeta(
        title=scraped.extracted_title,
        description=scraped.extracted_description,
    )

    _cleanup_screenshot(scraped.screenshot_path)

    response = FetchSiteResponse(
        palette=palette,
        fonts=[],
        logo=None,
        images=ranked_images,
        meta=meta,
    )
    _log_outcome_summary(url, scraped, response)
    return FetchSiteOutcome(response=response)


def _extract_palette_safe(screenshot_path: Path) -> Palette:
    """Palette extraction is best-effort; a failed read still yields a usable palette."""
    try:
        data = screenshot_path.read_bytes()
    except OSError as exc:
        _logger.warning("Screenshot unreadable at %s: %s", screenshot_path, exc)
        return _FALLBACK_PALETTE

    try:
        return extract_palette(data)
    except Exception as exc:  # noqa: BLE001 — boundary guard
        _logger.warning("Palette extraction failed: %s", exc)
        return _FALLBACK_PALETTE


async def _filter_images_safe(candidate_urls: list[str]) -> list[RankedImage]:
    """Never let the image filter bring down the whole /fetch-site call."""
    if not candidate_urls:
        return []
    candidates = [CandidateImage(url=url) for url in candidate_urls]
    try:
        return await filter_and_rank(candidates)
    except Exception as exc:  # noqa: BLE001 — boundary guard
        _logger.warning("Image filter crashed: %s", exc)
        return []


def _cleanup_screenshot(path: Path) -> None:
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass


def _log_outcome_summary(url: str, scraped: ScrapedSite, response: FetchSiteResponse) -> None:
    _logger.info(
        "fetch-site ok url=%s images_in=%d images_out=%d title_present=%s",
        url,
        len(scraped.candidate_image_urls),
        len(response.images),
        response.meta.title is not None,
    )

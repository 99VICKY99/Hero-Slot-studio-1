"""Playwright-driven site scraper.

Headless Chromium. Returns structured scrape data — stripped HTML,
screenshot path, extracted meta, and candidate image URLs. Raises
`ScraperError` on unreachable URLs or anti-bot blocks; partial
successes return what was gathered.
"""

from __future__ import annotations

import asyncio
import re
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal
from urllib.parse import urljoin

from bs4 import BeautifulSoup

_SCRAPE_TIMEOUT_SECONDS = 15
_NAVIGATION_TIMEOUT_MS = 15_000
_VIEWPORT_WIDTH = 1440
_VIEWPORT_HEIGHT = 900
_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36"
)

ScraperErrorCode = Literal["UNREACHABLE", "BLOCKED", "TIMEOUT"]


class ScraperError(Exception):
    """Raised when the scraper cannot obtain *any* useful data."""

    def __init__(self, code: ScraperErrorCode, message: str) -> None:
        super().__init__(message)
        self.code: ScraperErrorCode = code
        self.message: str = message


@dataclass(slots=True)
class ScrapedSite:
    """Raw scraper output. Consumed by the fetch-site service."""

    html: str
    screenshot_path: Path
    extracted_title: str | None
    extracted_description: str | None
    candidate_image_urls: list[str] = field(default_factory=list)


async def scrape(url: str) -> ScrapedSite:
    """Scrape `url` with a 15s hard timeout. Never swallows errors silently."""
    try:
        return await asyncio.wait_for(_scrape_inner(url), timeout=_SCRAPE_TIMEOUT_SECONDS)
    except asyncio.TimeoutError as exc:
        raise ScraperError("TIMEOUT", f"Scrape of {url} exceeded {_SCRAPE_TIMEOUT_SECONDS}s") from exc


async def _scrape_inner(url: str) -> ScrapedSite:
    """Body of the scrape. Split out so the outer guard can timeout it."""
    from playwright.async_api import Error as PlaywrightError
    from playwright.async_api import TimeoutError as PlaywrightTimeout
    from playwright.async_api import async_playwright

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        try:
            context = await browser.new_context(
                viewport={"width": _VIEWPORT_WIDTH, "height": _VIEWPORT_HEIGHT},
                user_agent=_USER_AGENT,
            )
            page = await context.new_page()
            page.set_default_navigation_timeout(_NAVIGATION_TIMEOUT_MS)

            try:
                response = await page.goto(url, wait_until="networkidle")
            except PlaywrightTimeout as exc:
                raise ScraperError("TIMEOUT", f"Navigation to {url} timed out") from exc
            except PlaywrightError as exc:
                raise ScraperError("UNREACHABLE", f"Couldn't reach {url}: {exc}") from exc

            if response is not None and response.status in (401, 403, 429, 503):
                raise ScraperError(
                    "BLOCKED",
                    f"Site returned status {response.status} — likely blocked",
                )

            return await _collect_page_artifacts(page, url)
        finally:
            await browser.close()


async def _collect_page_artifacts(page: "object", base_url: str) -> ScrapedSite:
    """Pull HTML, screenshot, title, description, and image candidates off the live page."""
    raw_html: str = await page.content()  # type: ignore[attr-defined]
    sanitized_html = _strip_scripts(raw_html)

    screenshot_path = Path(tempfile.mkstemp(prefix="heroshot_", suffix=".png")[1])
    await page.screenshot(path=str(screenshot_path), full_page=False)  # type: ignore[attr-defined]

    soup = BeautifulSoup(sanitized_html, "html.parser")
    title = _first_text(soup, "title") or _meta_content(soup, property_="og:title")
    description = _meta_content(soup, name="description") or _meta_content(
        soup, property_="og:description"
    )
    candidates = _collect_image_candidates(soup, base_url)

    return ScrapedSite(
        html=sanitized_html,
        screenshot_path=screenshot_path,
        extracted_title=title,
        extracted_description=description,
        candidate_image_urls=candidates,
    )


def _strip_scripts(html: str) -> str:
    """Remove every <script> element before anything else touches the HTML."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all("script"):
        tag.decompose()
    return str(soup)


def _first_text(soup: BeautifulSoup, tag: str) -> str | None:
    node = soup.find(tag)
    if node is None:
        return None
    text = node.get_text(strip=True)
    return text or None


def _meta_content(
    soup: BeautifulSoup,
    *,
    name: str | None = None,
    property_: str | None = None,
) -> str | None:
    attrs: dict[str, str] = {}
    if name is not None:
        attrs["name"] = name
    if property_ is not None:
        attrs["property"] = property_
    node = soup.find("meta", attrs=attrs)
    if node is None:
        return None
    content = node.get("content")
    if isinstance(content, str) and content.strip():
        return content.strip()
    return None


def _collect_image_candidates(soup: BeautifulSoup, base_url: str) -> list[str]:
    """Gather <img>, <picture>, og:image, twitter:image, CSS url() candidates."""
    seen: set[str] = set()
    collected: list[str] = []

    def _push(raw: str | None) -> None:
        if not raw:
            return
        absolute = urljoin(base_url, raw.strip())
        if absolute in seen:
            return
        if not absolute.lower().startswith(("http://", "https://")):
            return
        seen.add(absolute)
        collected.append(absolute)

    for img in soup.find_all("img"):
        _push(img.get("src"))
        _push(img.get("data-src"))
        srcset = img.get("srcset")
        if isinstance(srcset, str):
            for candidate in srcset.split(","):
                _push(candidate.strip().split(" ")[0])

    for source in soup.find_all("source"):
        srcset = source.get("srcset")
        if isinstance(srcset, str):
            for candidate in srcset.split(","):
                _push(candidate.strip().split(" ")[0])

    _push(_meta_content(soup, property_="og:image"))
    _push(_meta_content(soup, name="twitter:image"))

    for match in re.finditer(r"url\(([^)]+)\)", soup.decode(), flags=re.IGNORECASE):
        raw = match.group(1).strip().strip("'\"")
        _push(raw)

    return collected

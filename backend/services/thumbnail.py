"""Thumbnail rendering via Playwright screenshots.

v0.4 will wire this up to the variation workflow (200x100 previews
of each AI-generated variation). v0.1 ships the signature only so
call sites can type-check against it today.
"""

from __future__ import annotations


THUMBNAIL_WIDTH = 200
THUMBNAIL_HEIGHT = 100


async def render_thumbnail(html: str, css: str) -> bytes:
    """Render `html` + `css` to a 200x100 PNG thumbnail.

    Implementation deferred to v0.4 (CLAUDE.md §3 build order). Will
    spin up a Playwright page, set content to the combined HTML, and
    take a viewport screenshot sized to (THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT).
    """
    # TODO(v0.4): wire this to Playwright.
    raise NotImplementedError("render_thumbnail is deferred to v0.4")

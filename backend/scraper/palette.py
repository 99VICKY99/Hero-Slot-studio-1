"""Pylette-backed palette extraction.

Extracts 5 dominant colors and maps them onto the five-slot semantic
palette (primary, secondary, accent, background, text) using lightness
and saturation heuristics.
"""

from __future__ import annotations

import colorsys
import tempfile
from dataclasses import dataclass
from pathlib import Path

from backend.schemas.api import Palette

_PALETTE_SIZE = 5
_FALLBACK_PALETTE = Palette(
    primary="#1a1a2e",
    secondary="#16213e",
    accent="#e94560",
    background="#ffffff",
    text="#0f0f1a",
)


@dataclass(slots=True, frozen=True)
class _Swatch:
    """Internal color descriptor with lightness + saturation cached."""

    hex_code: str
    red: int
    green: int
    blue: int
    lightness: float
    saturation: float


def extract_palette(image_bytes: bytes) -> Palette:
    """Extract a 5-slot semantic palette from raw image bytes.

    Falls back to a safe neutral palette if Pylette returns no colors;
    generation must never block on palette failure.
    """
    if not image_bytes:
        return _FALLBACK_PALETTE

    swatches = _extract_swatches(image_bytes)
    if not swatches:
        return _FALLBACK_PALETTE

    return _map_swatches_to_slots(swatches)


def _extract_swatches(image_bytes: bytes) -> list[_Swatch]:
    """Run Pylette on the bytes and convert each color into a `_Swatch`."""
    from Pylette import extract_colors  # local import keeps top-level cheap

    tmp_path = Path(tempfile.mkstemp(prefix="palette_", suffix=".png")[1])
    try:
        tmp_path.write_bytes(image_bytes)
        palette = extract_colors(image=str(tmp_path), palette_size=_PALETTE_SIZE)
    finally:
        tmp_path.unlink(missing_ok=True)

    swatches: list[_Swatch] = []
    for color in palette:
        rgb = getattr(color, "rgb", None)
        if rgb is None or len(rgb) < 3:
            continue
        red, green, blue = int(rgb[0]), int(rgb[1]), int(rgb[2])
        swatches.append(_build_swatch(red, green, blue))
    return swatches


def _build_swatch(red: int, green: int, blue: int) -> _Swatch:
    hue, lightness, saturation = colorsys.rgb_to_hls(red / 255, green / 255, blue / 255)
    del hue  # unused; kept for readability
    return _Swatch(
        hex_code=f"#{red:02x}{green:02x}{blue:02x}",
        red=red,
        green=green,
        blue=blue,
        lightness=lightness,
        saturation=saturation,
    )


def _map_swatches_to_slots(swatches: list[_Swatch]) -> Palette:
    """Map the raw swatch list onto the five semantic slots."""
    by_lightness = sorted(swatches, key=lambda swatch: swatch.lightness)
    darkest = by_lightness[0]
    lightest = by_lightness[-1]

    # Background = lightest if it is actually light; otherwise darkest flips
    # the polarity (dark-mode-feeling site) and text follows suit.
    if lightest.lightness >= 0.75:
        background = lightest
        text = darkest
    else:
        background = darkest
        text = lightest

    remaining = [swatch for swatch in swatches if swatch not in (background, text)]
    if not remaining:
        remaining = [darkest, lightest]

    by_saturation = sorted(remaining, key=lambda swatch: swatch.saturation, reverse=True)
    primary = by_saturation[0]
    accent = by_saturation[-1] if len(by_saturation) > 1 else primary
    secondary = by_saturation[1] if len(by_saturation) > 2 else primary

    return Palette(
        primary=primary.hex_code,
        secondary=secondary.hex_code,
        accent=accent.hex_code,
        background=background.hex_code,
        text=text.hex_code,
    )

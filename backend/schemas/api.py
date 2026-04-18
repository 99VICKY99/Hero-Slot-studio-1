"""Pydantic models for HTTP request/response boundaries.

Every shape that crosses the HTTP boundary is defined here. Internal
domain shapes (scraper results, ranked images) live in their own modules.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


# --- Standard error envelope (CLAUDE.md §14) -------------------------------

ErrorCode = Literal[
    "BAD_REQUEST",
    "SSRF_BLOCKED",
    "RATE_LIMIT",
    "LLM_TIMEOUT",
    "LLM_BAD_SHAPE",
    "LLM_API_ERROR",
    "INTERNAL_ERROR",
    "UNREACHABLE",
    "BLOCKED",
]


class ErrorResponse(BaseModel):
    """Authoritative error shape. All error paths emit exactly this."""

    error: str = Field(..., description="Human-readable message.")
    code: ErrorCode
    hint: str | None = Field(default=None, description="Optional action for the user.")
    context: dict[str, Any] = Field(default_factory=dict)


# --- /health ---------------------------------------------------------------

Protocol = Literal["openai", "anthropic"]


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    model: str
    protocol: Protocol


# --- /fetch-site -----------------------------------------------------------


class FetchSiteRequest(BaseModel):
    """User-supplied site URL. Validation + SSRF check happens in the route."""

    url: HttpUrl


class Palette(BaseModel):
    """Five-slot palette mapped from Pylette clusters."""

    primary: str
    secondary: str
    accent: str
    background: str
    text: str


class LogoAsset(BaseModel):
    """Scraped brand logo. Null when detection failed — generation continues without it."""

    url: str
    data_base64: str


class RankedImage(BaseModel):
    """An image that passed the full filter + scoring pipeline."""

    url: str
    width: int = Field(..., ge=1)
    height: int = Field(..., ge=1)
    score: float

    model_config = ConfigDict(frozen=True)


class SiteMeta(BaseModel):
    """Title + description extracted from the DOM."""

    title: str | None = None
    description: str | None = None


class FetchSiteResponse(BaseModel):
    """
    Partial-result contract: any field may be empty/None if the scrape
    succeeded for some layers but not others. Routes never raise on
    partial failure; they return what was obtained.
    """

    palette: Palette
    fonts: list[str] = Field(default_factory=list)
    logo: LogoAsset | None = None
    images: list[RankedImage] = Field(default_factory=list)
    meta: SiteMeta = Field(default_factory=SiteMeta)

"""POST /fetch-site — URL → palette / fonts / logo / filtered images.

Route is intentionally thin: validate input, run SSRF guard, delegate
to the fetch-site service, translate service outcomes into HTTP
responses. Business logic lives in `services/fetch_site_service.py`.
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.domain.ssrf import is_safe_url
from backend.schemas.api import ErrorResponse, FetchSiteRequest, FetchSiteResponse
from backend.services.fetch_site_service import FetchSiteOutcome, run_fetch_site

_logger = logging.getLogger("hero_studio.routes.fetch_site")

router = APIRouter(tags=["fetch-site"])

# Hard outer timeout so no single request can hold a worker hostage.
_REQUEST_TIMEOUT_SECONDS = 15


@router.post(
    "/fetch-site",
    response_model=FetchSiteResponse,
    responses={400: {"model": ErrorResponse}, 502: {"model": ErrorResponse}},
)
async def fetch_site(payload: FetchSiteRequest) -> FetchSiteResponse | JSONResponse:
    url = str(payload.url)

    if not is_safe_url(url):
        return _error_response(
            status=400,
            code="SSRF_BLOCKED",
            message="URL failed safety check.",
            hint="Use a public http(s) URL. Loopback and private addresses are rejected.",
            context={"url": url},
        )

    try:
        outcome = await asyncio.wait_for(run_fetch_site(url), timeout=_REQUEST_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        # Scraper outer timeout mapped to UNREACHABLE: from the user's
        # perspective, the site didn't respond. Keeps the error-code
        # registry tight (CLAUDE.md §14) without inventing new codes.
        _logger.warning("fetch-site hit outer 15s timeout for %s", url)
        return _error_response(
            status=200,
            code="UNREACHABLE",
            message="Scraping took too long.",
            hint="Try again, or attach assets manually via the + button.",
            context={"url": url},
        )

    return _outcome_to_response(outcome, url)


def _outcome_to_response(
    outcome: FetchSiteOutcome, url: str
) -> FetchSiteResponse | JSONResponse:
    """Translate a service outcome into either the success model or an error."""
    if outcome.response is not None:
        return outcome.response

    code = outcome.error_code or "INTERNAL_ERROR"
    message = outcome.error_message or "Scraping failed."
    hint = _hint_for(code)
    # UNREACHABLE / BLOCKED are documented as "payload" in CLAUDE.md §14 —
    # we surface them as 200 so the frontend can show the assets-manual
    # hint rather than a hard failure. Everything else is a real 5xx.
    if code in {"UNREACHABLE", "BLOCKED"}:
        return _error_response(
            status=200,
            code=code,
            message=message,
            hint=hint,
            context={"url": url},
        )
    return _error_response(
        status=502,
        code="INTERNAL_ERROR",
        message=message,
        hint=hint,
        context={"url": url},
    )


def _hint_for(code: str) -> str:
    mapping = {
        "UNREACHABLE": "Check the URL, or attach assets manually with the + button.",
        "BLOCKED": "This site blocks automated access — attach assets with the + button.",
        "TIMEOUT": "The page is slow. Try again, or attach assets manually.",
    }
    return mapping.get(code, "Retry, or attach assets manually.")


def _error_response(
    *, status: int, code: str, message: str, hint: str, context: dict
) -> JSONResponse:
    body = ErrorResponse(error=message, code=code, hint=hint, context=context)
    return JSONResponse(status_code=status, content=body.model_dump())

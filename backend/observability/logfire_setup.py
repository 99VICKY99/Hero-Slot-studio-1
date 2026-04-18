"""Logfire bootstrapping + request-id middleware.

Logfire is optional — when LOGFIRE_TOKEN is unset we install a no-op
span so service code can call `with span(...)` unconditionally.
Every log line gets a `request_id` so spans correlate across layers.
"""

from __future__ import annotations

import contextlib
import logging
import uuid
from collections.abc import AsyncIterator, Iterator
from contextvars import ContextVar
from typing import Any

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from backend.config import settings

_logger = logging.getLogger("hero_studio")

_request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)


def get_request_id() -> str | None:
    """Return the current request's id, or None outside a request scope."""
    return _request_id_var.get()


class _RequestIdFilter(logging.Filter):
    """Injects `request_id` onto every LogRecord so handlers can render it."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id_var.get() or "-"
        return True


@contextlib.contextmanager
def _noop_span(_name: str, **_attributes: Any) -> Iterator[None]:
    """Fallback span used when Logfire is not configured."""
    yield


# Service code imports `span` from this module. We rebind it at configure time.
span = _noop_span


def configure_logfire() -> None:
    """Initialise Logfire if a token is present; otherwise install a no-op."""
    global span

    _attach_request_id_filter()

    if not settings.LOGFIRE_TOKEN:
        span = _noop_span
        _logger.info("Logfire disabled (LOGFIRE_TOKEN unset)")
        return

    try:
        import logfire  # type: ignore[import-not-found]
    except ImportError:
        span = _noop_span
        _logger.warning("Logfire package not installed — using no-op span")
        return

    logfire.configure(token=settings.LOGFIRE_TOKEN, send_to_logfire="if-token-present")
    span = logfire.span  # real tracer
    _logger.info("Logfire initialised")


def _attach_request_id_filter() -> None:
    """Attach the request-id filter to the root logger once."""
    root = logging.getLogger()
    if any(isinstance(existing, _RequestIdFilter) for existing in root.filters):
        return
    root.addFilter(_RequestIdFilter())


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Assign a UUID per request and stash it in the ContextVar."""

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        incoming = request.headers.get("x-request-id")
        request_id = incoming or uuid.uuid4().hex
        token = _request_id_var.set(request_id)
        try:
            response = await call_next(request)
        finally:
            _request_id_var.reset(token)
        response.headers["x-request-id"] = request_id
        return response


def install_request_id_middleware(app: FastAPI) -> None:
    """Register the request-id middleware on the FastAPI app."""
    app.add_middleware(RequestIdMiddleware)


@contextlib.asynccontextmanager
async def logfire_lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """FastAPI lifespan hook that wires observability up at startup."""
    configure_logfire()
    yield

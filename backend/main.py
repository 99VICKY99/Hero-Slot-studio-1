"""FastAPI application entrypoint.

Run locally with `uvicorn backend.main:app --reload` or, inside the
Docker container, `python -m backend.main`. Reads settings from
`backend/config.py` — no env vars are read here directly.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.observability.logfire_setup import (
    _attach_request_id_filter,  # noqa: PLC2701 — internal hook, called early
    install_request_id_middleware,
    logfire_lifespan,
)
from backend.routes import all_routers
from backend.schemas.api import ErrorResponse

_logger = logging.getLogger("hero_studio.main")

_FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"


def _configure_logging() -> None:
    """Minimal logging config. Attach request-id filter to handlers up-front so
    any log emitted before the lifespan starts still has the `request_id` field."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s request=%(request_id)s %(message)s",
    )
    _attach_request_id_filter()


def _install_error_handlers(app: FastAPI) -> None:
    """Map common exceptions to the standard error shape (CLAUDE.md §14)."""

    @app.exception_handler(RequestValidationError)
    async def _bad_request(_: Request, exc: RequestValidationError) -> JSONResponse:
        body = ErrorResponse(
            error="Request body failed validation.",
            code="BAD_REQUEST",
            hint="Check field names and types against the API schema.",
            context={"errors": exc.errors()},
        )
        return JSONResponse(status_code=400, content=body.model_dump())

    @app.exception_handler(Exception)
    async def _internal(_: Request, exc: Exception) -> JSONResponse:
        # Never leak stack traces to clients (CLAUDE.md §13). Server logs
        # still carry the full traceback.
        _logger.exception("Unhandled exception: %s", exc)
        body = ErrorResponse(
            error="Something went wrong on our end.",
            code="INTERNAL_ERROR",
            hint="Retry in a moment. If it persists, check server logs.",
            context={},
        )
        return JSONResponse(status_code=500, content=body.model_dump())


def _install_cors(app: FastAPI) -> None:
    """Allowlist from `ALLOWED_ORIGINS` env. No wildcard — always explicit."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )


def _mount_frontend(app: FastAPI) -> None:
    """Serve the built Vite SPA. `check_dir=False` keeps this safe pre-build."""
    app.mount(
        "/",
        StaticFiles(directory=str(_FRONTEND_DIST_DIR), html=True, check_dir=False),
        name="frontend",
    )


def create_app() -> FastAPI:
    _configure_logging()

    app = FastAPI(
        title="Hero Slot Studio",
        version="0.1.0",
        lifespan=logfire_lifespan,
    )

    install_request_id_middleware(app)
    _install_cors(app)
    _install_error_handlers(app)

    for router in all_routers:
        app.include_router(router)

    _mount_frontend(app)  # must be last: catch-all route
    return app


app: FastAPI = create_app()


def _run_dev_server() -> None:
    """Only used by `python -m backend.main` inside the container."""
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.BIND_HOST,
        port=settings.PORT,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    _run_dev_server()


__all__: list[str] = ["app", "create_app"]

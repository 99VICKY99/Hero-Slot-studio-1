"""GET /health — liveness probe.

Returns the configured model and the protocol family that model speaks
(OpenAI chat-completions or Anthropic messages). Used by Docker's
healthcheck and as a quick "is anything wired up" smoke test.
"""

from __future__ import annotations

from typing import Final

from fastapi import APIRouter

from backend.config import settings
from backend.schemas.api import HealthResponse, Protocol

router = APIRouter(tags=["health"])

# Explicit lookup: any model whose ID starts with one of these prefixes
# speaks that protocol. The full registry lives in `backend/llm/registry.py`
# (built in W2); this map is the subset needed for /health before LLMs
# are wired. Keep the two in sync when W2 lands.
_ANTHROPIC_MODEL_PREFIXES: Final[tuple[str, ...]] = ("minimax-",)


def _protocol_for(model_name: str) -> Protocol:
    """Return the protocol family for `model_name`. Defaults to openai."""
    if any(model_name.startswith(prefix) for prefix in _ANTHROPIC_MODEL_PREFIXES):
        return "anthropic"
    return "openai"


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        model=settings.LLM_MODEL,
        protocol=_protocol_for(settings.LLM_MODEL),
    )

"""Integration test: GET /health.

Uses FastAPI's TestClient to hit the real router stack. We set the
LLM_API_KEY env var before importing the app so `Settings()` validates.
"""

from __future__ import annotations

import importlib
import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client() -> TestClient:
    os.environ.setdefault("LLM_API_KEY", "test-key-not-real")
    # Re-import in case another test polluted cached settings.
    import backend.config as config_module

    importlib.reload(config_module)
    import backend.main as main_module

    importlib.reload(main_module)

    return TestClient(main_module.app)


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200


def test_health_payload_has_model_and_protocol(client: TestClient) -> None:
    payload = client.get("/health").json()
    assert payload["status"] == "ok"
    assert isinstance(payload["model"], str) and payload["model"]
    assert payload["protocol"] in {"openai", "anthropic"}


def test_health_protocol_matches_default_minimax_model(client: TestClient) -> None:
    payload = client.get("/health").json()
    if payload["model"].startswith("minimax-"):
        assert payload["protocol"] == "anthropic"
    else:
        assert payload["protocol"] == "openai"

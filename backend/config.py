"""Singleton settings loader.

The ONLY place in the codebase that reads environment variables.
Fails fast at startup if required config is missing.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed configuration loaded from `.env` and process environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- LLM provider (OpenCode Go) ---
    LLM_API_KEY: str = Field(..., min_length=1, description="OpenCode Go API key")
    LLM_MODEL: str = Field(default="minimax-m2.7")
    LLM_BASE_URL: str = Field(default="https://opencode.ai/zen/go/v1")
    LLM_TIMEOUT: int = Field(default=180, ge=1, le=600)
    LLM_VARIATIONS: int = Field(default=3, ge=1, le=10)

    # --- Server ---
    PORT: int = Field(default=8787, ge=1, le=65535)
    BIND_HOST: str = Field(default="0.0.0.0")
    ALLOWED_ORIGINS: str = Field(default="http://localhost:8787")

    # --- Observability (optional) ---
    LOGFIRE_TOKEN: str | None = Field(default=None)

    # --- Image filter thresholds (ARCHITECTURE.md §11) ---
    # Kept in config rather than hardcoded so Week 0 calibration can tune
    # them without code changes.
    image_min_width: int = Field(default=400, ge=1)
    image_min_height: int = Field(default=300, ge=1)
    image_max_aspect_ratio: float = Field(default=5.0, gt=1.0)
    image_min_file_size_kb: int = Field(default=15, ge=1)
    image_solid_bar_tolerance: int = Field(default=5, ge=0, le=255)
    image_solid_bar_max_pct: float = Field(default=0.20, ge=0.0, le=1.0)
    image_phash_distance_threshold: int = Field(default=6, ge=0)

    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def _origins_nonempty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("ALLOWED_ORIGINS must contain at least one origin")
        return value

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse CSV into a trimmed, non-empty list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def _load_settings() -> Settings:
    return Settings()


settings: Settings = _load_settings()

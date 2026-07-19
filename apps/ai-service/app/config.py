"""
Config for apps/ai-service. Mirrors packages/config's fail-fast philosophy
(docs/PHASE_0_ARCHITECTURE.md §8) using pydantic-settings instead of Zod,
since this service is Python, not the shared Node env schema.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Which provider AIProvider.get() returns — see providers/base.py. Only
    # "anthropic" is actually implemented in this pass; see TECH_DEBT.md.
    ai_provider: str = "anthropic"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5"

    # Shared secret apps/api sends on every request to this service, checked
    # by app/main.py's dependency. This service isn't meant to be reachable
    # directly from the internet — see docs/PHASE_0_ARCHITECTURE.md's AI
    # Layer Design ("exposes a small internal API that NestJS calls — it
    # isn't user-facing directly").
    internal_api_key: str | None = None

    port: int = 8000


@lru_cache
def get_settings() -> Settings:
    return Settings()

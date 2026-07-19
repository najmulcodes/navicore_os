from fastapi import FastAPI

from app.config import get_settings
from app.routers import chat, summarize

app = FastAPI(
    title="NAVICORE OS — AI Service",
    description=(
        "Internal service — see docs/PHASE_0_ARCHITECTURE.md's AI Layer Design. "
        "Not meant to be reachable directly from the internet; apps/api is the only caller."
    ),
    version="0.1.0",
)

app.include_router(chat.router)
app.include_router(summarize.router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Unauthenticated on purpose, same reasoning as apps/api's /health —
    load balancers / Railway health checks need this to not require a secret."""
    settings = get_settings()
    return {
        "status": "ok",
        "provider": settings.ai_provider,
        "provider_configured": str(bool(settings.anthropic_api_key)),
    }

from anthropic import AsyncAnthropic

from app.config import get_settings
from app.providers.base import AIProvider, ChatMessage


class AnthropicProvider(AIProvider):
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set — AI endpoints will fail until it is. "
                "See apps/ai-service/.env.example."
            )
        self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    async def complete(self, messages: list[ChatMessage], system: str | None = None) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=4096,
            system=system or "You are the NAVICORE OS assistant.",
            messages=[{"role": m.role, "content": m.content} for m in messages],
        )
        # Assumes a single text content block — real responses can include
        # tool_use blocks once function calling is wired up. See TECH_DEBT.md.
        return "".join(block.text for block in response.content if block.type == "text")

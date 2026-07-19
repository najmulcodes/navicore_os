"""
Provider-agnostic model routing (docs/PHASE_0_ARCHITECTURE.md's AI Layer
Design: "Model calls go through a provider-agnostic abstraction so you can
swap Claude, GPT, or a local model without touching business logic").

Only AnthropicProvider is actually implemented in this pass — the interface
is real and swappable, but there's no second provider to prove it against
yet. See TECH_DEBT.md.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ChatMessage:
    role: str  # "user" | "assistant"
    content: str


class AIProvider(ABC):
    @abstractmethod
    async def complete(self, messages: list[ChatMessage], system: str | None = None) -> str:
        """Returns the full completion text. Streaming is a TECH_DEBT.md item."""
        raise NotImplementedError


def get_provider() -> AIProvider:
    from app.config import get_settings
    from app.providers.anthropic_provider import AnthropicProvider

    settings = get_settings()
    if settings.ai_provider == "anthropic":
        return AnthropicProvider()

    raise ValueError(
        f"Unknown AI_PROVIDER '{settings.ai_provider}' — only 'anthropic' is implemented. "
        "See app/providers/base.py."
    )

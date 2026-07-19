from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import require_internal_api_key
from app.providers.base import ChatMessage, get_provider

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessageIn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn]
    system: str | None = None


class ChatResponse(BaseModel):
    content: str


@router.post("", response_model=ChatResponse, dependencies=[Depends(require_internal_api_key)])
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Single-turn completion — apps/api's AiModule persists the conversation
    history (AiConversation/AiMessage) and sends the full message list each
    call, per docs/PHASE_0_ARCHITECTURE.md's "AI Layer... this service isn't
    user-facing directly" design. No streaming yet — see TECH_DEBT.md.
    """
    provider = get_provider()
    content = await provider.complete(
        messages=[ChatMessage(role=m.role, content=m.content) for m in request.messages],
        system=request.system,
    )
    return ChatResponse(content=content)

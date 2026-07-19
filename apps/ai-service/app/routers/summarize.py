from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import require_internal_api_key
from app.providers.base import ChatMessage, get_provider

router = APIRouter(prefix="/summarize", tags=["summarize"])


class SummarizeRequest(BaseModel):
    text: str
    max_sentences: int = 3


class SummarizeResponse(BaseModel):
    summary: str


@router.post("", response_model=SummarizeResponse, dependencies=[Depends(require_internal_api_key)])
async def summarize(request: SummarizeRequest) -> SummarizeResponse:
    """
    Backs "document/meeting summarization" from the Phase 0 AI Layer module
    list. Stateless — unlike /chat, nothing here needs AiConversation
    persistence, so apps/api can call this directly without creating one.
    """
    provider = get_provider()
    summary = await provider.complete(
        messages=[
            ChatMessage(
                role="user",
                content=(
                    f"Summarize the following in at most {request.max_sentences} sentences. "
                    f"Return only the summary, no preamble.\n\n{request.text}"
                ),
            )
        ],
    )
    return SummarizeResponse(summary=summary.strip())

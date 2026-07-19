from fastapi import Header, HTTPException, status

from app.config import get_settings


async def require_internal_api_key(x_internal_api_key: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if not settings.internal_api_key:
        # Fail open only in explicit local-dev-without-secret setups is NOT
        # what this does — fail CLOSED if the operator hasn't set a secret,
        # since an unset secret almost certainly means "not configured yet",
        # not "intentionally public".
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="INTERNAL_API_KEY is not configured on this service.",
        )
    if x_internal_api_key != settings.internal_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal API key")

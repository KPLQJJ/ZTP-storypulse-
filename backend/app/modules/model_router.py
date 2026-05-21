"""
Model-to-platform routing engine.

Resolves the best (ApiProvider, api_key, base_url) tuple for a given model name,
considering priority, circuit breaker state, health status, and fallback flags.
"""

import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.billing import AiModel
from app.models.api_provider import ApiProvider
from app.modules.circuit_breaker import circuit_breaker
from app.modules.crypto_utils import decrypt_api_key

logger = logging.getLogger(__name__)


class NoProviderAvailableError(RuntimeError):
    """No usable platform found for the given model."""
    pass


@dataclass
class ResolvedProvider:
    provider_name: str
    display_name: str
    base_url: str
    api_key: str  # decrypted plain text
    model_id: str  # the actual API model_id string
    ai_model_db_id: int
    is_fallback: bool


def resolve_provider(
    db: Session,
    ai_model_db_id: int,
    strategy: str = "priority",
) -> ResolvedProvider:
    """
    Given an ai_models.id (integer PK), find the best platform to call.

    Resolution order:
      1. ai_models WHERE id = ? AND is_active = 1
      2. Sort by priority ASC
      3. Exclude platforms where circuit breaker is OPEN
      4. Exclude platforms where health_status = 'down'
      5. Use is_fallback = 0 first; fall back to is_fallback = 1 if all main platforms fail

    Returns ResolvedProvider with decrypted api_key.
    Raises NoProviderAvailableError if no usable platform is found.
    """
    model_row = db.query(AiModel).filter(AiModel.id == ai_model_db_id, AiModel.is_active == 1).first()
    if not model_row:
        raise NoProviderAvailableError(f"AI model id={ai_model_db_id} not found or inactive")

    # If this model row has a provider_id, we're in the new polymorphic system.
    # If not, fall back to legacy behavior (use provider string from env).
    if model_row.provider_id is None:
        return _resolve_legacy(model_row)

    # Collect all rows with the same model name (cross-platform entries)
    candidates = (
        db.query(AiModel)
        .filter(
            AiModel.name == model_row.name,
            AiModel.is_active == 1,
            AiModel.provider_id.isnot(None),
        )
        .order_by(AiModel.priority.asc())
        .all()
    )

    if not candidates:
        raise NoProviderAvailableError(f"No active platform entries for model '{model_row.name}'")

    # Split into main vs fallback
    main_candidates = [c for c in candidates if not c.is_fallback]
    fallback_candidates = [c for c in candidates if c.is_fallback]

    # Try main candidates first
    for candidate in main_candidates:
        provider = _try_candidate(db, candidate)
        if provider:
            return provider

    # Fall back to fallback candidates
    for candidate in fallback_candidates:
        provider = _try_candidate(db, candidate)
        if provider:
            logger.warning("Using fallback platform for model '%s': %s", model_row.name, provider.provider_name)
            return provider

    raise NoProviderAvailableError(
        f"All platforms for model '{model_row.name}' are unavailable "
        f"(circuit breaker open or health check failed)"
    )


def _resolve_legacy(model_row: AiModel) -> ResolvedProvider:
    """Legacy path: model has no provider_id. Use provider string + env vars."""
    import os
    key = os.getenv("DEEPSEEK_API_KEY", "")
    url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    if not key:
        raise NoProviderAvailableError("Legacy mode: DEEPSEEK_API_KEY not set in environment")
    return ResolvedProvider(
        provider_name=model_row.provider,
        display_name=model_row.provider,
        base_url=url,
        api_key=key,
        model_id=model_row.model_id,
        ai_model_db_id=model_row.id,
        is_fallback=False,
    )


def _try_candidate(db: Session, candidate: AiModel) -> ResolvedProvider | None:
    """Check if a candidate platform is usable. Returns ResolvedProvider or None."""
    provider = db.get(ApiProvider, candidate.provider_id)
    if not provider or not provider.is_active:
        return None

    # Circuit breaker check
    if not circuit_breaker.allow_request(provider.name):
        logger.debug("Circuit breaker OPEN for %s, skipping", provider.name)
        return None

    # Health status check
    if provider.health_status == "down":
        logger.debug("Health status 'down' for %s, skipping", provider.name)
        return None

    return ResolvedProvider(
        provider_name=provider.name,
        display_name=provider.display_name,
        base_url=provider.base_url,
        api_key=decrypt_api_key(provider.api_key),
        model_id=candidate.model_id,
        ai_model_db_id=candidate.id,
        is_fallback=bool(candidate.is_fallback),
    )


def resolve_by_name(
    db: Session,
    model_name: str,
    strategy: str = "priority",
) -> ResolvedProvider:
    """
    Convenience: resolve by human-readable model name (e.g. "DeepSeek-V4 Flash").

    Finds the best-priority active entry for that name.
    """
    model_row = (
        db.query(AiModel)
        .filter(AiModel.name == model_name, AiModel.is_active == 1)
        .order_by(AiModel.priority.asc())
        .first()
    )
    if not model_row:
        raise NoProviderAvailableError(f"Model '{model_name}' not found or inactive")
    return resolve_provider(db, model_row.id, strategy)

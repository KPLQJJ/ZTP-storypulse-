import logging

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import limiter
from app.models.model_preference import UserModelPreference
from app.models.billing import AiModel
from app.models.user import User
from app.modules.auth import get_current_user
from app.schemas import ModelPreferenceCreate, ModelPreferenceOut, ModelPreferenceResolved

logger = logging.getLogger(__name__)
router = APIRouter(tags=["model-preferences"])


# ── CRUD ────────────────────────────────────────────────────

@router.get("/model-preferences", response_model=list[ModelPreferenceOut])
@limiter.limit("60/minute")
def list_preferences(
    request: Request,
    novel_id: int | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's model preferences. Filter by novel_id optionally."""
    q = db.query(UserModelPreference).filter(UserModelPreference.user_id == user.id)
    if novel_id is not None:
        q = q.filter(UserModelPreference.novel_id == novel_id)
    return q.order_by(UserModelPreference.application_type).all()


@router.put("/model-preferences", response_model=ModelPreferenceOut)
@limiter.limit("30/minute")
def upsert_preference(
    request: Request,
    req: ModelPreferenceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update a model preference. Unique on (user_id, app_type, novel_id)."""
    # Validate model exists and is active
    model = db.get(AiModel, req.model_id)
    if not model or model.is_active != 1:
        raise HTTPException(status_code=400, detail="所选模型不存在或已停用")

    existing = (
        db.query(UserModelPreference)
        .filter(
            UserModelPreference.user_id == user.id,
            UserModelPreference.application_type == req.application_type,
            # Treat NULL novel_id as a distinct value
            UserModelPreference.novel_id == req.novel_id,
        )
        .first()
    )

    if existing:
        existing.model_id = req.model_id
        db.commit()
        db.refresh(existing)
        return existing

    pref = UserModelPreference(
        user_id=user.id,
        application_type=req.application_type,
        model_id=req.model_id,
        novel_id=req.novel_id,
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref


@router.delete("/model-preferences/{preference_id}", status_code=204)
@limiter.limit("30/minute")
def delete_preference(
    request: Request,
    preference_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.get(UserModelPreference, preference_id)
    if not pref:
        raise HTTPException(status_code=404, detail="偏好设置不存在")
    if pref.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作")

    db.delete(pref)
    db.commit()


# ── Resolve ──────────────────────────────────────────────────

@router.get("/model-preferences/resolve", response_model=ModelPreferenceResolved)
@limiter.limit("120/minute")
def resolve_preference(
    request: Request,
    application_type: str = Query(..., description="review | polish | writing"),
    novel_id: int | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Resolve which model to use for a given user + application_type + optional novel.

    Priority: novel override > global default > system default (first active model)
    """
    if application_type not in ("review", "polish", "writing"):
        raise HTTPException(status_code=400, detail="application_type 无效")

    # 1. Novel-level override
    if novel_id is not None:
        pref = (
            db.query(UserModelPreference)
            .filter(
                UserModelPreference.user_id == user.id,
                UserModelPreference.application_type == application_type,
                UserModelPreference.novel_id == novel_id,
            )
            .first()
        )
        if pref:
            model = db.get(AiModel, pref.model_id)
            if model and model.is_active:
                return ModelPreferenceResolved(
                    model_id=model.id,
                    model_name=model.name,
                    provider=model.provider,
                    application_type=application_type,
                    source="novel_override",
                    novel_id=novel_id,
                )

    # 2. Global default
    pref = (
        db.query(UserModelPreference)
        .filter(
            UserModelPreference.user_id == user.id,
            UserModelPreference.application_type == application_type,
            UserModelPreference.novel_id.is_(None),
        )
        .first()
    )
    if pref:
        model = db.get(AiModel, pref.model_id)
        if model and model.is_active:
            return ModelPreferenceResolved(
                model_id=model.id,
                model_name=model.name,
                provider=model.provider,
                application_type=application_type,
                source="global_default",
            )

    # 3. System default (first active model)
    fallback = (
        db.query(AiModel)
        .filter(AiModel.is_active == 1)
        .order_by(AiModel.name)
        .first()
    )
    if not fallback:
        raise HTTPException(status_code=500, detail="系统没有可用的 AI 模型")

    return ModelPreferenceResolved(
        model_id=fallback.id,
        model_name=fallback.name,
        provider=fallback.provider,
        application_type=application_type,
        source="system_default",
    )

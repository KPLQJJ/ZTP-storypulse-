import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.limiter import limiter
from app.database import get_db
from app.models.billing import AiModel, AuditLog
from app.models.review import Review
from app.models.user import User
from app.schemas import (
    AiModelPublicOut,
    AiModelAdminOut,
    AiModelCreate,
    AiModelUpdate,
)
from app.modules.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ai-models"])


def _require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可操作")


# ── 公开端点 ──────────────────────────────────────────────

@router.get("/ai-models", response_model=list[AiModelPublicOut])
@limiter.limit("60/minute")
def list_models(
    request: Request,
    db: Session = Depends(get_db),
):
    """返回所有启用的模型（公开，仅 id/name/provider）"""
    return (
        db.query(AiModel)
        .filter(AiModel.is_active == 1)
        .order_by(AiModel.name)
        .all()
    )


# ── 管理端点 ──────────────────────────────────────────────

@router.get("/admin/ai-models", response_model=list[AiModelAdminOut])
@limiter.limit("30/minute")
def admin_list_models(
    request: Request,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)
    return db.query(AiModel).order_by(AiModel.name).all()


@router.post("/admin/ai-models", response_model=AiModelAdminOut, status_code=201)
@limiter.limit("30/minute")
def admin_create_model(
    request: Request,
    req: AiModelCreate,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)

    existing = db.query(AiModel).filter(AiModel.name == req.name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"模型名称 '{req.name}' 已存在")

    model = AiModel(
        name=req.name,
        provider=req.provider,
        model_id=req.model_id,
        credits_per_1k_input=req.credits_per_1k_input,
        credits_per_1k_output=req.credits_per_1k_output,
    )
    db.add(model)

    db.add(AuditLog(
        user_id=admin.id,
        action="admin_create_ai_model",
        target_type="ai_model",
        detail=f"管理员 {admin.username} 创建模型 {req.name} (model_id={req.model_id})",
        ip_address=request.client.host if request.client else None,
    ))

    db.commit()
    db.refresh(model)
    return model


@router.patch("/admin/ai-models/{ai_model_id}", response_model=AiModelAdminOut)
@limiter.limit("30/minute")
def admin_update_model(
    ai_model_id: int,
    request: Request,
    req: AiModelUpdate,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)

    model = db.get(AiModel, ai_model_id)
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")

    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    # Explicit whitelist — only these fields can be updated
    allowed = {"name", "provider", "model_id", "credits_per_1k_input", "credits_per_1k_output"}
    for key, value in updates.items():
        if key not in allowed:
            raise HTTPException(status_code=400, detail=f"不允许修改字段: {key}")
        setattr(model, key, value)

    db.add(AuditLog(
        user_id=admin.id,
        action="admin_update_ai_model",
        target_type="ai_model",
        target_id=ai_model_id,
        detail=f"管理员 {admin.username} 更新模型 {model.name}：{updates}",
        ip_address=request.client.host if request.client else None,
    ))

    db.commit()
    db.refresh(model)
    return model


@router.patch("/admin/ai-models/{ai_model_id}/toggle", response_model=AiModelAdminOut)
@limiter.limit("30/minute")
def admin_toggle_model(
    ai_model_id: int,
    request: Request,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)

    model = db.get(AiModel, ai_model_id)
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")

    model.is_active = 1 if model.is_active == 0 else 0
    action = "启用" if model.is_active == 1 else "停用"

    db.add(AuditLog(
        user_id=admin.id,
        action="admin_toggle_ai_model",
        target_type="ai_model",
        target_id=ai_model_id,
        detail=f"管理员 {admin.username} {action}模型 {model.name}",
        ip_address=request.client.host if request.client else None,
    ))

    db.commit()
    db.refresh(model)
    return model


@router.delete("/admin/ai-models/{ai_model_id}", status_code=204)
@limiter.limit("30/minute")
def admin_delete_model(
    ai_model_id: int,
    request: Request,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)

    model = db.get(AiModel, ai_model_id)
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")

    # 检查是否有审稿记录引用了此模型
    ref_count = (
        db.query(func.count(Review.id))
        .filter(Review.model_used == model.model_id)
        .scalar()
    )
    if ref_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"无法删除：有 {ref_count} 条审稿记录使用了此模型，请先停用",
        )

    db.add(AuditLog(
        user_id=admin.id,
        action="admin_delete_ai_model",
        target_type="ai_model",
        target_id=ai_model_id,
        detail=f"管理员 {admin.username} 删除模型 {model.name}",
        ip_address=request.client.host if request.client else None,
    ))

    db.delete(model)
    db.commit()

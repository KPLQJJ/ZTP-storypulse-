import logging

import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import limiter
from app.models.api_provider import ApiProvider
from app.models.user import User
from app.modules.auth import get_current_user
from app.modules.crypto_utils import encrypt_api_key, mask_api_key
from app.schemas import ApiProviderCreate, ApiProviderOut, ApiProviderUpdate

logger = logging.getLogger(__name__)
router = APIRouter(tags=["api-providers"])


def _require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可操作")


def _to_out(p: ApiProvider) -> dict:
    d = {c.name: getattr(p, c.name) for c in p.__table__.columns}
    d["api_key_masked"] = mask_api_key(p.api_key)
    del d["api_key"]
    return d


# ── CRUD ────────────────────────────────────────────────────

@router.get("/admin/api-providers", response_model=list[ApiProviderOut])
@limiter.limit("30/minute")
def list_providers(
    request: Request,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)
    providers = db.query(ApiProvider).order_by(ApiProvider.name).all()
    return [_to_out(p) for p in providers]


@router.post("/admin/api-providers", response_model=ApiProviderOut, status_code=201)
@limiter.limit("30/minute")
def create_provider(
    request: Request,
    req: ApiProviderCreate,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)

    existing = db.query(ApiProvider).filter(ApiProvider.name == req.name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"平台 '{req.name}' 已存在")

    provider = ApiProvider(
        name=req.name,
        display_name=req.display_name,
        base_url=req.base_url.rstrip("/"),
        api_key=encrypt_api_key(req.api_key),
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    logger.info("Admin %s created API provider %s", admin.username, req.name)
    return _to_out(provider)


@router.get("/admin/api-providers/{provider_id}", response_model=ApiProviderOut)
@limiter.limit("30/minute")
def get_provider(
    provider_id: int,
    request: Request,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)
    provider = db.get(ApiProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="平台不存在")
    return _to_out(provider)


@router.patch("/admin/api-providers/{provider_id}", response_model=ApiProviderOut)
@limiter.limit("30/minute")
def update_provider(
    provider_id: int,
    request: Request,
    req: ApiProviderUpdate,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)

    provider = db.get(ApiProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="平台不存在")

    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    allowed = {"name", "display_name", "base_url", "api_key", "is_active"}
    for key, value in updates.items():
        if key not in allowed:
            raise HTTPException(status_code=400, detail=f"不允许修改字段: {key}")
        if key == "api_key":
            value = encrypt_api_key(value)
        if key == "base_url":
            value = value.rstrip("/")
        setattr(provider, key, value)

    db.commit()
    db.refresh(provider)
    logger.info("Admin %s updated API provider %s", admin.username, provider.name)
    return _to_out(provider)


@router.delete("/admin/api-providers/{provider_id}", status_code=204)
@limiter.limit("30/minute")
def delete_provider(
    provider_id: int,
    request: Request,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)

    provider = db.get(ApiProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="平台不存在")

    # Check if any ai_models reference this provider
    from app.models.billing import AiModel
    ref_count = db.query(AiModel).filter(AiModel.provider_id == provider_id).count()
    if ref_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"无法删除：有 {ref_count} 个模型关联了此平台，请先解除关联",
        )

    logger.info("Admin %s deleted API provider %s", admin.username, provider.name)
    db.delete(provider)
    db.commit()


# ── Connectivity test ───────────────────────────────────────

@router.post("/admin/api-providers/{provider_id}/test")
@limiter.limit("10/minute")
async def test_provider(
    provider_id: int,
    request: Request,
    admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(admin)

    provider = db.get(ApiProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="平台不存在")

    from app.modules.crypto_utils import decrypt_api_key

    api_key = decrypt_api_key(provider.api_key)
    url = f"{provider.base_url}/v1/models"

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(15)) as client:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {api_key}"},
            )
        if resp.status_code == 200:
            provider.health_status = "healthy"
            provider.consecutive_failures = 0
            db.commit()
            return {"status": "ok", "http_status": resp.status_code}
        else:
            provider.health_status = "degraded"
            db.commit()
            return {"status": "degraded", "http_status": resp.status_code, "detail": resp.text[:300]}
    except Exception as e:
        provider.health_status = "down"
        provider.consecutive_failures = (provider.consecutive_failures or 0) + 1
        db.commit()
        return {"status": "down", "error": str(e)[:300]}

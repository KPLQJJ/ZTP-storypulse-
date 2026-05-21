import re
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, Cookie, Request, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.limiter import limiter
from app.database import get_db
from app.models.user import User
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut, TotpVerifyRequest
from app.auth import (
    hash_password, verify_password,
    create_access_token, decode_access_token,
    create_pre_auth_token,
    generate_totp_secret, get_totp_uri, verify_totp,
)
from jose import JWTError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_RE = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def _set_token_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


@router.post("/register", status_code=201)
@limiter.limit("5/hour")
def register(request: Request, req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=409, detail="该邮箱已被注册")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=409, detail="该用户名已被占用")

    user = User(
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        role="writer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    _set_token_cookie(response, token)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        role=user.role,
    )


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    # Check account lockout
    if user and user.locked_until and user.locked_until > datetime.now(timezone.utc):
        remaining = int((user.locked_until - datetime.now(timezone.utc)).total_seconds() // 60) + 1
        raise HTTPException(
            status_code=429,
            detail=f"账号已被临时锁定，请 {remaining} 分钟后重试",
        )

    if not user or not verify_password(req.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            db.commit()
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已停用")

    # Reset failed attempts on successful login
    if user.failed_login_attempts > 0:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    # 2FA check: if enabled, return pre-auth token instead of real JWT
    if user.totp_enabled == 1:
        pre_auth = create_pre_auth_token(user.id)
        return {"requires_2fa": True, "pre_auth_token": pre_auth}

    token = create_access_token(user.id, user.role, user.token_version)
    _set_token_cookie(response, token)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        role=user.role,
    )


def get_current_user(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None),
    db: Session = Depends(get_db),
) -> User:
    token: str | None = None

    if authorization and authorization.lower().startswith("bearer "):
        parts = authorization.split(" ", 1)
        if len(parts) == 2:
            token = parts[1]
    elif access_token:
        token = access_token

    if not token:
        raise HTTPException(status_code=401, detail="未登录或登录已过期")

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token 无效或已过期")

    # Reject pre-auth tokens (only valid for 2FA verification)
    if payload.get("pre_auth"):
        raise HTTPException(status_code=401, detail="请先完成二次验证")

    user_id = int(payload.get("sub"))
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已停用")

    # Check token version — revoked tokens have stale version
    token_ver = payload.get("ver", 0)
    if token_ver != user.token_version:
        raise HTTPException(status_code=401, detail="Token 已被吊销，请重新登录")

    return user


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=not settings.debug,
        httponly=True,
        samesite="lax",
    )


# ── 2FA ─────────────────────────────────────────────────

@router.post("/verify-2fa")
@limiter.limit("5/minute")
def verify_2fa(
    request: Request,
    req: TotpVerifyRequest,
    response: Response,
    db: Session = Depends(get_db),
    authorization: str | None = Header(None),
):
    """用 pre-auth token + TOTP 验证码换取真正的 JWT"""
    token: str | None = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]

    if not token:
        raise HTTPException(status_code=401, detail="缺少验证凭证")

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="验证凭证无效或已过期")

    if not payload.get("pre_auth"):
        raise HTTPException(status_code=400, detail="此凭证不能用于二次验证")

    user_id = int(payload.get("sub"))
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="用户不存在或已停用")

    if user.totp_enabled != 1 or not user.totp_secret:
        raise HTTPException(status_code=400, detail="该账号未启用二次验证")

    if not verify_totp(user.totp_secret, req.totp_code):
        logger.warning("2FA verification failed for user %s", user.email)
        raise HTTPException(status_code=401, detail="验证码错误")

    # Issue real token
    real_token = create_access_token(user.id, user.role, user.token_version)
    _set_token_cookie(response, real_token)
    return TokenResponse(
        access_token=real_token,
        user_id=user.id,
        username=user.username,
        role=user.role,
    )


@router.post("/2fa/setup")
@limiter.limit("5/minute")
def setup_2fa(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """生成 TOTP 密钥和扫码 URI（需已登录）"""
    if user.totp_enabled == 1:
        raise HTTPException(status_code=400, detail="二次验证已启用，请先禁用再重新设置")

    secret = generate_totp_secret()
    user.totp_secret = secret
    db.commit()

    uri = get_totp_uri(secret, user.email)
    return {"secret": secret, "uri": uri}


@router.post("/2fa/enable")
@limiter.limit("5/minute")
def enable_2fa(
    request: Request,
    req: TotpVerifyRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """验证 TOTP 验证码并启用 2FA"""
    if user.totp_enabled == 1:
        raise HTTPException(status_code=400, detail="二次验证已启用")

    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="请先调用 /auth/2fa/setup 生成密钥")

    if not verify_totp(user.totp_secret, req.totp_code):
        raise HTTPException(status_code=401, detail="验证码错误，请检查验证器时间是否同步")

    user.totp_enabled = 1
    db.commit()
    return {"message": "二次验证已启用"}


@router.post("/2fa/disable")
@limiter.limit("5/minute")
def disable_2fa(
    request: Request,
    req: TotpVerifyRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """禁用 2FA（需验证当前 TOTP 码确认身份）"""
    if user.totp_enabled != 1 or not user.totp_secret:
        raise HTTPException(status_code=400, detail="二次验证未启用")

    if not verify_totp(user.totp_secret, req.totp_code):
        raise HTTPException(status_code=401, detail="验证码错误")

    user.totp_enabled = 0
    user.totp_secret = None
    db.commit()
    return {"message": "二次验证已禁用"}


# ── Token Revocation ─────────────────────────────────────

@router.post("/revoke-tokens")
@limiter.limit("10/minute")
def revoke_tokens(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    target_user_id: int | None = None,
):
    """吊销令牌：普通用户只能吊销自己的，管理员可以吊销任意用户的"""
    if target_user_id and target_user_id != user.id:
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="仅管理员可吊销其他用户的令牌")
        target = db.get(User, target_user_id)
        if not target:
            raise HTTPException(status_code=404, detail="用户不存在")
        target.token_version += 1
        logger.warning(
            "Admin %s revoked all tokens for user %s (id=%d)",
            user.email, target.email, target_user_id,
        )
    else:
        user.token_version += 1
        logger.info("User %s revoked all their own tokens", user.email)

    db.commit()
    return {"message": "所有 Token 已吊销，请重新登录"}

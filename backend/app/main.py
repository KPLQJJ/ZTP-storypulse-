from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.limiter import limiter
from app.middleware import SecurityHeadersMiddleware
from app.logging_middleware import RequestLoggingMiddleware
from app.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from app.database import engine, Base
from app.models import *  # noqa: F401, F403 — 注册所有模型
from app.modules.chapters import router as chapters_router
from app.modules.reviews import router as reviews_router
from app.modules.polishes import router as polishes_router
from app.modules.skill_registry import router as skill_registry_router
from app.modules.auth import router as auth_router
from app.modules.credits import router as credits_router
from app.modules.ai_models import router as ai_models_router
from app.modules.api_providers import router as api_providers_router
from app.modules.model_preferences import router as model_preferences_router
from app.modules.novels import router as novels_router
from app.modules.novel_groups import router as novel_groups_router
from app.modules.outlines import router as outlines_router
from app.modules.characters import router as characters_router
from app.modules.worldbuilding import router as worldbuilding_router
from app.modules.agent_configs import router as agent_configs_router
from app.modules.agent_sessions import router as agent_sessions_router

app = FastAPI(title="StoryPulse API", version="0.1.0")

# Request logging (generate correlation ID)
app.add_middleware(RequestLoggingMiddleware)

# Security headers (outermost)
app.add_middleware(SecurityHeadersMiddleware)

# Host validation
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_router)
app.include_router(credits_router)
app.include_router(ai_models_router)
app.include_router(api_providers_router)
app.include_router(model_preferences_router)
app.include_router(novels_router)
app.include_router(chapters_router)
app.include_router(reviews_router)
app.include_router(polishes_router)
app.include_router(skill_registry_router)
app.include_router(novel_groups_router)
app.include_router(outlines_router)
app.include_router(characters_router)
app.include_router(worldbuilding_router)
app.include_router(agent_configs_router)
app.include_router(agent_sessions_router)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


@app.on_event("startup")
def on_startup():
    """开发环境自动创建表（生产环境用 init.sql 手动管理）"""
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"service": "StoryPulse", "status": "running"}

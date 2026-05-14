from fastapi import FastAPI

from app.database import engine, Base
from app.models import *  # noqa: F401, F403 — 注册所有模型
from app.modules.chapters import router as chapters_router
from app.modules.reviews import router as reviews_router
from app.modules.auth import router as auth_router
from app.modules.credits import router as credits_router

app = FastAPI(title="StoryPulse API", version="0.1.0")

app.include_router(auth_router)
app.include_router(credits_router)
app.include_router(chapters_router)
app.include_router(reviews_router)


@app.on_event("startup")
def on_startup():
    """开发环境自动创建表（生产环境用 init.sql 手动管理）"""
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"service": "StoryPulse", "status": "running"}

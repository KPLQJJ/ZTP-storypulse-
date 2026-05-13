from fastapi import FastAPI

from app.database import engine, Base
from app.models import *  # noqa: F401, F403 — 注册所有模型

app = FastAPI(title="StoryPulse API", version="0.1.0")


@app.on_event("startup")
def on_startup():
    """开发环境自动创建表（生产环境用 init.sql 手动管理）"""
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"service": "StoryPulse", "status": "running"}

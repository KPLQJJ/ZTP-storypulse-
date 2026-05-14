from datetime import datetime
from pydantic import BaseModel


# ── Novel ──────────────────────────────────────────────

class NovelCreate(BaseModel):
    title: str
    genre: str
    description: str = ""


class NovelUpdate(BaseModel):
    title: str | None = None
    genre: str | None = None
    description: str | None = None
    status: str | None = None


class NovelOut(BaseModel):
    id: int
    user_id: int
    title: str
    genre: str
    description: str | None = None
    status: str
    word_count: int
    cover_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NovelDetail(NovelOut):
    chapters: list["ChapterOut"] = []


# ── Chapter ────────────────────────────────────────────

class ChapterOut(BaseModel):
    id: int
    novel_id: int
    chapter_index: int
    title: str
    word_count: int
    status: str
    source: str
    file_format: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChapterUploadResponse(BaseModel):
    message: str
    chapter: ChapterOut


# ── Review ──────────────────────────────────────────────

class ReviewRequest(BaseModel):
    chapter_ids: list[int]
    model_name: str = "deepseek-v4-pro"


class DimensionScore(BaseModel):
    label: str
    score: float
    comment: str
    suggestions: str = ""


class ReviewOut(BaseModel):
    id: int
    novel_id: int
    chapter_ids: str
    overall_score: float
    dimensions: str
    model_used: str | None = None
    tokens_input: int | None = None
    tokens_output: int | None = None
    credits_cost: float | None = None
    summary: str | None = None
    suggestions: str | None = None
    reviewer_type: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Auth ──────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Credits ────────────────────────────────────────────────

class RechargeRequest(BaseModel):
    amount: float
    description: str = "充值"

    # 金额校验：单笔下限/上限
    @property
    def is_valid(self) -> bool:
        return 0.01 <= self.amount <= 10000.0


class BalanceResponse(BaseModel):
    user_id: int
    balance: float


class TransactionOut(BaseModel):
    id: int
    user_id: int
    amount: float
    balance_after: float
    type: str
    reference_type: str | None = None
    reference_id: int | None = None
    description: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

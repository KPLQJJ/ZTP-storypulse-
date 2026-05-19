import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


# ── Novel ──────────────────────────────────────────────

class NovelCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    genre: str = Field(min_length=1, max_length=50)
    description: str = Field(default="", max_length=5000)


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


class ChaptersUploadResponse(BaseModel):
    message: str
    chapters: list[ChapterOut]
    errors: list[str] = []


class ChapterDetail(ChapterOut):
    content: str
    content_hash: str | None = None
    updated_at: datetime


class ChapterUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


# ── Review ──────────────────────────────────────────────

class ReviewRequest(BaseModel):
    chapter_ids: list[int]
    model_id: int = 0


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
    username: str = Field(min_length=2, max_length=50)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 50:
            raise ValueError("用户名 2-50 个字符")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v):
            raise ValueError("邮箱格式不正确")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("密码至少 8 位")
        if not re.search(r"[A-Z]", v):
            raise ValueError("密码须包含至少一个大写字母")
        if not re.search(r"\d", v):
            raise ValueError("密码须包含至少一个数字")
        return v


class LoginRequest(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


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
    amount: float = Field(gt=0.0, le=10000.0)
    description: str = Field(default="充值", max_length=500)


class BalanceResponse(BaseModel):
    user_id: int
    balance: float


class TotpVerifyRequest(BaseModel):
    totp_code: str = Field(min_length=6, max_length=6)


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


# ── AI Models ──────────────────────────────────────────────

class AiModelPublicOut(BaseModel):
    """公开接口：仅返回 id/name/provider，不泄露 model_id 和定价"""
    id: int
    name: str
    provider: str

    model_config = {"from_attributes": True}


class AiModelAdminOut(AiModelPublicOut):
    """管理接口：返回完整字段（含内部标识符和定价）"""
    model_id: str
    credits_per_1k_input: float
    credits_per_1k_output: float
    is_active: int
    created_at: datetime


class AiModelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    provider: str = Field(min_length=1, max_length=50)
    model_id: str = Field(min_length=1, max_length=100)
    credits_per_1k_input: float = Field(default=0, ge=0)
    credits_per_1k_output: float = Field(default=0, ge=0)

    @field_validator("model_id")
    @classmethod
    def validate_model_id(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_.\-]+$", v):
            raise ValueError("model_id 只能包含字母、数字、下划线、点和连字符")
        return v.strip()

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        return v.strip()


class AiModelUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    provider: str | None = Field(default=None, min_length=1, max_length=50)
    model_id: str | None = Field(default=None, min_length=1, max_length=100)
    credits_per_1k_input: float | None = Field(default=None, ge=0)
    credits_per_1k_output: float | None = Field(default=None, ge=0)

    @field_validator("model_id")
    @classmethod
    def validate_model_id(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r"^[a-zA-Z0-9_.\-]+$", v):
            raise ValueError("model_id 只能包含字母、数字、下划线、点和连字符")
        return v.strip()

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        return v.strip() if v else v

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str | None) -> str | None:
        return v.strip() if v else v

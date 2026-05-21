import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


# ── Novel ──────────────────────────────────────────────

class NovelCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    genre: str = Field(min_length=1, max_length=50)
    description: str = Field(default="", max_length=5000)
    source_type: str = Field(default="from_scratch", max_length=20)
    tags: list[str] = Field(default_factory=list)
    group_id: int | None = None

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, v: str) -> str:
        if v not in ("from_scratch", "import", "manual"):
            raise ValueError("source_type 无效")
        return v


class NovelUpdate(BaseModel):
    title: str | None = None
    genre: str | None = None
    description: str | None = None
    status: str | None = None
    tags: list[str] | None = None
    group_id: int | None = None


class NovelOut(BaseModel):
    id: int
    user_id: int
    title: str
    genre: str
    description: str | None = None
    status: str
    word_count: int
    cover_url: str | None = None
    tags: str = "[]"
    group_id: int | None = None
    source_type: str = "manual"
    file_path: str | None = None
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
    genre_skill_path: str | None = None
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


# ── Polish ──────────────────────────────────────────────

class PolishRequest(BaseModel):
    chapter_ids: list[int]
    polish_style: str | None = None  # v2: 可选，后期用 Skill 配置替代
    model_id: int = 0


class PolishOut(BaseModel):
    id: int
    novel_id: int
    chapter_ids: str
    polish_style: str
    genre_skill_path: str | None = None
    style_skill_path: str | None = None
    input_word_count: int
    output_word_count: int
    polish_results: str
    model_used: str | None = None
    tokens_input: int | None = None
    tokens_output: int | None = None
    credits_cost: float | None = None
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


# ── API Providers ─────────────────────────────────────────

class ApiProviderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    display_name: str = Field(min_length=1, max_length=100)
    base_url: str = Field(min_length=1, max_length=500)
    api_key: str = Field(min_length=1, max_length=500)

    @field_validator("api_key")
    @classmethod
    def strip_key(cls, v: str) -> str:
        return v.strip()


class ApiProviderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    base_url: str | None = Field(default=None, min_length=1, max_length=500)
    api_key: str | None = Field(default=None, min_length=1, max_length=500)
    is_active: int | None = None

    @field_validator("api_key")
    @classmethod
    def strip_key(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class ApiProviderOut(BaseModel):
    id: int
    name: str
    display_name: str
    base_url: str
    api_key_masked: str  # "sk-****xxxx"
    is_active: int
    health_status: str
    last_health_check: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApiProviderDetailOut(ApiProviderOut):
    """Admin detail — still masked, never returns plain key."""
    pass


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
    provider_id: int | None = None
    priority: int = 0
    is_fallback: int = 0
    capability_tags: str = "[]"
    credits_per_1k_input: float
    credits_per_1k_output: float
    is_active: int
    created_at: datetime


class AiModelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    provider: str = Field(min_length=1, max_length=50)
    model_id: str = Field(min_length=1, max_length=100)
    provider_id: int | None = None
    priority: int = Field(default=0, ge=0)
    is_fallback: int = Field(default=0, ge=0, le=1)
    capability_tags: str = Field(default="[]")
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
    provider_id: int | None = None
    priority: int | None = Field(default=None, ge=0)
    is_fallback: int | None = Field(default=None, ge=0, le=1)
    capability_tags: str | None = None
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


# ── Model Preferences ────────────────────────────────────────

class ModelPreferenceCreate(BaseModel):
    application_type: str = Field(min_length=1, max_length=20)
    model_id: int = Field(gt=0)
    novel_id: int | None = None  # None = global default

    @field_validator("application_type")
    @classmethod
    def validate_app_type(cls, v: str) -> str:
        if v not in ("review", "polish", "writing"):
            raise ValueError("application_type must be 'review', 'polish', or 'writing'")
        return v


class ModelPreferenceOut(BaseModel):
    id: int
    user_id: int
    application_type: str
    model_id: int
    novel_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ModelPreferenceResolved(BaseModel):
    """Result of resolve: which model to actually use."""
    model_id: int
    model_name: str
    provider: str
    application_type: str
    source: str  # 'novel_override' | 'global_default' | 'system_default'
    novel_id: int | None = None


# ── Novel Init V2 ───────────────────────────────────────

class NovelInitV2(BaseModel):
    """v2 创建作品：Path A 从零开始 / Path B 半成品导入"""
    title: str = Field(min_length=1, max_length=200)
    genre: str | None = Field(default=None, max_length=50)
    description: str = Field(default="", max_length=5000)
    source_type: str = Field(default="from_scratch", max_length=20)
    tags: list[str] = Field(default_factory=list)
    group_id: int | None = None
    file_path: str | None = None  # Path B: 上传文件路径

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, v: str) -> str:
        if v not in ("from_scratch", "import", "manual"):
            raise ValueError("source_type must be 'from_scratch', 'import', or 'manual'")
        return v


# ── Novel Group ─────────────────────────────────────────

class NovelGroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class NovelGroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    sort_order: int | None = None


class NovelGroupOut(BaseModel):
    id: int
    user_id: int
    name: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Outline ─────────────────────────────────────────────

class OutlineCreate(BaseModel):
    novel_id: int
    parent_id: int | None = None
    title: str = Field(min_length=1, max_length=200)
    content: str = ""
    sort_order: int = 0


class OutlineUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None
    parent_id: int | None = None
    sort_order: int | None = None


class OutlineOut(BaseModel):
    id: int
    novel_id: int
    parent_id: int | None = None
    title: str
    content: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OutlineTreeNode(OutlineOut):
    """大纲树节点，含子节点"""
    children: list["OutlineTreeNode"] = []


# ── Character ───────────────────────────────────────────

class CharacterCreate(BaseModel):
    novel_id: int
    name: str = Field(min_length=1, max_length=100)
    description: str = ""
    attributes: str = "{}"


class CharacterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    attributes: str | None = None


class CharacterOut(BaseModel):
    id: int
    novel_id: int
    name: str
    description: str
    attributes: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Worldbuilding ───────────────────────────────────────

class WorldbuildingCreate(BaseModel):
    novel_id: int
    category: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=200)
    content: str = ""


class WorldbuildingUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=50)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None


class WorldbuildingOut(BaseModel):
    id: int
    novel_id: int
    category: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Agent Config ────────────────────────────────────────

class AgentConfigUpsert(BaseModel):
    agent_role: str = Field(min_length=1, max_length=30)
    model_id: int = Field(gt=0)

    @field_validator("agent_role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {
            "outline_writer", "chapter_writer", "world_builder",
            "character_designer", "polisher", "reviewer",
        }
        if v not in allowed:
            raise ValueError(f"agent_role must be one of: {', '.join(sorted(allowed))}")
        return v


class AgentConfigOut(BaseModel):
    id: int
    novel_id: int
    agent_role: str
    model_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Agent Session & Message ─────────────────────────────

class AgentSessionCreate(BaseModel):
    novel_id: int
    context_type: str | None = None
    context_id: int | None = None
    title: str | None = None


class AgentSessionOut(BaseModel):
    id: int
    novel_id: int
    user_id: int
    context_type: str | None = None
    context_id: int | None = None
    title: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentMessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    agent_name: str | None = None
    content: str
    tokens: int | None = None
    meta_json: str = "{}"
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentSessionDetail(AgentSessionOut):
    messages: list[AgentMessageOut] = []


class AgentMessageCreate(BaseModel):
    session_id: int
    role: str = Field(min_length=1, max_length=20)
    agent_name: str | None = None
    content: str = Field(min_length=1)
    tokens: int | None = None
    meta_json: str = "{}"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("user", "assistant", "system"):
            raise ValueError("role must be 'user', 'assistant', or 'system'")
        return v

from datetime import datetime
from pydantic import BaseModel


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

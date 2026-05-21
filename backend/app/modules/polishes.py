import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session

from app.limiter import limiter
from app.database import get_db

logger = logging.getLogger(__name__)
from app.models.content import Novel, Chapter
from app.models.polish import Polish
from app.models.billing import AiModel, CreditTransaction
from app.models.user import User
from app.schemas import PolishRequest, PolishOut
from app.polish_service import call_ai_polish
from app.modules.auth import get_current_user
from app.modules.skill_registry import (
    get_genre_skill,
    load_skill_content,
)

router = APIRouter(tags=["polishes"])


def _get_user_balance(db: Session, user_id: int, lock: bool = False) -> float:
    query = (
        db.query(CreditTransaction.balance_after)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id.desc())
    )
    if lock:
        query = query.with_for_update()
    row = query.first()
    return row[0] if row else 0.0


def _resolve_skills(novel_genre: str) -> tuple[str, str]:
    """Resolve genre Skill path and content for polish.
    Returns (genre_skill_path, genre_skill_content).
    """
    genre_skill = get_genre_skill(novel_genre, "polish")
    if genre_skill:
        genre_path = genre_skill.path
        genre_content = load_skill_content(genre_path)
    else:
        genre_path = ""
        genre_content = "（无品类专属编辑标准，使用通用文字润色原则）"

    return genre_path, genre_content


@router.post("/novels/{novel_id}/polishes", response_model=PolishOut, status_code=201)
@limiter.limit("20/day;5/hour")
async def create_polish(
    request: Request,
    novel_id: int,
    req: PolishRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    if not req.chapter_ids:
        raise HTTPException(status_code=400, detail="请至少选择一个章节")

    model = db.get(AiModel, req.model_id)
    if not model or model.is_active != 1:
        raise HTTPException(
            status_code=400,
            detail="所选模型不存在或已停用",
        )

    chapters = (
        db.query(Chapter)
        .filter(
            Chapter.novel_id == novel_id,
            Chapter.id.in_(req.chapter_ids),
        )
        .order_by(Chapter.chapter_index)
        .all()
    )
    if len(chapters) != len(req.chapter_ids):
        found = {ch.id for ch in chapters}
        missing = set(req.chapter_ids) - found
        raise HTTPException(
            status_code=400, detail=f"章节不存在：{missing}"
        )

    chapter_data = [
        {
            "chapter_index": ch.chapter_index,
            "title": ch.title,
            "content": ch.content,
            "word_count": ch.word_count,
        }
        for ch in chapters
    ]

    input_word_count = sum(c["word_count"] for c in chapter_data)

    base_estimated_cost = (
        input_word_count / 1000 * model.credits_per_1k_input
        + input_word_count / 1000 * model.credits_per_1k_output
    )
    estimated_cost = round(base_estimated_cost * 1.5, 2)

    balance = _get_user_balance(db, novel.user_id, lock=True)
    if balance < estimated_cost:
        raise HTTPException(
            status_code=402,
            detail=f"积分不足，预估消耗 {estimated_cost:.1f}，当前余额 {balance:.1f}",
        )

    # Resolve Skills
    genre_skill_path, genre_skill_content = _resolve_skills(novel.genre)

    idempotency_key = request.headers.get("X-Idempotency-Key")

    try:
        polish_data = await call_ai_polish(
            chapter_data,
            ai_model_db_id=model.id,
            genre_skill_content=genre_skill_content,
            style_skill_content="",
            genre_skill_path=genre_skill_path,
            style_skill_path="",
            db=db,
            idempotency_key=idempotency_key,
        )
    except ValueError as e:
        logger.error("AI polish ValueError: %s", e)
        db.rollback()
        raise HTTPException(status_code=500, detail="AI 润色配置错误，请联系管理员")
    except RuntimeError as e:
        logger.error("AI polish RuntimeError: %s", e)
        db.rollback()
        raise HTTPException(status_code=502, detail="AI 服务暂时不可用，请稍后重试")

    result = polish_data["result"]
    tokens_in = polish_data["tokens_input"]
    tokens_out = polish_data["tokens_output"]

    credits_cost = (
        tokens_in / 1000 * model.credits_per_1k_input
        + tokens_out / 1000 * model.credits_per_1k_output
    )
    credits_cost = round(credits_cost, 2)

    new_balance = round(balance - credits_cost, 2)

    output_word_count = int(tokens_out * 0.7)

    polish = Polish(
        novel_id=novel_id,
        chapter_ids=json.dumps(req.chapter_ids),
        polish_style=req.polish_style,
        input_word_count=input_word_count,
        output_word_count=output_word_count,
        polish_results=json.dumps(result.get("chapters", []), ensure_ascii=False),
        genre_skill_path=genre_skill_path or None,
        style_skill_path=None,
        model_used=model.model_id,
        tokens_input=tokens_in,
        tokens_output=tokens_out,
        credits_cost=credits_cost,
    )
    db.add(polish)

    db.add(
        CreditTransaction(
            user_id=novel.user_id,
            amount=-credits_cost,
            balance_after=new_balance,
            type="spend",
            reference_type="polish",
            description=f"作品《{novel.title}》润色消耗",
        )
    )

    db.commit()
    db.refresh(polish)

    txn = (
        db.query(CreditTransaction)
        .filter(
            CreditTransaction.reference_type == "polish",
            CreditTransaction.description.like(f"%{novel.title}%"),
        )
        .order_by(CreditTransaction.created_at.desc())
        .first()
    )
    if txn:
        txn.reference_id = polish.id
        db.commit()

    return polish


@router.get("/novels/{novel_id}/polishes")
def list_polishes(
    novel_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    polishes = (
        db.query(Polish)
        .filter(Polish.novel_id == novel_id)
        .order_by(Polish.created_at.desc())
        .all()
    )
    return polishes


@router.get("/polishes/{polish_id}", response_model=PolishOut)
def get_polish(
    polish_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    polish = db.get(Polish, polish_id)
    if not polish:
        raise HTTPException(status_code=404, detail="润色记录不存在")

    novel = db.get(Novel, polish.novel_id)
    if not novel or novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权查看此润色记录")

    return polish

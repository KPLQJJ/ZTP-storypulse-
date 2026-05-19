import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session

from app.limiter import limiter
from app.database import get_db

logger = logging.getLogger(__name__)
from app.models.content import Novel, Chapter
from app.models.review import Review
from app.models.billing import AiModel, CreditTransaction
from app.models.user import User
from app.schemas import ReviewRequest, ReviewOut
from app.review_service import call_ai_review
from app.modules.auth import get_current_user

router = APIRouter(tags=["reviews"])


def _get_user_balance(db: Session, user_id: int, lock: bool = False) -> float:
    """获取用户最新余额（基于最后一条交易的 balance_after）"""
    query = (
        db.query(CreditTransaction.balance_after)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id.desc())
    )
    if lock:
        query = query.with_for_update()
    row = query.first()
    return row[0] if row else 0.0


@router.post("/novels/{novel_id}/reviews", response_model=ReviewOut, status_code=201)
@limiter.limit("20/day;5/hour")
async def create_review(
    request: Request,
    novel_id: int,
    req: ReviewRequest,
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

    # 查定价（通过整数 ID 反查）
    model = db.get(AiModel, req.model_id)
    if not model or model.is_active != 1:
        raise HTTPException(
            status_code=400,
            detail="所选模型不存在或已停用",
        )

    # 取章节
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

    # 预估成本（慷慨 1.5x 防止超扣）
    base_estimated_cost = (
        sum(c["word_count"] for c in chapter_data) / 1000 * model.credits_per_1k_input
        + 2000 / 1000 * model.credits_per_1k_output
    )
    estimated_cost = round(base_estimated_cost * 1.5, 2)

    # 锁定余额防并发超扣（AI 调用前锁）
    balance = _get_user_balance(db, novel.user_id, lock=True)
    if balance < estimated_cost:
        raise HTTPException(
            status_code=402,
            detail=f"积分不足，预估消耗 {estimated_cost:.1f}，当前余额 {balance:.1f}",
        )

    # 调 AI 审稿
    try:
        review_data = await call_ai_review(chapter_data, model.model_id)
    except ValueError as e:
        logger.error("AI review ValueError: %s", e)
        db.rollback()
        raise HTTPException(status_code=500, detail="AI 审稿配置错误，请联系管理员")
    except RuntimeError as e:
        logger.error("AI review RuntimeError: %s", e)
        db.rollback()
        raise HTTPException(status_code=502, detail="AI 服务暂时不可用，请稍后重试")

    result = review_data["result"]
    tokens_in = review_data["tokens_input"]
    tokens_out = review_data["tokens_output"]

    # 计算实扣积分
    credits_cost = (
        tokens_in / 1000 * model.credits_per_1k_input
        + tokens_out / 1000 * model.credits_per_1k_output
    )
    credits_cost = round(credits_cost, 2)

    new_balance = round(balance - credits_cost, 2)

    # 存审稿报告
    review = Review(
        novel_id=novel_id,
        chapter_ids=json.dumps(req.chapter_ids),
        overall_score=result.get("overall_score", 0),
        dimensions=json.dumps(result.get("dimensions", []), ensure_ascii=False),
        model_used=model.model_id,
        tokens_input=tokens_in,
        tokens_output=tokens_out,
        credits_cost=credits_cost,
        summary=result.get("summary", ""),
        suggestions=result.get("suggestions", ""),
        reviewer_type="auto_ai",
    )
    db.add(review)

    # 扣积分
    db.add(
        CreditTransaction(
            user_id=novel.user_id,
            amount=-credits_cost,
            balance_after=new_balance,
            type="spend",
            reference_type="review",
            description=f"作品《{novel.title}》审稿消耗",
        )
    )

    db.commit()
    db.refresh(review)

    # reference_id 后补（因为需要 review.id 先存在）
    txn = (
        db.query(CreditTransaction)
        .filter(
            CreditTransaction.reference_type == "review",
            CreditTransaction.description.like(f"%{novel.title}%"),
        )
        .order_by(CreditTransaction.created_at.desc())
        .first()
    )
    if txn:
        txn.reference_id = review.id
        db.commit()

    return review


@router.get("/novels/{novel_id}/reviews")
def list_reviews(
    novel_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    reviews = (
        db.query(Review)
        .filter(Review.novel_id == novel_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews


@router.get("/reviews/{review_id}", response_model=ReviewOut)
def get_review(
    review_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="审稿报告不存在")

    novel = db.get(Novel, review.novel_id)
    if not novel or novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权查看此审稿报告")

    return review

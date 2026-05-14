import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Novel, Chapter
from app.models.review import Review
from app.models.billing import AiModel, CreditTransaction
from app.schemas import ReviewRequest, ReviewOut
from app.review_service import call_ai_review

router = APIRouter(tags=["reviews"])


def _get_user_balance(db: Session, user_id: int) -> float:
    """计算用户当前积分余额"""
    total = (
        db.query(CreditTransaction.amount)
        .filter(CreditTransaction.user_id == user_id)
        .all()
    )
    return sum(t[0] for t in total) if total else 0


@router.post("/novels/{novel_id}/reviews", response_model=ReviewOut, status_code=201)
async def create_review(
    novel_id: int,
    req: ReviewRequest,
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")

    if not req.chapter_ids:
        raise HTTPException(status_code=400, detail="请至少选择一个章节")

    # 查定价
    model = (
        db.query(AiModel).filter(AiModel.model_id == req.model_name).first()
    )
    if not model:
        raise HTTPException(
            status_code=400,
            detail=f"模型 '{req.model_name}' 未配置，请先在 ai_models 表中添加定价",
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

    # 校验余额（预检）
    balance = _get_user_balance(db, novel.user_id)
    estimated_cost = (
        sum(c["word_count"] for c in chapter_data) / 1000 * model.credits_per_1k_input
        + 2000 / 1000 * model.credits_per_1k_output  # 预估输出 2000 tokens
    )
    if balance < estimated_cost:
        raise HTTPException(
            status_code=402,
            detail=f"积分不足，预估消耗 {estimated_cost:.1f}，当前余额 {balance:.1f}",
        )

    # 调 AI 审稿
    try:
        review_data = await call_ai_review(chapter_data, req.model_name)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"AI 服务异常：{e}")

    result = review_data["result"]
    tokens_in = review_data["tokens_input"]
    tokens_out = review_data["tokens_output"]

    # 计算实扣积分
    credits_cost = (
        tokens_in / 1000 * model.credits_per_1k_input
        + tokens_out / 1000 * model.credits_per_1k_output
    )
    credits_cost = round(credits_cost, 2)

    # 再次校验余额
    balance = _get_user_balance(db, novel.user_id)
    if balance < credits_cost:
        raise HTTPException(status_code=402, detail="积分不足")

    new_balance = round(balance - credits_cost, 2)

    # 存审稿报告
    review = Review(
        novel_id=novel_id,
        chapter_ids=json.dumps(req.chapter_ids),
        overall_score=result.get("overall_score", 0),
        dimensions=json.dumps(result.get("dimensions", []), ensure_ascii=False),
        model_used=req.model_name,
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
def list_reviews(novel_id: int, db: Session = Depends(get_db)):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")

    reviews = (
        db.query(Review)
        .filter(Review.novel_id == novel_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews


@router.get("/reviews/{review_id}", response_model=ReviewOut)
def get_review(review_id: int, db: Session = Depends(get_db)):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="审稿报告不存在")
    return review

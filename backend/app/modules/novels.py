import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Novel
from app.models.user import User
from app.schemas import NovelCreate, NovelUpdate, NovelOut, NovelDetail, NovelInitV2
from app.modules.auth import get_current_user
from app.modules.import_analyzer import analyze_import

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/novels", tags=["novels"])


def _get_novel_or_404(db: Session, novel_id: int, user_id: int) -> Novel:
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作此作品")
    return novel


@router.get("", response_model=list[NovelOut])
def list_novels(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=""),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Novel).filter(Novel.user_id == user.id)
    if search:
        q = q.filter(Novel.title.contains(search))
    return q.order_by(Novel.updated_at.desc()).offset((page - 1) * size).limit(size).all()


@router.post("", response_model=NovelOut, status_code=201)
def create_novel(
    req: NovelCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = req.title.strip()
    genre = req.genre.strip()
    if not title or len(title) > 200:
        raise HTTPException(status_code=400, detail="标题须在 1~200 字之间")
    if not genre:
        raise HTTPException(status_code=400, detail="请选择作品类型")

    novel = Novel(
        user_id=user.id,
        title=title,
        genre=genre,
        description=req.description.strip(),
    )
    db.add(novel)
    db.commit()
    db.refresh(novel)
    return novel


@router.get("/{novel_id}", response_model=NovelDetail)
def get_novel(
    novel_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = _get_novel_or_404(db, novel_id, user.id)
    return novel


@router.patch("/{novel_id}", response_model=NovelOut)
def update_novel(
    novel_id: int,
    req: NovelUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = _get_novel_or_404(db, novel_id, user.id)

    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    if "title" in updates:
        t = updates["title"].strip()
        if not t or len(t) > 200:
            raise HTTPException(status_code=400, detail="标题须在 1~200 字之间")
        updates["title"] = t
    if "genre" in updates and not updates["genre"].strip():
        raise HTTPException(status_code=400, detail="类型不能为空")
    if "status" in updates and updates["status"] not in ("draft", "ongoing", "completed"):
        raise HTTPException(status_code=400, detail="状态值无效")

    for k, v in updates.items():
        setattr(novel, k, v)

    db.commit()
    db.refresh(novel)
    return novel


@router.delete("/{novel_id}", status_code=204)
def delete_novel(
    novel_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = _get_novel_or_404(db, novel_id, user.id)
    db.delete(novel)
    db.commit()


@router.post("/init-v2", response_model=NovelOut, status_code=201)
def init_novel_v2(
    req: NovelInitV2,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """v2 创建作品：Path A 从零开始 / Path B 半成品导入"""
    title = req.title.strip()
    genre = req.genre.strip() if req.genre else "其他"
    if not title or len(title) > 200:
        raise HTTPException(status_code=400, detail="标题须在 1~200 字之间")

    novel = Novel(
        user_id=user.id,
        title=title,
        genre=genre,
        description=req.description.strip(),
        tags=json.dumps(req.tags, ensure_ascii=False),
        source_type=req.source_type,
        group_id=req.group_id,
        file_path=req.file_path,
    )
    db.add(novel)
    db.commit()
    db.refresh(novel)
    return novel


@router.post("/{novel_id}/import")
def import_novel_file(
    novel_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Path B: upload .txt/.md file for AI analysis."""
    novel = _get_novel_or_404(db, novel_id, user.id)

    if not file.filename or not file.filename.lower().endswith(('.txt', '.md')):
        raise HTTPException(status_code=400, detail="仅支持 .txt 和 .md 文件")

    try:
        raw = file.file.read()
        # Try UTF-8 first, fall back to GBK
        try:
            text = raw.decode('utf-8')
        except UnicodeDecodeError:
            text = raw.decode('gbk', errors='replace')
    except Exception:
        raise HTTPException(status_code=400, detail="文件读取失败，请检查文件编码")

    if not text.strip():
        raise HTTPException(status_code=400, detail="文件内容为空")

    analysis = analyze_import(text, file.filename)

    # Update novel with source info
    novel.source_type = "import"
    novel.file_path = file.filename
    db.commit()

    return {
        "novel_id": novel_id,
        "total_words": analysis["total_words"],
        "chapter_count": analysis["chapter_count"],
        "chapters": analysis["chapters"],
        "prompts": {
            "characters": analysis["characters_prompt"],
            "worldbuilding": analysis["worldbuilding_prompt"],
            "summary": analysis["summary_prompt"],
        },
    }


@router.get("/{novel_id}/export")
def export_novel(
    novel_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export novel as plain text (EPUB/PDF planned for later phase)."""
    novel = _get_novel_or_404(db, novel_id, user.id)

    lines = [f"《{novel.title}》", f"类型：{novel.genre}", f"总字数：{novel.word_count}", "", "=" * 40]

    for ch in novel.chapters:
        lines.append(f"\n\n第{ch.chapter_index}章 {ch.title}\n")
        lines.append(ch.content)

    text = '\n'.join(lines)

    return {
        "novel_id": novel_id,
        "title": novel.title,
        "word_count": sum(ch.word_count for ch in novel.chapters),
        "chapter_count": len(novel.chapters),
        "text": text,
    }

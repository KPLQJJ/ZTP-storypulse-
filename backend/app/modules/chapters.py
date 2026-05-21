import hashlib
import os
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.content import Novel, Chapter
from app.models.user import User
from app.schemas import ChapterOut, ChapterDetail, ChapterUpdate, ChapterUploadResponse, ChaptersUploadResponse
from app.modules.auth import get_current_user

router = APIRouter(prefix="/novels/{novel_id}/chapters", tags=["chapters"])

ALLOWED_EXTENSIONS = {".txt", ".md"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def count_chinese_words(text: str) -> int:
    """统计中文字数（含中英文混合文本）"""
    count = 0
    for ch in text:
        if "一" <= ch <= "鿿":
            count += 1
        elif "㐀" <= ch <= "䶿":
            count += 1
    # 加上英文单词数
    import re
    english_words = len(re.findall(r"[a-zA-Z]+", text))
    return count + english_words


def parse_filename(filename: str) -> str:
    """从文件名提取章节标题（去掉扩展名）"""
    name, _ = os.path.splitext(filename)
    # 尝试匹配 "第X章" 或 纯数字序号前缀
    return name.strip()


@router.post("/upload", response_model=ChapterUploadResponse, status_code=201)
async def upload_chapter(
    novel_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名为空")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型 '{ext}'，仅支持 {', '.join(ALLOWED_EXTENSIONS)}",
        )

    raw = await file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件超过 10MB 上限")

    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content = raw.decode("gbk")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="文件编码无法识别，请使用 UTF-8 或 GBK")

    if not content.strip():
        raise HTTPException(status_code=400, detail="文件内容为空")

    title = parse_filename(file.filename)
    word_count = count_chinese_words(content)
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    # 计算下一个 chapter_index
    max_index = (
        db.query(Chapter)
        .filter(Chapter.novel_id == novel_id)
        .with_entities(Chapter.chapter_index)
        .order_by(Chapter.chapter_index.desc())
        .first()
    )
    next_index = (max_index[0] + 1) if max_index else 1

    chapter = Chapter(
        novel_id=novel_id,
        chapter_index=next_index,
        title=title,
        content=content,
        word_count=word_count,
        source="upload",
        file_format=ext.lstrip("."),
        content_hash=content_hash,
    )
    db.add(chapter)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="该章节序号已被占用，请稍后重试",
        )

    total = db.query(Chapter.word_count).filter(Chapter.novel_id == novel_id).all()
    novel.word_count = sum(c[0] for c in total)

    db.commit()
    db.refresh(chapter)

    return {"message": "章节上传成功", "chapter": chapter}


@router.post("/upload/batch", response_model=ChaptersUploadResponse, status_code=201)
async def upload_chapters_batch(
    novel_id: int,
    files: List[UploadFile] = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user.id:
        raise HTTPException(status_code=403, detail="无权操作此作品")

    uploaded: list[ChapterOut] = []
    errors: list[str] = []

    for file in files:
        if not file.filename:
            errors.append("跳过无名文件")
            continue

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            errors.append(f"{file.filename}: 不支持的文件类型 '{ext}'")
            continue

        raw = await file.read()
        if len(raw) > MAX_FILE_SIZE:
            errors.append(f"{file.filename}: 文件超过 10MB 上限")
            continue

        try:
            content = raw.decode("utf-8")
        except UnicodeDecodeError:
            try:
                content = raw.decode("gbk")
            except UnicodeDecodeError:
                errors.append(f"{file.filename}: 文件编码无法识别")
                continue

        if not content.strip():
            errors.append(f"{file.filename}: 文件内容为空")
            continue

        title = parse_filename(file.filename)
        word_count = count_chinese_words(content)
        content_hash = hashlib.sha256(content.encode()).hexdigest()

        max_index = (
            db.query(Chapter)
            .filter(Chapter.novel_id == novel_id)
            .with_entities(Chapter.chapter_index)
            .order_by(Chapter.chapter_index.desc())
            .first()
        )
        next_index = (max_index[0] + 1) if max_index else 1

        chapter = Chapter(
            novel_id=novel_id,
            chapter_index=next_index,
            title=title,
            content=content,
            word_count=word_count,
            source="upload",
            file_format=ext.lstrip("."),
            content_hash=content_hash,
        )
        db.add(chapter)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            errors.append(f"{file.filename}: 章节序号冲突，跳过")
            continue

        db.refresh(chapter)
        uploaded.append(ChapterOut.model_validate(chapter))

    if not uploaded:
        raise HTTPException(status_code=400, detail="没有成功上传任何章节")

    total = db.query(Chapter.word_count).filter(Chapter.novel_id == novel_id).all()
    novel.word_count = sum(c[0] for c in total)
    db.commit()

    return {
        "message": f"成功上传 {len(uploaded)} 个章节",
        "chapters": uploaded,
        "errors": errors,
    }


def _get_chapter_or_404(db: Session, novel_id: int, chapter_id: int, user_id: int) -> Chapter:
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")
    if novel.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作此作品")
    chapter = db.get(Chapter, chapter_id)
    if not chapter or chapter.novel_id != novel_id:
        raise HTTPException(status_code=404, detail="章节不存在")
    return chapter


@router.get("/{chapter_id}", response_model=ChapterDetail)
def get_chapter(
    novel_id: int,
    chapter_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_chapter_or_404(db, novel_id, chapter_id, user.id)


@router.patch("/{chapter_id}", response_model=ChapterDetail)
def update_chapter(
    novel_id: int,
    chapter_id: int,
    req: ChapterUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chapter = _get_chapter_or_404(db, novel_id, chapter_id, user.id)
    updates = req.model_dump(exclude_unset=True)

    if "title" in updates:
        title = updates["title"]
        if not title or not title.strip():
            raise HTTPException(status_code=400, detail="标题不能为空")
        if len(title) > 200:
            raise HTTPException(status_code=400, detail="标题不能超过 200 字符")
        chapter.title = title.strip()

    if "content" in updates:
        content = updates["content"]
        if not content.strip():
            raise HTTPException(status_code=400, detail="内容不能为空")
        chapter.content = content
        chapter.word_count = count_chinese_words(content)
        chapter.content_hash = hashlib.sha256(content.encode()).hexdigest()

    db.commit()
    db.refresh(chapter)

    # 更新作品总字数
    total = db.query(Chapter.word_count).filter(Chapter.novel_id == novel_id).all()
    novel = db.get(Novel, novel_id)
    if novel:
        novel.word_count = sum(c[0] for c in total)
    db.commit()
    db.refresh(chapter)

    return chapter


@router.delete("/{chapter_id}", status_code=204)
def delete_chapter(
    novel_id: int,
    chapter_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chapter = _get_chapter_or_404(db, novel_id, chapter_id, user.id)
    db.delete(chapter)
    db.commit()

    # 更新作品总字数
    total = db.query(Chapter.word_count).filter(Chapter.novel_id == novel_id).all()
    novel = db.get(Novel, novel_id)
    if novel:
        novel.word_count = sum(c[0] for c in total)
    db.commit()

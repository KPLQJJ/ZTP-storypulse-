import hashlib
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Novel, Chapter
from app.schemas import ChapterOut, ChapterUploadResponse

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
    db: Session = Depends(get_db),
):
    novel = db.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="作品不存在")

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
    db.flush()

    total = db.query(Chapter.word_count).filter(Chapter.novel_id == novel_id).all()
    novel.word_count = sum(c[0] for c in total)

    db.commit()
    db.refresh(chapter)

    return {"message": "章节上传成功", "chapter": chapter}

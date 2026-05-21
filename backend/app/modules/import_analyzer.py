"""
Path B: Half-finished novel import with AI analysis.

Flow:
1. File preprocessing — merge multi-file, detect encoding, extract plain text
2. Chapter recognition — regex title patterns or ~3000字 split → Chapter records
3. AI character extraction — extract names, traits → Characters table
4. AI worldbuilding identification — power system/geography/history/society → Worldbuilding table
5. AI content summary — style, main plot direction → Novel.description
6. Return analysis report for WritePage auto-fill
"""
import logging
import re
import json
from typing import Optional

logger = logging.getLogger(__name__)

# Common chapter title patterns in Chinese web novels
CHAPTER_PATTERNS = [
    re.compile(r'^[第序][\d一二三四五六七八九十百千万零]+[章回节卷].*'),
    re.compile(r'^Chapter\s*\d+', re.IGNORECASE),
    re.compile(r'^[\(（]\s*[\d一二三四五六七八九十]+[\)）].*'),
    re.compile(r'^[第序]\s*\d+\s*[章回节卷].*'),
]

DEFAULT_CHAPTER_WORD_COUNT = 3000


def detect_chapters(text: str) -> list[dict]:
    """Split raw text into chapters using regex patterns.
    If no patterns match, fall back to ~3000字 split.
    Returns list of {title, content, word_count}.
    """
    lines = text.split('\n')
    chapters = []
    current_title = "第1章"
    current_lines = []
    found_chapters = False

    for line in lines:
        stripped = line.strip()
        is_title = any(p.match(stripped) for p in CHAPTER_PATTERNS)

        if is_title and (current_lines or not chapters):
            if current_lines or chapters:
                content = '\n'.join(current_lines).strip()
                if content:
                    chapters.append({
                        "title": current_title,
                        "content": content,
                        "word_count": len(content),
                    })
            current_title = stripped
            current_lines = []
            found_chapters = True
        else:
            current_lines.append(line)

    # Last chapter
    content = '\n'.join(current_lines).strip()
    if content:
        chapters.append({
            "title": current_title,
            "content": content,
            "word_count": len(content),
        })

    # Fallback: split by word count if no patterns matched
    if not found_chapters or len(chapters) <= 1:
        chapters = _split_by_word_count(text)

    return chapters


def _split_by_word_count(text: str, target_words: int = DEFAULT_CHAPTER_WORD_COUNT) -> list[dict]:
    """Fallback: split text into ~3000字 chunks."""
    chunks = []
    start = 0
    chapter_num = 1

    while start < len(text):
        end = min(start + target_words, len(text))
        # Try to break at paragraph boundary
        if end < len(text):
            para_break = text.rfind('\n\n', start, end)
            if para_break > start + target_words // 2:
                end = para_break
            else:
                line_break = text.rfind('\n', start, end)
                if line_break > start + target_words // 2:
                    end = line_break

        content = text[start:end].strip()
        if content:
            chunks.append({
                "title": f"第{chapter_num}章",
                "content": content,
                "word_count": len(content),
            })
        start = end
        chapter_num += 1

    return chunks


def build_character_extraction_prompt(chapters: list[dict], max_chars: int = 10) -> str:
    """Build prompt for AI character extraction."""
    sample_text = '\n\n'.join(
        ch['content'][:800] + ('...' if len(ch['content']) > 800 else '')
        for ch in chapters[:5]
    )
    return f"""分析以下小说片段，提取主要角色信息。最多{max_chars}个角色。

对每个角色输出JSON格式：{{"name":"角色名","description":"特征描述","attributes":{{"推测性别":"男/女/未知","推测重要性":"主角/主要配角/次要配角","推测身份":"..."}}}}

小说内容：
{sample_text}

请只返回JSON数组，不要其他文字。"""


def build_worldbuilding_extraction_prompt(chapters: list[dict]) -> str:
    """Build prompt for AI worldbuilding identification."""
    sample_text = '\n\n'.join(
        ch['content'][:600] + ('...' if len(ch['content']) > 600 else '')
        for ch in chapters[:5]
    )
    return f"""分析以下小说片段，识别世界观设定。从以下4个维度提取：

1. 力量体系：修炼境界、技能系统、异能分类等
2. 地理：重要地点、区域分布
3. 历史：重大事件、时代背景
4. 社会组织：宗门/国家/势力/家族等

对每个条目输出JSON格式：{{"category":"力量体系/地理/历史/社会组织","title":"条目名称","content":"简要说明"}}

小说内容：
{sample_text}

请只返回JSON数组，不要其他文字。"""


def build_summary_prompt(chapters: list[dict]) -> str:
    """Build prompt for AI content summary."""
    sample_text = '\n\n'.join(
        ch['title'] + '\n' + ch['content'][:500]
        for ch in chapters[:5]
    )
    return f"""分析以下小说开头，用一段话（200字以内）概括：

1. 整体风格（热血/轻松/黑暗/搞笑等）
2. 主线方向（升级打怪/权谋斗争/悬疑解密/恋爱日常等）
3. 核心卖点

小说内容：
{sample_text}

请直接返回概括文字，不要JSON格式。"""


def analyze_import(
    text: str,
    file_path: Optional[str] = None,
) -> dict:
    """Main entry: analyze imported novel text.
    Returns structured analysis report.

    Note: AI extraction calls are performed by the caller (novels module)
    using the prompts returned here. This module handles only the
    deterministic preprocessing: encoding detection, chapter splitting.
    """
    # Preprocess: normalize line endings, strip BOM
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    if text.startswith('﻿'):
        text = text[1:]

    total_words = len(text)

    # Detect chapters
    chapters = detect_chapters(text)

    # Build AI prompts (actual AI calls happen in the caller)
    return {
        "total_words": total_words,
        "chapter_count": len(chapters),
        "chapters": chapters,
        "characters_prompt": build_character_extraction_prompt(chapters),
        "worldbuilding_prompt": build_worldbuilding_extraction_prompt(chapters),
        "summary_prompt": build_summary_prompt(chapters),
        "file_path": file_path,
    }

"""
Skill Registry — 启动时扫描 skills/ 目录，构建内存索引。

当前仅保留润色和审稿的通用 Skill 配置。
创作 Skill 后续将开发为多模块体系（内容创作/世界观/角色）。

API:
  GET /skills/genres?type=polish|review  → 可用品类列表
  GET /skills/styles                     → 已废弃，返回空数组
"""
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)

router = APIRouter(tags=["skills"])

SKILLS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "skills"

GENRE_TO_CATEGORY: dict[str, str] = {
    "悬疑": "悬疑类",
}

SKILL_TYPE_TO_FILENAME: dict[str, str] = {
    "polish": "润色_Skill.md",
    "review": "七维审稿_Skill.md",
}


@dataclass
class SkillInfo:
    id: str
    category: str
    level: str
    source_book: str
    type: str
    path: str
    display_name: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "category": self.category,
            "level": self.level,
            "source_book": self.source_book,
            "type": self.type,
            "path": self.path,
            "display_name": self.display_name,
        }


# ── In-memory index ───────────────────────────────────────

_genre_skills: dict[str, dict[str, list[SkillInfo]]] = {}


def _scan_skills() -> None:
    """Scan skills/ directory and populate in-memory index."""
    if not SKILLS_DIR.exists():
        logger.warning("Skills directory not found: %s", SKILLS_DIR)
        return

    for category_dir in SKILLS_DIR.iterdir():
        if not category_dir.is_dir():
            continue
        category_name = category_dir.name
        if category_name in ("蒸馏skill工作流", "风格"):
            continue

        _scan_category(category_dir, category_name)

    logger.info("Skill Registry: %d genre categories loaded", len(_genre_skills))


def _scan_category(category_dir: Path, category_name: str) -> None:
    """Scan one category directory for per-book and universal skills."""
    genres: dict[str, list[SkillInfo]] = {}

    for sub_dir in category_dir.iterdir():
        if not sub_dir.is_dir():
            continue

        level = "universal" if sub_dir.name == "综合版" else "per_book"
        source_book = "" if sub_dir.name == "综合版" else sub_dir.name

        for md_file in sorted(sub_dir.glob("*.md")):
            filename = md_file.name
            skill_type = None
            for t, fname in SKILL_TYPE_TO_FILENAME.items():
                if filename == fname:
                    skill_type = t
                    break
            if not skill_type:
                continue

            skill = SkillInfo(
                id=f"{category_name}/{sub_dir.name}",
                category=category_name,
                level=level,
                source_book=source_book,
                type=skill_type,
                path=str(md_file.relative_to(SKILLS_DIR.parent)),
                display_name=f"{category_name}·{sub_dir.name}" if source_book else f"{category_name}·综合版",
            )

            genres.setdefault(skill_type, []).append(skill)

    if genres:
        _genre_skills[category_name] = genres


# ── Public API ────────────────────────────────────────────

def get_genre_skill(genre: str, skill_type: str) -> Optional[SkillInfo]:
    """Returns the universal skill for the given type, preferring 通用 category."""
    generic = _genre_skills.get("通用", {}).get(skill_type, [])
    if generic:
        return generic[0]

    # Fallback: category-specific match
    category = GENRE_TO_CATEGORY.get(genre)
    if category and category in _genre_skills:
        skills = _genre_skills[category].get(skill_type, [])
        for s in skills:
            if s.level == "universal":
                return s
        if skills:
            return skills[0]

    return None


def load_skill_content(skill_path: str) -> str:
    """Read a Skill Markdown file and return its content."""
    full_path = SKILLS_DIR.parent / skill_path
    if not full_path.exists():
        logger.warning("Skill file not found: %s", full_path)
        return ""
    return full_path.read_text(encoding="utf-8")


# ── Router ────────────────────────────────────────────────

@router.get("/skills/genres")
def list_genre_skills(type: str = Query(..., description="Skill type: polish or review")):
    """List available genre categories for a given skill type."""
    if type not in SKILL_TYPE_TO_FILENAME:
        return []
    result: list[dict] = []
    for category, types in _genre_skills.items():
        if type in types:
            for skill in types[type]:
                result.append(skill.to_dict())
    return result


@router.get("/skills/styles")
def list_style_skills():
    """Deprecated: style skills are no longer used. Returns empty array."""
    return []


# ── Initialize on import ──────────────────────────────────

_scan_skills()

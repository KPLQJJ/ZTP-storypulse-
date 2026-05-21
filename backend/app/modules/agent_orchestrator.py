"""
Multi-Agent Orchestrator for StoryPulse v2.

Routes user requests to the appropriate Agent role and manages
the conversation flow between agents.

For Phase 2, this provides the skeleton — actual AI calls will be
wired in Phase 5 (WritePage).
"""
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.agent import AgentConfig, AgentSession, AgentMessage

logger = logging.getLogger(__name__)

# Agent role definitions
AGENT_ROLES = {
    "outline_writer": {
        "name": "大纲规划师",
        "description": "规划小说大纲、分卷、章节结构",
        "system_prompt": "你是一位资深网文大纲规划师，擅长设计起承转合的叙事结构。",
    },
    "chapter_writer": {
        "name": "章节作家",
        "description": "根据大纲和设定撰写具体章节内容",
        "system_prompt": "你是一位网文作家，擅长写出引人入胜的章节内容。",
    },
    "world_builder": {
        "name": "世界观架构师",
        "description": "构建力量体系、地理、历史等世界观设定",
        "system_prompt": "你是一位世界观架构师，擅长设计自洽且有趣的世界设定。",
    },
    "character_designer": {
        "name": "角色设计师",
        "description": "设计角色外貌、性格、背景故事",
        "system_prompt": "你是一位角色设计师，擅长塑造立体鲜活的人物形象。",
    },
    "polisher": {
        "name": "文字润色师",
        "description": "优化文字表达，提升可读性",
        "system_prompt": "你是一位文字编辑，擅长润色文字使其更流畅生动。",
    },
    "reviewer": {
        "name": "七维审稿人",
        "description": "从七个维度诊断作品质量",
        "system_prompt": "你是一位资深网文审稿人，从七个维度对作品进行专业诊断。",
    },
}


def get_agent_info(agent_role: str) -> Optional[dict]:
    """Get agent role metadata."""
    return AGENT_ROLES.get(agent_role)


def resolve_agent_model(
    db: Session, novel_id: int, agent_role: str
) -> Optional[int]:
    """Resolve which AI model to use for a given agent role on a novel.
    Returns model_id or None if not configured.
    """
    config = (
        db.query(AgentConfig)
        .filter(
            AgentConfig.novel_id == novel_id,
            AgentConfig.agent_role == agent_role,
        )
        .first()
    )
    return config.model_id if config else None


def create_agent_session(
    db: Session,
    novel_id: int,
    user_id: int,
    agent_role: str,
    context_type: Optional[str] = None,
    context_id: Optional[int] = None,
) -> AgentSession:
    """Create a new agent conversation session."""
    agent_info = get_agent_info(agent_role)
    title = f"{agent_info['name']} — 对话" if agent_info else f"{agent_role} — 对话"

    session = AgentSession(
        novel_id=novel_id,
        user_id=user_id,
        context_type=context_type or agent_role,
        context_id=context_id,
        title=title,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def add_agent_message(
    db: Session,
    session_id: int,
    role: str,
    content: str,
    agent_name: Optional[str] = None,
    tokens: Optional[int] = None,
    metadata: Optional[dict] = None,
) -> AgentMessage:
    """Add a message to an agent session."""
    import json
    msg = AgentMessage(
        session_id=session_id,
        role=role,
        agent_name=agent_name,
        content=content,
        tokens=tokens,
        meta_json=json.dumps(metadata or {}, ensure_ascii=False),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_conversation_context(db: Session, session_id: int, max_messages: int = 20) -> list[dict]:
    """Get recent messages for AI context window."""
    messages = (
        db.query(AgentMessage)
        .filter(AgentMessage.session_id == session_id)
        .order_by(AgentMessage.id.desc())
        .limit(max_messages)
        .all()
    )
    messages.reverse()
    return [
        {"role": m.role, "content": m.content, "agent_name": m.agent_name}
        for m in messages
    ]

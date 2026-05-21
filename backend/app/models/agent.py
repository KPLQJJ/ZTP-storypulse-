from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class AgentConfig(Base):
    __tablename__ = "agent_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=False)
    agent_role = Column(String(30), nullable=False)
    model_id = Column(Integer, ForeignKey("ai_models.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        UniqueConstraint("novel_id", "agent_role", name="uq_agent_configs_novel_role"),
        CheckConstraint(
            "agent_role IN ('outline_writer','chapter_writer','world_builder','character_designer','polisher','reviewer')",
            name="ck_agent_configs_role",
        ),
    )

    novel = relationship("Novel", back_populates="agent_configs")
    model = relationship("AiModel")


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    context_type = Column(String(30))
    context_id = Column(Integer)
    title = Column(String(200))
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    novel = relationship("Novel", back_populates="agent_sessions")
    user = relationship("User")
    messages = relationship(
        "AgentMessage", back_populates="session",
        cascade="all, delete-orphan", order_by="AgentMessage.id"
    )


class AgentMessage(Base):
    __tablename__ = "agent_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("agent_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)
    agent_name = Column(String(30))
    content = Column(Text, nullable=False)
    tokens = Column(Integer)
    meta_json = Column("metadata", Text, nullable=False, default="{}")  # JSON
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    __table_args__ = (
        CheckConstraint("role IN ('user', 'assistant', 'system')", name="ck_agent_messages_role"),
    )

    session = relationship("AgentSession", back_populates="messages")

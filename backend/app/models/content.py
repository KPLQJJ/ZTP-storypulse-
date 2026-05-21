from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Novel(Base):
    __tablename__ = "novels"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    genre = Column(String(50), nullable=False)
    description = Column(Text)
    status = Column(String(20), nullable=False, default="draft")
    word_count = Column(Integer, nullable=False, default=0)
    cover_url = Column(String(500))
    tags = Column(Text, nullable=False, default="[]")
    group_id = Column(Integer, ForeignKey("novel_groups.id"))
    source_type = Column(String(20), nullable=False, default="manual")
    file_path = Column(String(500))
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'ongoing', 'completed')", name="ck_novels_status"),
        CheckConstraint(
            "source_type IN ('from_scratch', 'import', 'manual')",
            name="ck_novels_source_type",
        ),
    )

    author = relationship("User", back_populates="novels")
    group = relationship("NovelGroup", back_populates="novels")
    chapters = relationship("Chapter", back_populates="novel", cascade="all, delete-orphan",
                            order_by="Chapter.chapter_index")
    reviews = relationship("Review", back_populates="novel", cascade="all, delete-orphan")
    polishes = relationship("Polish", back_populates="novel", cascade="all, delete-orphan")
    outlines = relationship("Outline", back_populates="novel", cascade="all, delete-orphan")
    characters = relationship("Character", back_populates="novel", cascade="all, delete-orphan")
    worldbuilding_entries = relationship("Worldbuilding", back_populates="novel", cascade="all, delete-orphan")
    agent_configs = relationship("AgentConfig", back_populates="novel", cascade="all, delete-orphan")
    agent_sessions = relationship("AgentSession", back_populates="novel", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=False)
    chapter_index = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="draft")
    source = Column(String(20), nullable=False, default="manual")
    file_path = Column(String(500))
    file_format = Column(String(10))
    content_hash = Column(String(64))
    synced_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        UniqueConstraint("novel_id", "chapter_index", name="uq_chapters_novel_index"),
        CheckConstraint("status IN ('draft', 'published')", name="ck_chapters_status"),
        CheckConstraint("source IN ('manual', 'upload', 'ai_generated')", name="ck_chapters_source"),
    )

    novel = relationship("Novel", back_populates="chapters")

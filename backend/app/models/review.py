from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, CheckConstraint, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=False)
    chapter_ids = Column(Text, nullable=False, default="[]")
    overall_score = Column(Float, nullable=False)
    dimensions = Column(Text, nullable=False, default="[]")
    model_used = Column(String(100))
    tokens_input = Column(Integer)
    tokens_output = Column(Integer)
    credits_cost = Column(Float)
    summary = Column(Text)
    suggestions = Column(Text)
    reviewer_type = Column(String(20), nullable=False, default="auto_ai")
    genre_skill_path = Column(Text)
    status = Column(String(20), nullable=False, default="completed")
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint("overall_score >= 0 AND overall_score <= 10", name="ck_reviews_score"),
        CheckConstraint("reviewer_type IN ('auto_ai', 'manual')", name="ck_reviews_type"),
        CheckConstraint("status IN ('pending', 'completed')", name="ck_reviews_status"),
    )

    novel = relationship("Novel", back_populates="reviews")

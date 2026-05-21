from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Polish(Base):
    __tablename__ = "polishes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=False)
    chapter_ids = Column(Text, nullable=False, default="[]")
    polish_style = Column(String(20))
    input_word_count = Column(Integer, nullable=False, default=0)
    output_word_count = Column(Integer, nullable=False, default=0)
    polish_results = Column(Text, nullable=False, default="[]")
    genre_skill_path = Column(Text)
    style_skill_path = Column(Text)
    model_used = Column(String(100))
    tokens_input = Column(Integer)
    tokens_output = Column(Integer)
    credits_cost = Column(Float)
    status = Column(String(20), nullable=False, default="completed")
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'completed', 'failed')",
            name="ck_polishes_status",
        ),
    )

    novel = relationship("Novel", back_populates="polishes")

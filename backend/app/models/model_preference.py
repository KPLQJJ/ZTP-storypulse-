from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, ForeignKey, UniqueConstraint

from app.database import Base


class UserModelPreference(Base):
    __tablename__ = "user_model_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    application_type = Column(String(20), nullable=False)
    model_id = Column(Integer, ForeignKey("ai_models.id"), nullable=False)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint(
            "application_type IN ('review', 'polish', 'writing')",
            name="ck_prefs_app_type",
        ),
        UniqueConstraint("user_id", "application_type", "novel_id", name="uq_prefs_user_app_novel"),
    )

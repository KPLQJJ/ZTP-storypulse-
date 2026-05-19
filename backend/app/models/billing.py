from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, CheckConstraint, ForeignKey, text
from sqlalchemy.orm import relationship

from app.database import Base


class AiModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    provider = Column(String(50), nullable=False)
    model_id = Column(String(100), nullable=False)
    credits_per_1k_input = Column(Float, nullable=False, default=0)
    credits_per_1k_output = Column(Float, nullable=False, default=0)
    is_active = Column(Integer, nullable=False, default=1, server_default=text("1"))
    created_at = Column(DateTime, nullable=False, default=datetime.now)


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)
    reference_type = Column(String(50))
    reference_id = Column(Integer)
    description = Column(Text)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    __table_args__ = (
        CheckConstraint("type IN ('recharge', 'spend', 'bonus', 'refund')", name="ck_credit_transactions_type"),
    )

    user = relationship("User", back_populates="credit_transactions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    detail = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

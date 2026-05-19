from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, CheckConstraint, ForeignKey, text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500))
    role = Column(String(20), nullable=False, default="writer")
    is_active = Column(Integer, nullable=False, default=1, server_default=text("1"))
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime, nullable=True)
    token_version = Column(Integer, nullable=False, default=0)
    totp_secret = Column(String(32), nullable=True)
    totp_enabled = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint("role IN ('writer', 'reviewer', 'admin')", name="ck_users_role"),
    )

    # 关系
    novels = relationship("Novel", back_populates="author")
    membership = relationship("UserMembership", back_populates="user", uselist=False)
    credit_transactions = relationship("CreditTransaction", back_populates="user")


class MembershipPlan(Base):
    __tablename__ = "membership_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(20), nullable=False, unique=True)
    price_rmb = Column(Float, nullable=False, default=0)
    credits_per_month = Column(Integer, nullable=False, default=0)
    storage_limit_bytes = Column(Integer, nullable=False, default=0)
    features = Column(Text, nullable=False, default="{}")
    is_active = Column(Integer, nullable=False, default=1, server_default=text("1"))
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    __table_args__ = (
        CheckConstraint("name IN ('free', 'pro', 'premium')", name="ck_membership_plans_name"),
    )

    memberships = relationship("UserMembership", back_populates="plan")


class UserMembership(Base):
    __tablename__ = "user_memberships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(Integer, ForeignKey("membership_plans.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        CheckConstraint("status IN ('active', 'expired', 'cancelled')", name="ck_user_memberships_status"),
    )

    user = relationship("User", back_populates="membership")
    plan = relationship("MembershipPlan", back_populates="memberships")

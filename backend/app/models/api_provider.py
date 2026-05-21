from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime

from app.database import Base


class ApiProvider(Base):
    __tablename__ = "api_providers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    display_name = Column(String(100), nullable=False)
    base_url = Column(String(500), nullable=False)
    api_key = Column(Text, nullable=False)  # AES256 encrypted
    is_active = Column(Integer, nullable=False, default=1)
    health_status = Column(String(20), nullable=False, default="unknown")
    last_health_check = Column(DateTime, nullable=True)
    consecutive_failures = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

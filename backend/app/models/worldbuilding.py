from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Worldbuilding(Base):
    __tablename__ = "worldbuilding"

    id = Column(Integer, primary_key=True, autoincrement=True)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False)  # 力量体系/地理/历史/社会组织/其他
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    novel = relationship("Novel", back_populates="worldbuilding_entries")

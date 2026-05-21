from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Outline(Base):
    __tablename__ = "outlines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("outlines.id", ondelete="SET NULL"))
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False, default="")
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    novel = relationship("Novel", back_populates="outlines")
    parent = relationship("Outline", remote_side=[id], back_populates="children")
    children = relationship("Outline", back_populates="parent", order_by="Outline.sort_order")

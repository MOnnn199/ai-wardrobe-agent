from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from . import Base

class Tag(Base):
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String, default='')
    color = Column(String, default='')
    created_at = Column(DateTime, server_default=func.now())

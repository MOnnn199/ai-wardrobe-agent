from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.sql import func
from . import Base

class KnowledgeChunk(Base):
    __tablename__ = 'knowledge_chunks'

    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(String, unique=True, index=True)
    source = Column(String, default='')
    text = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

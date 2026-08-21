from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from . import Base

class Correction(Base):
    __tablename__ = "corrections"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    stylist_id = Column(Integer, ForeignKey("users.id"))
    error_type = Column(String)  # style / occasion / color / size / other
    correct_response = Column(Text)
    status = Column(String, default="pending")  # pending / fixed / approved / deployed
    created_at = Column(DateTime, server_default=func.now())

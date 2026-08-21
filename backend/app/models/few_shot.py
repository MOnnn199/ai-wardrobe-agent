from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from . import Base

class FewShotExample(Base):
    __tablename__ = 'few_shot_examples'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    user_input = Column(Text)
    correct_response = Column(Text)
    category = Column(String, default='')
    created_at = Column(DateTime, server_default=func.now())

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from . import Base


class KnowledgeGapStatus(Base):
    """知识缺口处理状态（话题维度的闭环标记）。

    缺口本身由低分对话实时聚类产生，不落库；本表只记录每个话题的处理状态，
    topic_key 用代表句文本的 MD5 前 16 位，保证聚类结果稳定可匹配。
    """

    __tablename__ = 'knowledge_gap_status'

    id = Column(Integer, primary_key=True, index=True)
    topic_key = Column(String(32), unique=True, index=True)
    topic = Column(String(255), default='')
    status = Column(String(16), default='open')  # open / handled / ignored
    note = Column(Text, default='')
    handled_at = Column(DateTime, default=None)
    created_at = Column(DateTime, server_default=func.now())

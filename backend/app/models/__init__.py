from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from app.models.user import User
from app.models.wardrobe import ClothingItem, WearLog
from app.models.conversation import Conversation, AgentStep
from app.models.correction import Correction
from app.models.config import PromptVersion, ToolConfig
from app.models.tag import Tag
from app.models.few_shot import FewShotExample
from app.models.knowledge import KnowledgeChunk
from app.models.notification import Notification
from app.models.cost import CostLog
from app.models.outfit import Outfit
from app.models.calendar import CalendarEvent
from app.models.item_correction import ClothingItemCorrection
from app.models.adoption import AdoptionRecord
from app.models.trace import AgentTrace
from app.models.knowledge_gap_status import KnowledgeGapStatus

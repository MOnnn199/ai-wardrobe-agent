from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
import json


class UserCreate(BaseModel):
    username: str
    password: str
    nickname: str = ''
    role: str = 'user'


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    nickname: str
    role: str
    created_at: Optional[datetime] = None


class ClothingCreate(BaseModel):
    name: str
    category: str
    color: str = ''
    style: str = ''
    material: str = ''
    pattern: str = ''
    season: str = ''
    occasion: str = ''
    image_url: str = ''
    status: str = 'confirmed'
    purchase_date: Optional[date] = None
    last_worn: Optional[date] = None
    wear_count: int = 0


class ClothingUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    style: Optional[str] = None
    material: Optional[str] = None
    pattern: Optional[str] = None
    season: Optional[str] = None
    occasion: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[str] = None
    purchase_date: Optional[date] = None
    last_worn: Optional[date] = None
    wear_count: Optional[int] = None

    @field_validator('purchase_date', 'last_worn', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == '' or v == 'null' or v == 'None':
            return None
        return v


class ClothingResponse(BaseModel):
    model_config = {'from_attributes': True}

    id: int
    user_id: int
    name: str
    category: str
    color: str
    style: str
    material: str = ''
    pattern: str = ''
    season: str
    occasion: str
    image_url: str
    status: str
    tags: str = '[]'
    purchase_date: Optional[date] = None
    last_worn: Optional[date] = None
    wear_count: int = 0
    created_at: Optional[datetime] = None


class ConversationResponse(BaseModel):
    model_config = {'from_attributes': True}

    id: int
    user_id: int
    user_input: str
    agent_response: Optional[str] = None
    score: int = 0
    feedback: str = ''
    status: str = 'normal'
    user_image_url: Optional[str] = None
    history: Optional[list] = None
    created_at: Optional[datetime] = None
    turn_count: int = 1

    @field_validator('history', mode='before')
    @classmethod
    def parse_history_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v or '[]')
            except Exception:
                return []
        return v


class RatingRequest(BaseModel):
    conversation_id: int
    score: int
    feedback: str = ''


class ChatRequest(BaseModel):
    user_input: str
    user_id: int = 1
    conversation_id: int = 0
    system_prompt: str = ''


class ChatResponse(BaseModel):
    response: str
    conversation_id: int
    steps: list
    outfit_image: Optional[str] = None
    items: list = []


class CorrectionCreate(BaseModel):
    conversation_id: int
    stylist_id: int = 1
    error_type: str = ''
    correct_response: str = ''


class CorrectionUpdate(BaseModel):
    error_type: Optional[str] = None
    correct_response: Optional[str] = None


class CorrectionResponse(BaseModel):
    id: int
    conversation_id: int
    stylist_id: int
    error_type: str
    correct_response: str
    status: str
    created_at: Optional[datetime] = None


class RAGDocumentResponse(BaseModel):
    id: str
    text: str
    score: Optional[float] = None


class KnowledgeChunkResponse(BaseModel):
    id: str
    text: str
    metadata: dict = {}


class RAGStatsResponse(BaseModel):
    total_chunks: int
    queries_today: int
    hit_rate: float


class FewShotExample(BaseModel):
    id: Optional[int] = None
    title: str
    user_input: str
    correct_response: str
    category: str = ''
    created_at: Optional[datetime] = None


class GapStatusUpdate(BaseModel):
    topic: str = ''
    status: str = 'open'  # open / handled / ignored
    note: str = ''


class TagCreate(BaseModel):
    name: str
    category: str = ''
    color: str = ''


class TagResponse(BaseModel):
    id: int
    name: str
    category: str
    color: str


class PromptCreate(BaseModel):
    name: str
    content: str


class PromptUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None


class PromptResponse(BaseModel):
    id: int
    name: str
    content: str
    status: str
    created_at: Optional[datetime] = None
    deployed_at: Optional[datetime] = None


class ModelConfigUpdate(BaseModel):
    provider: str = 'deepseek'
    model_name: str = 'deepseek-chat'
    temperature: float = 0.7
    top_p: float = 1.0
    vision_model: str = 'qwen-vl-plus'

    model_config = {'protected_namespaces': ()}


class ToolToggle(BaseModel):
    tool_name: str
    enabled: bool
    order: int = 0


class ABTestRequest(BaseModel):
    test_name: str
    config_a: dict
    config_b: dict
    test_cases: list


class ABTestResponse(BaseModel):
    config_a_score: float
    config_b_score: float
    difference: float
    recommendation: str


class PipelineAction(BaseModel):
    correction_id: int
    action: str


class WardrobeAnalysisResponse(BaseModel):
    total_items: int
    category_distribution: dict
    season_distribution: dict
    color_distribution: dict
    unused_items: list
    duplicate_warnings: list
    suggestions: list


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    content: str
    image_url: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None


class NotificationCreate(BaseModel):
    user_id: int
    type: str = 'system'
    title: str
    content: str
    image_url: Optional[str] = None


# ===================== P1 新增 =====================

class OutfitCreate(BaseModel):
    name: str = '我的套装'
    item_ids: list[int] = []
    description: str = ''


class OutfitUpdate(BaseModel):
    name: Optional[str] = None
    item_ids: Optional[list[int]] = None
    description: Optional[str] = None


class OutfitResponse(BaseModel):
    model_config = {'from_attributes': True}
    id: int
    user_id: int
    name: str
    item_ids: list[int] = []
    description: str = ''
    cover_url: str = ''
    created_at: Optional[datetime] = None

    @field_validator('item_ids', mode='before')
    @classmethod
    def parse_item_ids(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v or '[]')
            except Exception:
                return []
        return v


class CalendarEventCreate(BaseModel):
    title: str
    event_date: str  # YYYY-MM-DD
    start_time: str = ''
    end_time: str = ''
    occasion: str = ''
    location: str = ''
    note: str = ''
    remind: int = 1


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    event_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    occasion: Optional[str] = None
    location: Optional[str] = None
    note: Optional[str] = None
    remind: Optional[int] = None


class CalendarEventResponse(BaseModel):
    model_config = {'from_attributes': True}
    id: int
    user_id: int
    title: str
    event_date: date
    start_time: str = ''
    end_time: str = ''
    occasion: str = ''
    location: str = ''
    note: str = ''
    remind: int = 1
    created_at: Optional[datetime] = None


class ItemCorrectionCreate(BaseModel):
    item_id: int
    error_fields: list[str] = []
    correct_attrs: dict = {}
    note: str = ''


class ItemCorrectionResponse(BaseModel):
    model_config = {'from_attributes': True}
    id: int
    item_id: int
    user_id: int
    stylist_id: int
    error_fields: list = []
    correct_attrs: dict = {}
    note: str = ''
    status: str = 'pending'
    created_at: Optional[datetime] = None

    @field_validator('error_fields', mode='before')
    @classmethod
    def parse_fields(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v or '[]')
            except Exception:
                return []
        return v

    @field_validator('correct_attrs', mode='before')
    @classmethod
    def parse_attrs(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v or '{}')
            except Exception:
                return {}
        return v


class AdoptionCreate(BaseModel):
    item_ids: list[int] = []
    source: str = 'chat'
    scene: str = ''
    conversation_id: int = 0
    reason: str = ''
    adopted_date: Optional[str] = None  # YYYY-MM-DD，默认今天


class AdoptionResponse(BaseModel):
    model_config = {'from_attributes': True}
    id: int
    user_id: int
    source: str
    scene: str
    conversation_id: int
    item_ids: list = []
    reason: str = ''
    adopted_date: date
    created_at: Optional[datetime] = None

    @field_validator('item_ids', mode='before')
    @classmethod
    def parse_ids(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v or '[]')
            except Exception:
                return []
        return v


class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    skin_tone: Optional[str] = None
    body_type: Optional[str] = None
    style_preference: Optional[str] = None


class ModerationReview(BaseModel):
    action: str  # approve / block
    note: str = ''


class SceneRecommendRequest(BaseModel):
    scene: str = 'commute'   # commute/date/sport/wedding/party/travel...
    note: str = ''           # 附加需求描述
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class AdminUserDisable(BaseModel):
    user_id: int
    disable: bool = True

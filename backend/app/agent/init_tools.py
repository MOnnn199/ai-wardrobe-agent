from app.agent.tool_registry import ToolRegistry
from app.agent.tools.weather import WeatherTool
from app.agent.tools.wardrobe import WardrobeTool
from app.agent.tools.knowledge import KnowledgeRetrievalTool
from app.agent.tools.outfit_check import OutfitCheckTool
from app.agent.tools.image_analysis import ImageAnalysisTool
from app.agent.tools.similar_clothes import SimilarClothesTool
from app.agent.tools.user_profile import UserProfileTool
from app.agent.tools.my_outfits import MyOutfitsTool
from app.agent.tools.color_tools import ColorHarmonyTool, PantoneConvertTool
from app.agent.tools.outfit_scorer import OutfitScorerTool, SeasonalTool

tool_registry = ToolRegistry()
tool_registry.register(WeatherTool())
tool_registry.register(WardrobeTool())
tool_registry.register(KnowledgeRetrievalTool())
tool_registry.register(OutfitCheckTool())
tool_registry.register(ImageAnalysisTool())
tool_registry.register(SimilarClothesTool())
tool_registry.register(UserProfileTool())
tool_registry.register(MyOutfitsTool())
tool_registry.register(ColorHarmonyTool())
tool_registry.register(PantoneConvertTool())
tool_registry.register(OutfitScorerTool())
tool_registry.register(SeasonalTool())


def _apply_persisted_tool_states():
    """启动时从 tool_configs 表恢复各工具的 enabled 状态（默认全开）。"""
    try:
        from app.models import SessionLocal
        from app.models.config import ToolConfig
        db = SessionLocal()
        try:
            for cfg in db.query(ToolConfig).all():
                t = tool_registry.get(cfg.tool_name)
                if t:
                    t.enabled = bool(cfg.enabled)
        finally:
            db.close()
    except Exception as e:
        print(f"[init_tools] load tool states failed: {e}")


_apply_persisted_tool_states()

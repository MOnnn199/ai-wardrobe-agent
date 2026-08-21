# Pipeline status machine for correction workflow
from enum import Enum

class PipelineStatus(str, Enum):
    PENDING = "pending"      # 待搭配师修
    FIXED = "fixed"          # 已修待审
    APPROVED = "approved"    # 已审批
    DEPLOYED = "deployed"    # 已上线

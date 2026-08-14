from dataclasses import dataclass, field
from typing import List

@dataclass
class RetentionRecommendation:
    action: str
    priority: str
    triggering_driver: str
    reason: str
    supporting_indicators: List[str] = field(default_factory=list)

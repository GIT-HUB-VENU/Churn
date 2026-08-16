from typing import List, Dict, Any
from pydantic import BaseModel

class MemberRecommendationResponse(BaseModel):
    memberId: str
    riskLevel: str
    churnProbability: float
    recommendations: List[Dict[str, Any]]

class RetentionSummaryResponse(BaseModel):
    totalHighRiskMembers: int
    totalMediumRiskMembers: int
    totalLowRiskMembers: int
    predictedChurnRate: float
    mostCommonDrivers: List[Dict[str, Any]]
    mostRecommendedActions: List[Dict[str, Any]]
    highPriorityOpportunitiesCount: int

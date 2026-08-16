from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class MemberQueryResponse(BaseModel):
    totalCount: int
    page: int
    limit: int
    totalPages: int
    members: List[Dict[str, Any]]

class DriverItem(BaseModel):
    feature: str
    featureLabel: str
    observedValue: str
    contribution: float
    explanation: str

class MemberDetailResponse(BaseModel):
    member: Dict[str, Any]
    churnProbability: float
    riskLevel: str
    prediction: str
    topDrivers: List[DriverItem]
    recommendations: List[Dict[str, Any]]
    aiExplanation: str

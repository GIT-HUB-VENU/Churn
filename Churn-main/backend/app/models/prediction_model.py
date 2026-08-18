from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.member_model import DriverItem

class PredictionResponse(BaseModel):
    churnProbability: float
    riskLevel: str
    prediction: str
    topDrivers: List[DriverItem]

class ConfusionMatrix(BaseModel):
    truePositive: int
    falsePositive: int
    trueNegative: int
    falseNegative: int

class ModelMetricsResponse(BaseModel):
    modelType: str
    accuracy: float
    precision: float
    recall: float
    f1Score: float
    rocAuc: float
    confusionMatrix: ConfusionMatrix
    trainSize: int
    testSize: int

class GlobalDriverItem(BaseModel):
    feature: str
    featureLabel: str
    importance: float

class ThresholdUpdateRequest(BaseModel):
    lowMax: float
    mediumMax: float

from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class LocalDriver:
    feature: str
    feature_label: str
    observed_value: str
    contribution: float
    explanation: str

@dataclass
class PredictionResult:
    member_id: str
    churn_probability: float
    risk_level: str
    prediction: str
    top_drivers: List[LocalDriver] = field(default_factory=list)

@dataclass
class ModelMetrics:
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: Dict[str, int]

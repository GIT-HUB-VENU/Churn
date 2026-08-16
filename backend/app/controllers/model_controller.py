from typing import Dict, Any, List

class ModelController:
    def __init__(self, churn_service):
        self.churn_service = churn_service

    def get_model_metrics(self) -> Dict[str, Any]:
        return self.churn_service.get_metrics()

    def get_model_drivers(self) -> List[Dict[str, Any]]:
        return self.churn_service.get_global_feature_importance()

from typing import Dict, Any
from fastapi import HTTPException
from app.services.data_service import DataService
from app.services.explainability_service import ExplainabilityService

class PredictionController:
    def __init__(self, churn_service):
        self.churn_service = churn_service

    def predict_member(self, member: Dict[str, Any]) -> Dict[str, Any]:
        if not member:
            raise HTTPException(status_code=400, detail="Member data is required")

        members, schema = DataService.load_dataset()
        processed = self.churn_service.get_processed_dataset()

        pred_res = self.churn_service.predict_member(member)

        top_drivers = (
            ExplainabilityService.get_member_drivers(
                member, schema, processed, self.churn_service, top_n=5
            )
            if processed else []
        )

        return {
            "churnProbability": pred_res["probability"],
            "riskLevel": pred_res["riskLevel"],
            "prediction": pred_res["prediction"],
            "topDrivers": top_drivers,
        }

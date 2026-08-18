from typing import Dict, Any
from fastapi import HTTPException
from app.services.data_service import DataService
from app.services.explainability_service import ExplainabilityService
from app.services.retention_service import RetentionService

class RecommendationController:
    def __init__(self, churn_service):
        self.churn_service = churn_service

    def get_member_recommendations(self, member_id: str) -> Dict[str, Any]:
        member = DataService.get_member_by_id(member_id)
        if not member:
            raise HTTPException(status_code=404, detail=f"Member {member_id} not found")

        members, schema = DataService.load_dataset()
        processed = self.churn_service.get_processed_dataset()

        pred_res = self.churn_service.predict_member(member)
        probability = pred_res["probability"]
        risk_level = pred_res["riskLevel"]

        top_drivers = (
            ExplainabilityService.get_member_drivers(
                member, schema, processed, self.churn_service, top_n=5
            )
            if processed else []
        )

        recommendations = RetentionService.generate_recommendations(
            member, risk_level, probability, top_drivers
        )

        # Estimate post-retention churn probability based on recommendation impact
        reduction_map = {"HIGH": 0.15, "MEDIUM": 0.10, "LOW": 0.05}
        remaining = probability
        for i, rec in enumerate(recommendations):
            # Diminishing returns for each subsequent recommendation
            factor = reduction_map.get(rec.get("priority", "LOW"), 0.05)
            remaining *= (1 - factor * (0.7 ** i))
        post_retention_probability = round(max(remaining, 0.01), 4)

        return {
            "memberId": member_id,
            "riskLevel": risk_level,
            "churnProbability": probability,
            "recommendations": recommendations,
            "postRetentionProbability": post_retention_probability,
        }

    def get_retention_summary(self) -> Dict[str, Any]:
        return self.churn_service.get_cached_retention_summary()

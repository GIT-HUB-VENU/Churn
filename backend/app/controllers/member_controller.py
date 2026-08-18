import math
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.services.data_service import DataService
from app.services.explainability_service import ExplainabilityService
from app.services.retention_service import RetentionService
from app.services.gemini_service import GeminiService

class MemberController:
    def __init__(self, churn_service):
        self.churn_service = churn_service

    def get_members(
        self,
        search: Optional[str] = None,
        riskLevel: Optional[str] = None,
        planType: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
        sortBy: str = "churnProbability",
        sortOrder: str = "desc"
    ) -> Dict[str, Any]:
        members, schema = DataService.load_dataset()
        id_col = schema["idColumn"]

        result = []
        for i, m in enumerate(members):
            m_id = str(m.get(id_col) or m.get("Member_ID", f"MMB-{10001 + i}"))
            pred_res = self.churn_service.get_member_prediction_fast(m_id, m)
            item = dict(m)
            item["churnProbability"] = pred_res["probability"]
            item["riskLevel"] = pred_res["riskLevel"]
            item["prediction"] = pred_res["prediction"]
            result.append(item)

        # Filter search
        if search:
            q = str(search).lower()
            filtered = []
            for m in result:
                id_val = str(m.get(id_col, "")).lower()
                plan_t = str(m.get("Plan_Type", "")).lower()
                plan_tier = str(m.get("Plan_Tier", "")).lower()
                if q in id_val or q in plan_t or q in plan_tier:
                    filtered.append(m)
            result = filtered

        # Filter risk
        if riskLevel and riskLevel.upper() != "ALL":
            target_risk = riskLevel.upper()
            result = [m for m in result if m.get("riskLevel") == target_risk]

        # Filter plan
        if planType and planType.upper() != "ALL":
            target_plan = planType.lower()
            result = [m for m in result if str(m.get("Plan_Type", "")).lower() == target_plan]

        # Sort
        def sort_key(item):
            val = item.get(sortBy)
            if val is None:
                val = 0
            if isinstance(val, str):
                return val.lower()
            return val

        reverse = (sortOrder.lower() == "desc")
        result.sort(key=sort_key, reverse=reverse)

        # Pagination
        page_num = max(1, page)
        limit_num = max(1, limit)
        total_count = len(result)
        start_index = (page_num - 1) * limit_num
        paginated_members = result[start_index : start_index + limit_num]

        return {
            "totalCount": total_count,
            "page": page_num,
            "limit": limit_num,
            "totalPages": math.ceil(total_count / limit_num) if total_count > 0 else 1,
            "members": paginated_members,
        }

    async def get_member_by_id(self, member_id: str) -> Dict[str, Any]:
        member = DataService.get_member_by_id(member_id)
        if not member:
            raise HTTPException(status_code=404, detail=f"Member {member_id} not found")

        members, schema = DataService.load_dataset()
        processed = self.churn_service.get_processed_dataset()

        pred_res = self.churn_service.predict_member(member)
        probability = pred_res["probability"]
        risk_level = pred_res["riskLevel"]
        prediction = pred_res["prediction"]

        top_drivers = (
            ExplainabilityService.get_member_drivers(
                member, schema, processed, self.churn_service, top_n=5
            )
            if processed else []
        )

        recommendations = RetentionService.generate_recommendations(
            member, risk_level, probability, top_drivers
        )

        # Calculate post-retention churn probability using diminishing returns
        reduction_map = {"HIGH": 0.15, "MEDIUM": 0.10, "LOW": 0.05}
        remaining = probability
        for i, rec in enumerate(recommendations):
            factor = reduction_map.get(rec.get("priority", "LOW"), 0.05)
            remaining *= (1 - factor * (0.7 ** i))
        post_retention_probability = round(max(remaining, 0.01), 4)

        ai_explanation = await GeminiService.generate_member_explanation(
            member_id=str(member.get(schema["idColumn"], "")),
            plan_type=str(member.get("Plan_Type") or "Plan"),
            churn_probability=probability,
            risk_level=risk_level,
            top_drivers=top_drivers,
            approved_actions=recommendations
        )

        return {
            "member": member,
            "churnProbability": probability,
            "riskLevel": risk_level,
            "prediction": prediction,
            "topDrivers": top_drivers,
            "recommendations": recommendations,
            "aiExplanation": ai_explanation,
            "postRetentionProbability": post_retention_probability,
        }

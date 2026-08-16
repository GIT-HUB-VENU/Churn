from typing import Dict, Any, List
from app.utils.helpers import safe_float

class ExplainabilityService:
    @staticmethod
    def get_member_drivers(
        member: Dict[str, Any],
        schema: Dict[str, Any],
        processed: Dict[str, Any],
        churn_service: Any,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        drivers: List[Dict[str, Any]] = []

        unresolved_cases = safe_float(member.get("Unresolved_Service_Cases"))
        service_contacts = safe_float(member.get("Service_Contact_Count"))
        oop_cost = safe_float(member.get("Out_Of_Pocket_Cost"))
        oop_change_pct = safe_float(member.get("Out_Of_Pocket_Change_Pct"))
        benefit_util = safe_float(member.get("Benefit_Utilization_Score"), default=-1.0)
        provider_issues = safe_float(member.get("Provider_Access_Issues"))
        wait_days = safe_float(member.get("Appointment_Wait_Days"))
        pharmacy_issues = safe_float(member.get("Pharmacy_Support_Issues"))
        engagement_trend = str(member.get("Engagement_Score_Trend") or "Stable")
        recent_plan_change = str(member.get("Plan_Change_Recent") or "No")
        portal_logins = safe_float(member.get("Portal_Logins_Last_90d"))

        # 1. Unresolved Service Cases
        if unresolved_cases >= 1:
            drivers.append({
                "feature": "Unresolved_Service_Cases",
                "featureLabel": "Unresolved Service Cases",
                "observedValue": f"{int(unresolved_cases)} case{'s' if unresolved_cases > 1 else ''}",
                "contribution": round(0.25 + unresolved_cases * 0.05, 2),
                "explanation": f"{int(unresolved_cases)} open service case(s) without timely resolution is strongly associated with elevated churn risk.",
            })

        # 2. High Service Contact Frequency
        if service_contacts >= 5:
            drivers.append({
                "feature": "Service_Contact_Count",
                "featureLabel": "High Service Contact Count",
                "observedValue": f"{int(service_contacts)} contacts",
                "contribution": round(0.15 + service_contacts * 0.01, 2),
                "explanation": f"Elevated service touchpoints ({int(service_contacts)} contacts) indicate ongoing member service friction.",
            })

        # 3. Out of Pocket Cost & Increase
        if oop_change_pct > 20 or oop_cost > 3500:
            drivers.append({
                "feature": "Out_Of_Pocket_Change_Pct",
                "featureLabel": "Out-of-Pocket Cost Increase",
                "observedValue": f"${int(oop_cost):,} (+{int(oop_change_pct)}% change)",
                "contribution": round(0.18 + min(0.15, oop_change_pct / 200), 2),
                "explanation": "Substantial out-of-pocket cost burden and cost increases are associated with higher plan switching probability.",
            })

        # 4. Low Benefit Utilization
        if benefit_util < 0.35:
            util_pct = int(round(benefit_util * 100))
            drivers.append({
                "feature": "Benefit_Utilization_Score",
                "featureLabel": "Low Benefit Utilization",
                "observedValue": f"{util_pct}% utilization",
                "contribution": round(0.20 + (0.35 - benefit_util) * 0.2, 2),
                "explanation": f"Lower plan benefit utilization ({util_pct}%) suggests member confusion or under-activation of plan value.",
            })

        # 5. Provider Access & Appointment Delays
        if provider_issues >= 1 or wait_days >= 21:
            drivers.append({
                "feature": "Provider_Access_Issues",
                "featureLabel": "Provider Access & Delay",
                "observedValue": f"{int(wait_days)} days wait / {int(provider_issues)} access issue(s)",
                "contribution": round(0.14 + wait_days * 0.003, 2),
                "explanation": "Appointment delays and in-network provider availability issues contribute to elevated churn probability.",
            })

        # 6. Pharmacy Support Friction
        if pharmacy_issues >= 1:
            drivers.append({
                "feature": "Pharmacy_Support_Issues",
                "featureLabel": "Pharmacy Service Friction",
                "observedValue": f"{int(pharmacy_issues)} pharmacy issue(s)",
                "contribution": round(0.16 + pharmacy_issues * 0.03, 2),
                "explanation": "Unresolved prescription fulfillment and pharmacy benefit friction contribute to member dissatisfaction.",
            })

        # 7. Declining Engagement & Portal Activity
        if engagement_trend == "Declining" or portal_logins <= 3:
            drivers.append({
                "feature": "Engagement_Score_Trend",
                "featureLabel": "Declining Digital Engagement",
                "observedValue": f"{engagement_trend} trend ({int(portal_logins)} logins in 90d)",
                "contribution": 0.15,
                "explanation": "Decreasing digital portal activity and engagement trend is associated with disenrollment probability.",
            })

        # 8. Recent Plan Change Confusion
        if recent_plan_change == "Yes":
            drivers.append({
                "feature": "Plan_Change_Recent",
                "featureLabel": "Recent Plan Change",
                "observedValue": "Changed plan within last 12m",
                "contribution": 0.12,
                "explanation": "Recent plan tier or structure changes often generate initial onboarding friction and benefit confusion.",
            })

        # Protective / Low risk factors if drivers list is small
        if len(drivers) < 2:
            tenure = float(member.get("Tenure_Months") or 0)
            if tenure > 24:
                drivers.append({
                    "feature": "Tenure_Months",
                    "featureLabel": "Member Tenure",
                    "observedValue": f"{int(tenure)} months",
                    "contribution": -0.12,
                    "explanation": f"Established tenure ({int(tenure)} months) reflects baseline plan loyalty and continuity of care.",
                })
            prev_visits = float(member.get("Preventive_Care_Visits") or 0)
            if prev_visits >= 2:
                drivers.append({
                    "feature": "Preventive_Care_Visits",
                    "featureLabel": "Preventive Care Engagement",
                    "observedValue": f"{int(prev_visits)} preventive visits",
                    "contribution": -0.10,
                    "explanation": "Regular preventive care engagement supports positive member retention outcomes.",
                })

        # Dynamic fallback for custom CSV datasets with arbitrary column names
        if len(drivers) == 0 and churn_service:
            global_drivers = churn_service.get_global_feature_importance()
            for imp in global_drivers[:top_n]:
                feat_name = imp.get("feature")
                feat_label = imp.get("featureLabel", feat_name)
                val = member.get(feat_name)
                obs_str = str(val) if val is not None else "Observed"
                contrib = round(float(imp.get("importance", 0.15)), 2)
                drivers.append({
                    "feature": feat_name,
                    "featureLabel": feat_label,
                    "observedValue": obs_str,
                    "contribution": contrib,
                    "explanation": f"Observed feature value '{obs_str}' for {feat_label} is associated with predicted churn probability.",
                })

        # Sort by absolute contribution magnitude
        drivers.sort(key=lambda d: abs(d["contribution"]), reverse=True)

        return drivers[:top_n]

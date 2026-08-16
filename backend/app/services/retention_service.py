from typing import Dict, Any, List
from app.utils.helpers import safe_float

class RetentionService:
    @staticmethod
    def generate_recommendations(
        member: Dict[str, Any],
        risk_level: str,
        churn_probability: float,
        drivers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        recs: List[Dict[str, Any]] = []

        unresolved_cases = safe_float(member.get("Unresolved_Service_Cases"))
        service_contacts = safe_float(member.get("Service_Contact_Count"))
        oop_cost = safe_float(member.get("Out_Of_Pocket_Cost"))
        oop_change_pct = safe_float(member.get("Out_Of_Pocket_Change_Pct"))
        benefit_util = safe_float(member.get("Benefit_Utilization_Score"), default=-1.0)
        provider_issues = safe_float(member.get("Provider_Access_Issues"))
        wait_days = safe_float(member.get("Appointment_Wait_Days"))
        pharmacy_issues = safe_float(member.get("Pharmacy_Support_Issues"))
        recent_plan_change = str(member.get("Plan_Change_Recent") or "No")
        engagement_trend = str(member.get("Engagement_Score_Trend") or "Stable")

        # Rule 1: Service Recovery
        if unresolved_cases >= 1 or service_contacts >= 6:
            priority = "HIGH" if (unresolved_cases >= 2 or risk_level == "HIGH") else "MEDIUM"
            recs.append({
                "action": "Service Recovery",
                "priority": priority,
                "triggeringDriver": f"{int(unresolved_cases)} unresolved case(s), {int(service_contacts)} contact(s)",
                "reason": "Unresolved service interactions are contributing to elevated churn risk and member dissatisfaction.",
                "supportingIndicators": [
                    f"Unresolved Service Cases: {int(unresolved_cases)}",
                    f"Total Service Contacts: {int(service_contacts)}",
                ],
            })

        # Rule 2: Benefit Education
        if oop_change_pct > 15 or oop_cost > 3000 or benefit_util < 0.35:
            priority = "HIGH" if (oop_change_pct > 30 or benefit_util < 0.20) else "MEDIUM"
            util_pct = int(round(benefit_util * 100))
            recs.append({
                "action": "Benefit Education",
                "priority": priority,
                "triggeringDriver": f"Cost change +{int(oop_change_pct)}%, Benefit utilization {util_pct}%",
                "reason": "Observed benefit utilization and cost indicators are associated with elevated churn risk. Proactive guidance on preventative coverage and cost caps can improve plan value retention.",
                "supportingIndicators": [
                    f"Out-of-Pocket Cost: ${int(oop_cost):,}",
                    f"Out-of-Pocket Cost Change: +{int(oop_change_pct)}%",
                    f"Benefit Utilization Score: {util_pct}%",
                ],
            })

        # Rule 3: Care/Provider Outreach
        if provider_issues >= 1 or wait_days >= 21:
            priority = "HIGH" if (provider_issues >= 2 or wait_days >= 30) else "MEDIUM"
            recs.append({
                "action": "Care/Provider Outreach",
                "priority": priority,
                "triggeringDriver": f"{int(provider_issues)} access issue(s), {int(wait_days)} days wait time",
                "reason": "Provider availability and appointment delays contribute to member care friction. Concierge navigation support is recommended to locate in-network primary care providers.",
                "supportingIndicators": [
                    f"Provider Access Issues: {int(provider_issues)}",
                    f"Appointment Wait Time: {int(wait_days)} days",
                ],
            })

        # Rule 4: Pharmacy Support
        if pharmacy_issues >= 1:
            priority = "HIGH" if pharmacy_issues >= 2 else "MEDIUM"
            recs.append({
                "action": "Pharmacy Support",
                "priority": priority,
                "triggeringDriver": f"{int(pharmacy_issues)} pharmacy service issue(s)",
                "reason": "Prescription access and fulfillment barriers contribute to member attrition. Pharmacy benefit guidance and mail-order options offer immediate resolution.",
                "supportingIndicators": [
                    f"Pharmacy Support Issues: {int(pharmacy_issues)}",
                ],
            })

        # Rule 5: Plan Education
        if recent_plan_change == "Yes":
            plan_type = member.get("Plan_Type", "")
            plan_tier = member.get("Plan_Tier", "")
            recs.append({
                "action": "Plan Education",
                "priority": "MEDIUM",
                "triggeringDriver": "Recent plan change",
                "reason": "Members with recent plan transitions benefit from structured orientation regarding network details, tier adjustments, and covered services.",
                "supportingIndicators": [
                    "Plan Change in Last 12m: Yes",
                    f"Current Plan: {plan_type} ({plan_tier})",
                ],
            })

        # Rule 6: Member Education/Outreach
        if engagement_trend == "Declining" or len(recs) == 0:
            recs.append({
                "action": "Member Education/Outreach",
                "priority": "HIGH" if risk_level == "HIGH" else "LOW",
                "triggeringDriver": f"Engagement trend: {engagement_trend}",
                "reason": "Personalized engagement outreach supports digital portal onboarding and proactive health management.",
                "supportingIndicators": [
                    f"Engagement Trend: {engagement_trend}",
                    f"Portal Logins (90d): {int(member.get('Portal_Logins_Last_90d') or 0)}",
                ],
            })

        # Dynamic fallback for custom CSV datasets
        if len(recs) < 2 and risk_level in ["HIGH", "MEDIUM"]:
            recs.append({
                "action": "Benefit Education",
                "priority": "MEDIUM",
                "triggeringDriver": "Dynamic dataset profile analysis",
                "reason": "Proactive guidance on plan features and cost management options is recommended to improve member retention.",
                "supportingIndicators": ["Dynamic dataset profile evaluation"],
            })

        priority_weight = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
        recs.sort(key=lambda r: priority_weight.get(r["priority"], 1), reverse=True)

        return recs[:3]

    @staticmethod
    def generate_aggregated_summary(
        members: List[Dict[str, Any]],
        churn_service: Any
    ) -> Dict[str, Any]:
        high_count = 0
        medium_count = 0
        low_count = 0
        churn_sum = 0.0

        driver_counts: Dict[str, int] = {}
        action_counts: Dict[str, int] = {}

        for member in members:
            pred_res = churn_service.predict_member(member)
            prob = pred_res["probability"]
            risk_level = pred_res["riskLevel"]

            churn_sum += prob

            if risk_level == "HIGH":
                high_count += 1
            elif risk_level == "MEDIUM":
                medium_count += 1
            else:
                low_count += 1

            if safe_float(member.get("Unresolved_Service_Cases")) >= 1:
                driver_counts["Unresolved Service Cases"] = driver_counts.get("Unresolved Service Cases", 0) + 1
                action_counts["Service Recovery"] = action_counts.get("Service Recovery", 0) + 1

            util_s = safe_float(member.get("Benefit_Utilization_Score"), default=-1.0)
            if safe_float(member.get("Out_Of_Pocket_Change_Pct")) > 15 or (0 <= util_s < 0.35):
                driver_counts["Cost & Low Benefit Utilization"] = driver_counts.get("Cost & Low Benefit Utilization", 0) + 1
                action_counts["Benefit Education"] = action_counts.get("Benefit Education", 0) + 1

            if safe_float(member.get("Provider_Access_Issues")) >= 1 or safe_float(member.get("Appointment_Wait_Days")) >= 21:
                driver_counts["Provider Access & Wait Days"] = driver_counts.get("Provider Access & Wait Days", 0) + 1
                action_counts["Care/Provider Outreach"] = action_counts.get("Care/Provider Outreach", 0) + 1

            if safe_float(member.get("Pharmacy_Support_Issues")) >= 1:
                driver_counts["Pharmacy Support Issues"] = driver_counts.get("Pharmacy Support Issues", 0) + 1
                action_counts["Pharmacy Support"] = action_counts.get("Pharmacy Support", 0) + 1

            if str(member.get("Plan_Change_Recent") or "") == "Yes":
                driver_counts["Recent Plan Change"] = driver_counts.get("Recent Plan Change", 0) + 1
                action_counts["Plan Education"] = action_counts.get("Plan Education", 0) + 1

            if str(member.get("Engagement_Score_Trend") or "") == "Declining":
                driver_counts["Declining Engagement"] = driver_counts.get("Declining Engagement", 0) + 1
                action_counts["Member Education/Outreach"] = action_counts.get("Member Education/Outreach", 0) + 1

        total = len(members) if len(members) > 0 else 1
        predicted_churn_rate = round(churn_sum / total, 4)

        most_common_drivers = [
            {
                "driver": driver,
                "count": count,
                "percentage": round((count / total) * 100, 1),
            }
            for driver, count in driver_counts.items()
        ]
        most_common_drivers.sort(key=lambda d: d["count"], reverse=True)

        most_recommended_actions = [
            {
                "action": action,
                "count": count,
                "percentage": round((count / total) * 100, 1),
            }
            for action, count in action_counts.items()
        ]
        most_recommended_actions.sort(key=lambda a: a["count"], reverse=True)

        return {
            "totalHighRiskMembers": high_count,
            "totalMediumRiskMembers": medium_count,
            "totalLowRiskMembers": low_count,
            "predictedChurnRate": predicted_churn_rate,
            "mostCommonDrivers": most_common_drivers,
            "mostRecommendedActions": most_recommended_actions,
            "highPriorityOpportunitiesCount": int(round(high_count * 0.85)),
        }

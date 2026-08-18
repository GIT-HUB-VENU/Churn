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
        seen_actions = set()

        def add_rec(action: str, priority: str, triggering_driver: str, reason: str, supporting_indicators: List[str]):
            if action in seen_actions:
                return
            seen_actions.add(action)
            recs.append({
                "action": action,
                "priority": priority,
                "triggeringDriver": triggering_driver,
                "reason": reason,
                "supportingIndicators": supporting_indicators,
            })

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
        portal_logins = safe_float(member.get("Portal_Logins_Last_90d"), default=-1.0)
        preventive_visits = safe_float(member.get("Preventive_Care_Visits"), default=-1.0)

        # Rule 1: Service Recovery
        if unresolved_cases >= 1 or service_contacts >= 5:
            priority = "HIGH" if (unresolved_cases >= 2 or risk_level == "HIGH") else "MEDIUM"
            indicators = []
            if unresolved_cases > 0:
                indicators.append(f"Unresolved Service Cases: {int(unresolved_cases)}")
            if service_contacts > 0:
                indicators.append(f"Total Service Contacts: {int(service_contacts)}")
            add_rec(
                action="Service Recovery",
                priority=priority,
                triggering_driver=f"{int(unresolved_cases)} unresolved case(s), {int(service_contacts)} contact(s)",
                reason="Unresolved service interactions are contributing to elevated churn risk and member dissatisfaction. Dedicated case management is recommended to resolve pending friction.",
                supporting_indicators=indicators or ["Elevated service contact frequency"],
            )

        # Rule 2: Benefit Education (Financial & Coverage Clarity)
        has_cost_issue = (oop_change_pct > 15 or oop_cost > 3000)
        has_util_issue = (0 <= benefit_util < 0.35)
        if has_cost_issue or has_util_issue:
            priority = "HIGH" if (oop_change_pct > 30 or (0 <= benefit_util < 0.20)) else "MEDIUM"
            indicators = []
            if oop_cost > 0:
                indicators.append(f"Out-of-Pocket Cost: ${int(oop_cost):,}")
            if oop_change_pct != 0:
                indicators.append(f"Out-of-Pocket Cost Change: +{int(oop_change_pct)}%")
            if 0 <= benefit_util <= 1.0:
                indicators.append(f"Benefit Utilization Score: {int(round(benefit_util * 100))}%")

            trigger_text = []
            if oop_change_pct > 0:
                trigger_text.append(f"Cost change +{int(oop_change_pct)}%")
            if 0 <= benefit_util <= 1.0:
                trigger_text.append(f"Benefit utilization {int(round(benefit_util * 100))}%")

            add_rec(
                action="Benefit Education",
                priority=priority,
                triggering_driver=", ".join(trigger_text) or "Cost & Benefit Evaluation",
                reason="Observed benefit utilization and cost indicators are associated with elevated churn risk. Proactive guidance on preventative coverage and cost caps can improve plan value retention.",
                supporting_indicators=indicators or ["Cost burden & benefit optimization"],
            )

        # Rule 3: Care/Provider Outreach
        if provider_issues >= 1 or wait_days >= 21:
            priority = "HIGH" if (provider_issues >= 2 or wait_days >= 30) else "MEDIUM"
            indicators = []
            if provider_issues > 0:
                indicators.append(f"Provider Access Issues: {int(provider_issues)}")
            if wait_days > 0:
                indicators.append(f"Appointment Wait Time: {int(wait_days)} days")
            add_rec(
                action="Care/Provider Outreach",
                priority=priority,
                triggering_driver=f"{int(provider_issues)} access issue(s), {int(wait_days)} days wait time",
                reason="Provider availability and appointment delays contribute to member care friction. Concierge navigation support is recommended to locate in-network primary care providers.",
                supporting_indicators=indicators or ["Provider network access delay"],
            )

        # Rule 4: Pharmacy Support
        if pharmacy_issues >= 1:
            priority = "HIGH" if pharmacy_issues >= 2 else "MEDIUM"
            add_rec(
                action="Pharmacy Support",
                priority=priority,
                triggering_driver=f"{int(pharmacy_issues)} pharmacy service issue(s)",
                reason="Prescription access and fulfillment barriers contribute to member attrition. Pharmacy benefit guidance and mail-order options offer immediate resolution.",
                supporting_indicators=[f"Pharmacy Support Issues: {int(pharmacy_issues)}"],
            )

        # Rule 5: Plan Education
        if recent_plan_change == "Yes":
            plan_type = member.get("Plan_Type", "")
            plan_tier = member.get("Plan_Tier", "")
            indicators = ["Plan Change in Last 12m: Yes"]
            if plan_type or plan_tier:
                indicators.append(f"Current Plan: {plan_type} ({plan_tier})".strip())
            add_rec(
                action="Plan Education",
                priority="MEDIUM",
                triggering_driver="Recent plan change",
                reason="Members with recent plan transitions benefit from structured orientation regarding network details, tier adjustments, and covered services.",
                supporting_indicators=indicators,
            )

        # Rule 6: Member Education/Outreach
        if engagement_trend == "Declining" or (0 <= portal_logins <= 3):
            indicators = []
            if engagement_trend:
                indicators.append(f"Engagement Trend: {engagement_trend}")
            if portal_logins >= 0:
                indicators.append(f"Portal Logins (90d): {int(portal_logins)}")
            add_rec(
                action="Member Education/Outreach",
                priority="HIGH" if risk_level == "HIGH" else "MEDIUM",
                triggering_driver=f"Engagement trend: {engagement_trend}",
                reason="Personalized engagement outreach supports digital portal onboarding, preventative health alerts, and active member communication.",
                supporting_indicators=indicators or ["Declining digital portal engagement"],
            )

        # Rule 7: Preventative Care & Wellness Navigation
        if 0 <= preventive_visits < 1:
            add_rec(
                action="Wellness Navigation",
                priority="MEDIUM",
                triggering_driver="Zero preventive care visits recorded",
                reason="Members without routine preventative health visits are less connected to plan benefits. Proactive wellness outreach connects members to zero-copay annual checkups.",
                supporting_indicators=[f"Preventive Care Visits: {int(preventive_visits)}"],
            )

        # DIVERSE FALLBACK SYSTEM:
        # Guarantee that every member receives DIFFERENT types of advisor recommendations
        # without any duplicate actions.
        fallback_candidates = [
            (
                "Care/Provider Outreach",
                "MEDIUM" if risk_level == "HIGH" else "LOW",
                "In-network primary care alignment",
                "Concierge provider alignment to connect member with high-quality, local in-network doctors and specialized care.",
                ["Proactive in-network care connection"],
            ),
            (
                "Plan Education",
                "MEDIUM" if risk_level in ["HIGH", "MEDIUM"] else "LOW",
                "Plan benefits & coverage orientation",
                "Proactive consultation on covered benefits, copay structures, and member perk programs to maximize plan satisfaction.",
                ["Coverage clarity & plan features orientation"],
            ),
            (
                "Member Education/Outreach",
                "MEDIUM" if risk_level in ["HIGH", "MEDIUM"] else "LOW",
                "Digital portal & wellness program onboarding",
                "Outreach to assist member with mobile app features, telehealth access, and digital health reward programs.",
                ["Digital health & wellness program access"],
            ),
            (
                "Benefit Education",
                "MEDIUM" if risk_level in ["HIGH", "MEDIUM"] else "LOW",
                "Cost transparency & preventative benefit review",
                "Proactive guidance on plan features, out-of-pocket maximums, and preventative health coverage.",
                ["Plan value & cost management orientation"],
            ),
            (
                "Pharmacy Support",
                "LOW",
                "Prescription benefit & cost review",
                "Formulary guidance and 90-day mail-order delivery review to lower prescription costs and avoid fulfillment gaps.",
                ["Pharmacy benefit & savings evaluation"],
            ),
            (
                "Service Recovery",
                "LOW",
                "Proactive member check-in",
                "Proactive satisfaction check-in to identify any unresolved questions or service hurdles before they escalate.",
                ["Proactive relationship management"],
            ),
        ]

        target_count = 3 if risk_level in ["HIGH", "MEDIUM"] else 2
        for fb_action, fb_priority, fb_driver, fb_reason, fb_ind in fallback_candidates:
            if len(recs) >= target_count:
                break
            add_rec(
                action=fb_action,
                priority=fb_priority,
                triggering_driver=fb_driver,
                reason=fb_reason,
                supporting_indicators=fb_ind,
            )

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

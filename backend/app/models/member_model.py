from dataclasses import dataclass, field
from typing import Dict, Any, List

@dataclass
class Member:
    member_id: str
    age: int
    gender: str
    plan_type: str
    plan_tier: str
    tenure_months: int
    monthly_premium: float
    out_of_pocket_cost: float
    out_of_pocket_change_pct: float
    benefit_utilization_score: float
    preventive_care_visits: int
    unresolved_service_cases: int
    service_contact_count: int
    provider_access_issues: int
    appointment_wait_days: int
    pharmacy_support_issues: int
    plan_change_recent: str
    engagement_score_trend: str
    portal_logins_last_90d: int
    churn: str
    raw_data: Dict[str, Any] = field(default_factory=dict)

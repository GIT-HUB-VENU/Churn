import os
from typing import Dict, Any, List
from google import genai

class GeminiService:
    @staticmethod
    async def generate_member_explanation(
        member_id: str,
        plan_type: str,
        churn_probability: float,
        risk_level: str,
        top_drivers: List[Dict[str, Any]],
        approved_actions: List[Dict[str, Any]]
    ) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        
        driver_labels = [d.get("featureLabel", "").lower() for d in top_drivers if d.get("featureLabel")]
        action_names = [a.get("action", "") for a in approved_actions if a.get("action")]
        
        driver_str = ", ".join(driver_labels) if driver_labels else "observed member touchpoints"
        action_str = " and ".join(action_names) if action_names else "outreach and benefit education"

        default_text = (
            f"This member has an elevated predicted churn risk ({int(round(churn_probability * 100))}%, Risk Level: {risk_level}). "
            f"The strongest observed contributors to this prediction are {driver_str}. "
            f"Recommended compliant retention actions based on observed indicators include {action_str}."
        )

        if not api_key:
            return default_text

        try:
            client = genai.Client(api_key=api_key)
            driver_summary = "\n".join([f"- {d.get('featureLabel')}: observed {d.get('observedValue')}" for d in top_drivers])
            action_summary = "\n".join([f"- {a.get('action')} ({a.get('priority')} Priority): {a.get('reason')}" for a in approved_actions])

            prompt = f"""You are a healthcare business analyst assisting retention operations.
Generate a concise, professional 2-3 sentence business explanation for member retention advisors.

Context:
- Member ID: {member_id}
- Plan: {plan_type}
- Churn Probability: {(churn_probability * 100):.1f}%
- Risk Level: {risk_level}

Observed Model Drivers:
{driver_summary}

Approved Retention Actions:
{action_summary}

CRITICAL MANDATES:
Use only the supplied information. Do not infer facts that are not present. Do not diagnose. Do not infer financial hardship. Do not make unsupported claims. Do not introduce recommendations outside the approved action list. Keep language objective, professional, and compliant."""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip() if response and response.text else default_text
        except Exception as err:
            print(f"Gemini API call warning (using fallback): {err}")
            return default_text

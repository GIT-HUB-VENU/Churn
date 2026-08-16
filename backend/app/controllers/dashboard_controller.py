from typing import Dict, Any

class DashboardController:
    def __init__(self, churn_service):
        self.churn_service = churn_service

    def get_dashboard(self) -> Dict[str, Any]:
        return self.churn_service.get_cached_dashboard()

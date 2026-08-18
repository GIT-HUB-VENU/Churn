from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from app.controllers.member_controller import MemberController
from app.controllers.prediction_controller import PredictionController
from app.controllers.recommendation_controller import RecommendationController
from app.controllers.dashboard_controller import DashboardController
from app.controllers.model_controller import ModelController
from app.controllers.upload_controller import UploadController
from app.models.prediction_model import ThresholdUpdateRequest

def create_api_router(churn_service) -> APIRouter:
    router = APIRouter()

    member_controller = MemberController(churn_service)
    prediction_controller = PredictionController(churn_service)
    recommendation_controller = RecommendationController(churn_service)
    dashboard_controller = DashboardController(churn_service)
    model_controller = ModelController(churn_service)
    upload_controller = UploadController(churn_service)

    @router.get("/dashboard")
    def get_dashboard():
        return dashboard_controller.get_dashboard()

    @router.get("/members")
    def get_members(
        search: Optional[str] = Query(None),
        riskLevel: Optional[str] = Query(None),
        planType: Optional[str] = Query(None),
        page: int = Query(1),
        limit: int = Query(20),
        sortBy: str = Query("churnProbability"),
        sortOrder: str = Query("desc")
    ):
        return member_controller.get_members(
            search=search,
            riskLevel=riskLevel,
            planType=planType,
            page=page,
            limit=limit,
            sortBy=sortBy,
            sortOrder=sortOrder
        )

    @router.get("/members/{member_id}")
    async def get_member_by_id(member_id: str):
        return await member_controller.get_member_by_id(member_id)

    @router.post("/predict")
    def predict_member(member: Dict[str, Any] = Body(...)):
        return prediction_controller.predict_member(member)

    @router.get("/model/metrics")
    def get_model_metrics():
        return model_controller.get_model_metrics()

    @router.get("/model/drivers")
    def get_model_drivers():
        return model_controller.get_model_drivers()

    @router.get("/recommendations/{member_id}")
    def get_member_recommendations(member_id: str):
        return recommendation_controller.get_member_recommendations(member_id)

    @router.get("/retention/summary")
    def get_retention_summary():
        return recommendation_controller.get_retention_summary()

    @router.post("/config/thresholds")
    def update_thresholds(body: ThresholdUpdateRequest):
        low_max = body.lowMax
        medium_max = body.mediumMax
        if low_max >= medium_max:
            raise HTTPException(status_code=400, detail="Invalid thresholds. Ensure lowMax < mediumMax.")

        churn_service.set_thresholds({"lowMax": low_max, "mediumMax": medium_max})
        return {
            "message": "Thresholds updated successfully",
            "thresholds": churn_service.get_thresholds()
        }

    @router.post("/upload-csv")
    def upload_csv(body: Dict[str, Any] = Body(...)):
        csv_content = body.get("csvContent")
        file_name = body.get("fileName")
        return upload_controller.upload_csv(csv_content, file_name)

    @router.post("/reset-dataset")
    def reset_dataset():
        return upload_controller.reset_dataset()

    return router

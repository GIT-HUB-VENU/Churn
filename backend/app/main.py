import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.services.data_service import DataService
from app.services.churn_service import ChurnService
from app.routes.health_routes import router as health_router
from app.routes.api_routes import create_api_router

churn_service = ChurnService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading CareRetain AI dataset and training Python XGBoost ML Model...")
    try:
        members, schema = DataService.load_dataset()
        print(f"Successfully loaded dataset with {schema['totalRows']} member records.")
        print(f"Target Column: {schema['targetColumn']} | Member ID Column: {schema['idColumn']}")

        train_result = churn_service.train_model(members, schema)
        metrics = train_result["metrics"]
        print(
            f"ML Model Trained Successfully! Accuracy: {metrics['accuracy'] * 100:.2f}% | "
            f"ROC-AUC: {metrics['rocAuc']}"
        )
    except Exception as err:
        print(f"Error initializing ML model on startup: {err}")
    yield

app = FastAPI(
    title="CareRetain AI Backend",
    version="1.0.0",
    description="Python 3.11 / FastAPI Backend for CareRetain AI Churn Prediction & Retention Analytics",
    lifespan=lifespan
)

# Enable CORS for frontend communication
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes under /api
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(create_api_router(churn_service), prefix="/api", tags=["CareRetain AI"])

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

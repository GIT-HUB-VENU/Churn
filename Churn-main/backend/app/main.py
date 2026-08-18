import os
import uvicorn
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from app.config.settings import settings
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

# Serve built frontend in production if dist/ exists
dist_dir = settings.PROJECT_ROOT / "dist"
if dist_dir.exists():
    assets_dir = dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_dir / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        index_file = dist_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"error": "Frontend build not found"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)

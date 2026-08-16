import os
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.config.settings import settings
from app.services.data_service import DataService

class UploadController:
    def __init__(self, churn_service):
        self.churn_service = churn_service

    def upload_csv(self, csv_content: str, file_name: Optional[str] = None) -> Dict[str, Any]:
        if not csv_content or not isinstance(csv_content, str):
            raise HTTPException(status_code=400, detail="Valid CSV content is required.")

        target_file_name = os.path.basename(file_name) if file_name else "Uploaded_dataset.csv"
        upload_path = settings.DATA_DIR / target_file_name
        
        settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(upload_path, "w", encoding="utf-8") as f:
            f.write(csv_content)

        # Reload dataset & retrain model
        DataService.set_dataset_file_path(str(upload_path))
        members, schema = DataService.reload_dataset()
        retrain_result = self.churn_service.train_model(members, schema)

        return {
            "message": f"Dataset '{target_file_name}' loaded successfully",
            "datasetName": target_file_name,
            "totalRows": schema["totalRows"],
            "columns": schema["columns"],
            "targetColumn": schema["targetColumn"],
            "idColumn": schema["idColumn"],
            "metrics": retrain_result["metrics"],
        }

    def reset_dataset(self) -> Dict[str, Any]:
        default_path = settings.DEFAULT_DATASET_PATH
        upload_path = settings.UPLOADED_DATASET_PATH

        if not os.path.exists(default_path):
            if os.path.exists(settings.FALLBACK_DATASET_PATH):
                default_path = settings.FALLBACK_DATASET_PATH
            else:
                raise HTTPException(
                    status_code=404,
                    detail="Default dataset file (Default_dataset.csv) not found."
                )

        with open(default_path, "r", encoding="utf-8", errors="ignore") as f:
            default_content = f.read()

        settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(upload_path, "w", encoding="utf-8") as f:
            f.write(default_content)

        DataService.set_dataset_file_path(str(default_path))
        members, schema = DataService.reload_dataset()
        retrain_result = self.churn_service.train_model(members, schema)

        return {
            "message": "Dataset reset to 'Default_dataset.csv' successfully and model retrained.",
            "datasetName": "Default_dataset.csv",
            "totalRows": schema["totalRows"],
            "columns": schema["columns"],
            "targetColumn": schema["targetColumn"],
            "idColumn": schema["idColumn"],
            "metrics": retrain_result["metrics"],
        }

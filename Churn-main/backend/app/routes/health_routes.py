from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.services.data_service import DataService

router = APIRouter()

@router.get("/health")
def get_health():
    try:
        members, schema = DataService.load_dataset()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "datasetRows": schema["totalRows"],
            "targetColumn": schema["targetColumn"],
            "idColumn": schema["idColumn"],
            "datasetName": schema.get("fileName") or "Uploaded_dataset.csv",
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

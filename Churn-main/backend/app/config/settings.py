import os
from pathlib import Path

class Settings:
    PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATA_DIR: Path = PROJECT_ROOT / "data"
    BACKEND_DATA_DIR: Path = PROJECT_ROOT / "backend" / "data"
    ARTIFACTS_DIR: Path = PROJECT_ROOT / "backend" / "artifacts"
    
    DEFAULT_DATASET_PATH: Path = DATA_DIR / "Default_dataset.csv"
    UPLOADED_DATASET_PATH: Path = DATA_DIR / "Uploaded_dataset.csv"
    FALLBACK_DATASET_PATH: Path = BACKEND_DATA_DIR / "Uploaded_dataset.csv"
    
    DATASET_PATH: str = os.getenv("DATASET_PATH", str(DEFAULT_DATASET_PATH))
    
    # Configurable Risk Thresholds
    LOW_MAX: float = float(os.getenv("LOW_RISK_THRESHOLD", 0.30))
    MEDIUM_MAX: float = float(os.getenv("HIGH_RISK_THRESHOLD", 0.69))

    # ML Hyperparameters
    N_ESTIMATORS: int = 40
    LEARNING_RATE: float = 0.1
    MAX_DEPTH: int = 4
    MIN_SAMPLES_SPLIT: int = 3
    L2_REG: float = 1.0
    TRAIN_RATIO: float = 0.8

    # CatBoost & Threshold Tuning Hyperparameters
    CATBOOST_ITERATIONS: int = int(os.getenv("CATBOOST_ITERATIONS", 200))
    CATBOOST_DEPTH: int = int(os.getenv("CATBOOST_DEPTH", 6))
    CATBOOST_LEARNING_RATE: float = float(os.getenv("CATBOOST_LEARNING_RATE", 0.05))
    CATBOOST_L2_REG: float = float(os.getenv("CATBOOST_L2_REG", 3.0))
    
    DEFAULT_CLASSIFICATION_THRESHOLD: float = float(os.getenv("DEFAULT_CLASSIFICATION_THRESHOLD", 0.50))
    VALIDATION_RATIO: float = float(os.getenv("VALIDATION_RATIO", 0.15))
    THRESHOLD_SEARCH_MIN: float = float(os.getenv("THRESHOLD_SEARCH_MIN", 0.20))
    THRESHOLD_SEARCH_MAX: float = float(os.getenv("THRESHOLD_SEARCH_MAX", 0.80))
    THRESHOLD_SEARCH_STEP: float = float(os.getenv("THRESHOLD_SEARCH_STEP", 0.02))
    MIN_THRESHOLD_PRECISION: float = float(os.getenv("MIN_THRESHOLD_PRECISION", 0.40))

    APPROVED_ACTIONS = [
        {
            "id": "benefit_education",
            "title": "Benefit Education",
            "category": "Financial & Coverage Clarity",
            "description": "Proactive guidance on plan benefits, out-of-pocket cost caps, and preventative care coverage."
        },
        {
            "id": "service_recovery",
            "title": "Service Recovery",
            "category": "Service Resolution",
            "description": "Dedicated case manager assignment to resolve outstanding service tickets and communication friction."
        },
        {
            "id": "care_provider_outreach",
            "title": "Care/Provider Outreach",
            "category": "Provider & Network Access",
            "description": "Concierge navigation support to find in-network primary care providers with shorter appointment wait times."
        },
        {
            "id": "pharmacy_support",
            "title": "Pharmacy Support",
            "category": "Medication Access",
            "description": "Pharmacy benefit consultation for mail-order delivery, formulary alternatives, and copay assistance."
        },
        {
            "id": "plan_education",
            "title": "Plan Education",
            "category": "Plan Fit & Onboarding",
            "description": "Detailed orientation on plan structure, recent tier changes, and summary of benefits and coverage."
        },
        {
            "id": "member_education_outreach",
            "title": "Member Education/Outreach",
            "category": "Engagement & Wellness",
            "description": "Personalized wellness portal walkthrough and digital engagement outreach."
        }
    ]

settings = Settings()

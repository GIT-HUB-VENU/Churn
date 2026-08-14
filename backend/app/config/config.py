import os

class Config:
    DATASET_PATH = os.getenv("DATASET_PATH", os.path.join(os.getcwd(), "data", "uploaded_dataset.csv"))
    FALLBACK_DATASET_PATH = os.path.join(os.getcwd(), "backend", "data", "uploaded_dataset.csv")
    
    # Configurable Risk Thresholds
    RISK_THRESHOLD_LOW = 0.30
    RISK_THRESHOLD_MEDIUM = 0.69
    
    # Model Hyperparameters
    N_ESTIMATORS = 50
    MAX_DEPTH = 8
    TRAIN_RATIO = 0.8

    APPROVED_ACTIONS = [
        "Benefit Education",
        "Care/Provider Outreach",
        "Pharmacy Support",
        "Service Recovery",
        "Plan Education",
        "Member Education/Outreach"
    ]

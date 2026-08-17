# CareRetain AI — Member Churn Prediction & Retention Advisor

CareRetain AI is an enterprise AI solution designed for health plans to identify members at risk of disenrolling, explain churn drivers in plain language, and recommend compliant, rule-based retention actions. Built with a Python 3.11 FastAPI backend running an XGBoost ML pipeline and a React + Vite frontend.

---

## 🌟 Core Features

1. **Dataset Integration & Schema Autodetect**:
   - Parses uploaded synthetic/real health plan CSV datasets (`data/Uploaded_dataset.csv` / `data/Default_dataset.csv`).
   - Auto-detects target churn column (`Churn`) and identifier (`Member_ID`).
   - Automatically handles missing values (median/mode imputation) and categorical feature encoding.
   - Prevents data leakage by excluding identifier columns from prediction.

2. **Python XGBoost Machine Learning Pipeline**:
   - Supervised XGBoost Classifier (`xgboost.XGBClassifier`) for predicting churn probability and risk tier (`LOW`, `MEDIUM`, `HIGH`).
   - Configurable risk thresholds (e.g. LOW `< 0.30`, MEDIUM `0.30–0.69`, HIGH `>= 0.70`).
   - Comprehensive model validation: Accuracy (89.58%), Precision, Recall, F1 Score, ROC-AUC (0.9474), and Confusion Matrix.

3. **Explainability Engine (Driver Attribution)**:
   - Identifies top local drivers contributing to an individual member's risk score.
   - Compliant plain-language explanations using approved phrasing ("associated with elevated churn risk").

4. **Deterministic Retention Recommendation Engine**:
   - Purely rule-based recommendation engine mapped to approved action catalog:
     - **Benefit Education**: Cost increases, low benefit utilization.
     - **Service Recovery**: Unresolved service tickets, high contact frequency.
     - **Care/Provider Outreach**: In-network provider access delays, long appointment wait times.
     - **Pharmacy Support**: Prescription fulfillment and pharmacy service issues.
     - **Plan Education**: Recent plan structure or tier changes.
     - **Member Education/Outreach**: Declining portal engagement.

5. **Server-Side Gemini AI Business Briefings**:
   - Server-side integration with `google-genai` SDK to generate concise executive summaries from structured model output.
   - Robust offline fallback when API keys are unavailable.

6. **Responsible AI & Compliance Panel**:
   - Non-diagnostic guarantee, non-medical boundaries, and human-in-the-loop review guidelines.

---

## 📁 Architecture (MVC Pattern)

```
project-root/
│
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   └── settings.py
│   │   ├── models/
│   │   │   ├── member_model.py
│   │   │   ├── prediction_model.py
│   │   │   └── recommendation_model.py
│   │   ├── services/
│   │   │   ├── data_service.py
│   │   │   ├── preprocessing_service.py
│   │   │   ├── churn_service.py
│   │   │   ├── explainability_service.py
│   │   │   ├── retention_service.py
│   │   │   └── gemini_service.py
│   │   ├── controllers/
│   │   │   ├── member_controller.py
│   │   │   ├── prediction_controller.py
│   │   │   ├── recommendation_controller.py
│   │   │   ├── dashboard_controller.py
│   │   │   ├── model_controller.py
│   │   │   └── upload_controller.py
│   │   ├── routes/
│   │   │   ├── api_routes.py
│   │   │   └── health_routes.py
│   │   └── main.py
│   └── requirements.txt
│
├── src/ (React + Vite Frontend)
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── KpiCard.jsx
│   │   ├── MemberDetailModal.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── MemberIntelligencePage.jsx
│   │   ├── ModelInsightsPage.jsx
│   │   ├── ResponsibleAiPage.jsx
│   │   ├── RetentionAdvisorPage.jsx
│   │   └── SettingsPage.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
│
├── data/
│   ├── Default_dataset.csv
│   └── Uploaded_dataset.csv
├── tests/
│   └── run_tests.py
├── package.json
└── README.md
```

---

## 🚀 Quickstart & Local Execution

### 1. Install Node.js & Python Dependencies
```bash
# Install frontend dependencies
npm install

# Set up Python virtual environment and install backend dependencies
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
cd ..
```

### 2. Run Automated Integration Tests & Benchmarks
```bash
npm test
# or: backend\.venv\Scripts\python tests/run_tests.py
```

### 3. Start Full-Stack Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 REST API Endpoints

- `GET /api/health`: Health status & dataset schema
- `GET /api/dashboard`: Executive KPI metrics, distributions & risk segments
- `GET /api/members`: Searchable, filterable, and paginated member list
- `GET /api/members/:member_id`: Detailed risk diagnostic & retention recommendations
- `POST /api/predict`: Ad-hoc churn prediction for single member record
- `GET /api/model/metrics`: XGBoost performance metrics & confusion matrix
- `GET /api/model/drivers`: Global feature importance ranking
- `GET /api/retention/summary`: Aggregated retention opportunities & action distributions
- `POST /api/upload-csv`: Upload custom CSV dataset dynamically
- `POST /api/reset-dataset`: Reset to default dataset
- `POST /api/config/thresholds`: Update configurable risk boundaries

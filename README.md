# CareRetain AI — Member Churn Prediction & Retention Advisor

CareRetain AI is a hackathon prototype designed for health plans to identify members at risk of disenrolling, explain churn drivers in plain language, and recommend compliant, rule-based retention actions.

---

## 🌟 Core Features

1. **Dataset Integration & Schema Autodetect**:
   - Parses the uploaded synthetic/real health plan CSV dataset (`data/Uploaded_dataset.csv`).
   - Auto-detects target churn column (`Churn`) and identifier (`Member_ID`).
   - Automatically handles missing values (median/mode imputation) and feature encoding.
   - Prevents data leakage by excluding identifier columns from prediction.

2. **Random Forest Machine Learning Pipeline**:
   - Supervised Decision Tree Ensemble model for predicting churn probability and risk tier (`LOW`, `MEDIUM`, `HIGH`).
   - Configurable risk thresholds (e.g. LOW `< 0.30`, MEDIUM `0.30–0.69`, HIGH `>= 0.70`).
   - Comprehensive model validation: Accuracy, Precision, Recall, F1 Score, ROC-AUC, and Confusion Matrix.

3. **Explainability Engine (SHAP-like Driver Attribution)**:
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

5. **Optional AI Business Explanation**:
   - Server-side integration with `@google/genai` (Gemini API) to generate concise executive summaries from structured model output.
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
│   │   │   ├── config.ts / config.py
│   │   ├── models/
│   │   │   ├── member_model.ts / member_model.py
│   │   │   ├── prediction_model.ts / prediction_model.py
│   │   │   └── recommendation_model.ts / recommendation_model.py
│   │   ├── services/
│   │   │   ├── data_service.ts
│   │   │   ├── preprocessing_service.ts
│   │   │   ├── churn_service.ts
│   │   │   ├── explainability_service.ts
│   │   │   ├── retention_service.ts
│   │   │   └── gemini_service.ts
│   │   ├── controllers/
│   │   │   ├── member_controller.ts
│   │   │   ├── prediction_controller.ts
│   │   │   └── recommendation_controller.ts
│   │   └── routes/
│   │       └── api_routes.ts
│   ├── data/
│   │   └── Uploaded_dataset.csv
│   └── requirements.txt
│
├── src/ (Frontend Views & React Components)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── KpiCard.tsx
│   │   └── MemberDetailModal.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── MemberIntelligencePage.tsx
│   │   ├── ModelInsightsPage.tsx
│   │   ├── RetentionAdvisorPage.tsx
│   │   ├── ResponsibleAiPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
│
├── data/
│   └── Uploaded_dataset.csv
├── tests/
│   └── run_tests.ts
├── server.ts
├── package.json
└── README.md
```

---

## 🚀 Quickstart & Local Execution

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Generate or Verify Dataset
```bash
node scripts/generate_data.js
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Full-Stack Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 REST API Endpoints

- `GET /api/health`: Health status & dataset schema
- `GET /api/dashboard`: Executive KPI metrics, distributions & risk segments
- `GET /api/members`: Searchable, filterable, and paginated member list
- `GET /api/members/:member_id`: Detailed risk diagnostic & retention recommendations
- `POST /api/predict`: Ad-hoc churn prediction for single member record
- `GET /api/model/metrics`: Model performance metrics & confusion matrix
- `GET /api/model/drivers`: Global feature importance ranking
- `GET /api/retention/summary`: Aggregated retention opportunities & action distributions
- `POST /api/upload-csv`: Upload custom CSV dataset dynamically
- `POST /api/config/thresholds`: Update configurable risk boundaries

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

def run_tests():
    print("=== CareRetain AI Python Integration & Unit Tests ===\n")

    passed = 0
    failed = 0

    def assert_true(condition: bool, test_name: str):
        nonlocal passed, failed
        if condition:
            print(f"[PASS] {test_name}")
            passed += 1
        else:
            print(f"[FAIL] {test_name}")
            failed += 1

    try:
        from app.services.data_service import DataService
        from app.services.churn_service import ChurnService
        from app.services.explainability_service import ExplainabilityService
        from app.services.retention_service import RetentionService
        from fastapi.testclient import TestClient
        from app.main import app, churn_service

        # Test 1: Dataset Loading & Schema Detection
        print("Testing Dataset Service...")
        members, schema = DataService.load_dataset()
        assert_true(len(members) > 0, "Dataset loaded non-empty member list")
        assert_true(schema["targetColumn"] == "Churn", f"Target column detected as '{schema['targetColumn']}'")
        assert_true(schema["idColumn"] == "Member_ID", f"Member ID column detected as '{schema['idColumn']}'")
        assert_true(len(schema["numericalFeatures"]) > 0, "Numerical features identified")
        assert_true(len(schema["categoricalFeatures"]) > 0, "Categorical features identified")

        # Test 2: Python XGBoost Model Training
        print("\nTesting Python XGBoost Churn ML Pipeline...")
        cs = ChurnService()
        train_result = cs.train_model(members, schema)
        metrics = train_result["metrics"]
        feature_importance = train_result["featureImportance"]

        assert_true(metrics["accuracy"] > 0.6, f"Model Accuracy is acceptable ({metrics['accuracy'] * 100:.1f}%)")
        assert_true(metrics["rocAuc"] > 0.6, f"Model ROC-AUC is acceptable ({metrics['rocAuc']})")
        assert_true(len(feature_importance) > 0, "Global feature importance calculated")

        # Test 3: Member Risk Classification & Explanations
        print("\nTesting Member Risk & Driver Explanations...")
        test_member = members[0]
        prediction = cs.predict_member(test_member)
        assert_true(prediction["riskLevel"] in ["LOW", "MEDIUM", "HIGH"], f"Risk level classified as {prediction['riskLevel']}")
        assert_true(0.0 <= prediction["probability"] <= 1.0, "Probability is within [0, 1]")

        processed = cs.get_processed_dataset()
        if processed:
            drivers = ExplainabilityService.get_member_drivers(test_member, schema, processed, cs, top_n=5)
            assert_true(len(drivers) > 0, "Local drivers generated for member")
            assert_true(len(drivers[0]["explanation"]) > 0, "Driver has compliant plain-language explanation")

        # Test 4: Retention Recommendation Engine
        print("\nTesting Retention Recommendation Rules...")
        high_risk_member = {
            "Member_ID": "MMB-TEST-HIGH",
            "Unresolved_Service_Cases": 3,
            "Service_Contact_Count": 8,
            "Out_Of_Pocket_Cost": 5000,
            "Out_Of_Pocket_Change_Pct": 40,
            "Benefit_Utilization_Score": 0.15,
            "Provider_Access_Issues": 2,
            "Appointment_Wait_Days": 30,
            "Pharmacy_Support_Issues": 2,
            "Plan_Change_Recent": "Yes",
            "Engagement_Score_Trend": "Declining",
            "Portal_Logins_Last_90d": 1,
            "Churn": "Yes",
        }

        recs = RetentionService.generate_recommendations(high_risk_member, "HIGH", 0.88, [])
        assert_true(len(recs) > 0, "Retention recommendations generated for high risk member")
        assert_true(any(r["action"] == "Service Recovery" for r in recs), "Service Recovery rule triggered for unresolved cases")
        assert_true(any(r["action"] == "Benefit Education" for r in recs), "Benefit Education rule triggered for cost & low utilization")

        # Test 5: FastAPI HTTP Endpoints via TestClient & Benchmarks
        print("\nTesting FastAPI HTTP Endpoint Interfaces & Benchmarking Response Times...")
        import time
        with TestClient(app) as client:
            # Health
            t0 = time.perf_counter()
            res_health = client.get("/api/health")
            ms_health = (time.perf_counter() - t0) * 1000
            assert_true(res_health.status_code == 200, f"GET /api/health returned 200 OK ({ms_health:.2f} ms)")
            assert_true(res_health.json()["status"] == "healthy", "Health endpoint status is 'healthy'")

            # Dashboard
            t0 = time.perf_counter()
            res_dash = client.get("/api/dashboard")
            ms_dash = (time.perf_counter() - t0) * 1000
            assert_true(res_dash.status_code == 200, f"GET /api/dashboard returned 200 OK ({ms_dash:.2f} ms)")
            assert_true("kpis" in res_dash.json(), "Dashboard response includes KPIs")

            # Members list
            t0 = time.perf_counter()
            res_mem = client.get("/api/members?page=1&limit=15")
            ms_mem = (time.perf_counter() - t0) * 1000
            assert_true(res_mem.status_code == 200, f"GET /api/members returned 200 OK ({ms_mem:.2f} ms)")
            assert_true(len(res_mem.json()["members"]) == 15, "GET /api/members pagination limit respected")

            # Single member
            sample_id = members[0]["Member_ID"]
            t0 = time.perf_counter()
            res_single = client.get(f"/api/members/{sample_id}")
            ms_single = (time.perf_counter() - t0) * 1000
            assert_true(res_single.status_code == 200, f"GET /api/members/{sample_id} returned 200 OK ({ms_single:.2f} ms)")

            # Predict POST
            t0 = time.perf_counter()
            res_pred = client.post("/api/predict", json=test_member)
            ms_pred = (time.perf_counter() - t0) * 1000
            assert_true(res_pred.status_code == 200, f"POST /api/predict returned 200 OK ({ms_pred:.2f} ms)")

            # Metrics & Drivers
            t0 = time.perf_counter()
            res_metrics = client.get("/api/model/metrics")
            ms_metrics = (time.perf_counter() - t0) * 1000
            assert_true(res_metrics.status_code == 200, f"GET /api/model/metrics returned 200 OK ({ms_metrics:.2f} ms)")

            t0 = time.perf_counter()
            res_drivers = client.get("/api/model/drivers")
            ms_drivers = (time.perf_counter() - t0) * 1000
            assert_true(res_drivers.status_code == 200, f"GET /api/model/drivers returned 200 OK ({ms_drivers:.2f} ms)")

            # Retention summary
            t0 = time.perf_counter()
            res_ret = client.get("/api/retention/summary")
            ms_ret = (time.perf_counter() - t0) * 1000
            assert_true(res_ret.status_code == 200, f"GET /api/retention/summary returned 200 OK ({ms_ret:.2f} ms)")

        print(f"\n=== Test Summary: {passed} Passed, {failed} Failed ===")
        if failed > 0:
            sys.exit(1)

    except Exception as err:
        print(f"Test execution error: {err}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    run_tests()

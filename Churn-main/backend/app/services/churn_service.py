import os
import joblib
import numpy as np
import pandas as pd

from catboost import CatBoostClassifier
from pathlib import Path
from typing import Dict, Any, List, Optional

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split

from app.config.settings import settings
from app.services.preprocessing_service import PreprocessingService
from app.utils.helpers import safe_float


class ChurnService:

    def __init__(self):
        # ---------------------------------------------------------
        # CatBoost model
        # ---------------------------------------------------------
        self.model: Optional[CatBoostClassifier] = None

        self.processed_data: Optional[Dict[str, Any]] = None
        self.schema: Optional[Dict[str, Any]] = None
        self.metrics: Optional[Dict[str, Any]] = None

        self.global_feature_importance: List[Dict[str, Any]] = []

        # ---------------------------------------------------------
        # Risk-level thresholds
        # These are separate from the ML classification threshold.
        # ---------------------------------------------------------
        self.thresholds: Dict[str, float] = {
            "lowMax": settings.LOW_MAX,
            "mediumMax": settings.MEDIUM_MAX,
        }

        # ---------------------------------------------------------
        # CatBoost classification threshold
        # This is automatically tuned using validation data.
        # ---------------------------------------------------------
        self.classification_threshold: float = (
            settings.DEFAULT_CLASSIFICATION_THRESHOLD
        )

        # ---------------------------------------------------------
        # In-memory caches
        # ---------------------------------------------------------
        self.member_predictions_map: Dict[str, Dict[str, Any]] = {}
        self.dashboard_cache: Optional[Dict[str, Any]] = None
        self.retention_summary_cache: Optional[Dict[str, Any]] = None
        self.cached_members: List[Dict[str, Any]] = []

    # =============================================================
    # RISK THRESHOLDS
    # =============================================================

    def set_thresholds(self, new_thresholds: Dict[str, float]) -> None:
        self.thresholds = new_thresholds

        if self.cached_members and self.member_predictions_map:
            self._refresh_caches_for_new_thresholds()

    def get_thresholds(self) -> Dict[str, float]:
        return self.thresholds

    # =============================================================
    # TRAIN MODEL
    # =============================================================

    def train_model(
        self,
        members: List[Dict[str, Any]],
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:

        self.schema = schema
        self.cached_members = members

        # ---------------------------------------------------------
        # Existing preprocessing pipeline
        # ---------------------------------------------------------
        self.processed_data = PreprocessingService.process_dataset(
            members,
            schema,
            train_ratio=settings.TRAIN_RATIO
        )

        feature_names = self.processed_data["featureNames"]
        feature_labels = self.processed_data["featureLabels"]

        X_train = np.array(
            self.processed_data["XTrain"],
            dtype=np.float32
        )

        y_train = np.array(
            self.processed_data["yTrain"],
            dtype=np.int32
        )

        X_test = np.array(
            self.processed_data["XTest"],
            dtype=np.float32
        )

        y_test = np.array(
            self.processed_data["yTest"],
            dtype=np.int32
        )

        # =========================================================
        # STEP 1
        # Create validation split from training data
        # =========================================================

        self.classification_threshold = (
            settings.DEFAULT_CLASSIFICATION_THRESHOLD
        )

        if (
            len(X_train) >= 10
            and len(np.unique(y_train)) == 2
        ):

            X_fit, X_val, y_fit, y_val = train_test_split(
                X_train,
                y_train,
                test_size=settings.VALIDATION_RATIO,
                random_state=42,
                stratify=y_train,
            )

            # -----------------------------------------------------
            # Temporary CatBoost model for threshold tuning
            # -----------------------------------------------------
            tuning_model = self._create_catboost_model()

            tuning_model.fit(
                X_fit,
                y_fit
            )

            # Probability of churn
            val_probs = tuning_model.predict_proba(
                X_val
            )[:, 1]

            # -----------------------------------------------------
            # Tune threshold using F2
            # F2 gives more importance to Recall.
            # -----------------------------------------------------
            self.classification_threshold = (
                self._tune_threshold(
                    y_val,
                    val_probs
                )
            )

        # =========================================================
        # STEP 2
        # Train final CatBoost on complete training data
        # =========================================================

        self.model = self._create_catboost_model()

        self.model.fit(
            X_train,
            y_train
        )

        # =========================================================
        # SAVE MODEL
        # =========================================================

        settings.ARTIFACTS_DIR.mkdir(
            parents=True,
            exist_ok=True
        )

        model_path = (
            settings.ARTIFACTS_DIR /
            "churn_model.joblib"
        )

        joblib.dump(
            self.model,
            model_path
        )

        # =========================================================
        # STEP 3
        # Evaluate on untouched test data
        # =========================================================

        if len(X_test) > 0:

            test_probs = self.model.predict_proba(
                X_test
            )[:, 1]

            test_preds = (
                test_probs >=
                self.classification_threshold
            ).astype(int)

        else:

            test_probs = np.array([])
            test_preds = np.array([])

        # =========================================================
        # METRICS
        # =========================================================

        if len(y_test) > 0:

            acc = float(
                accuracy_score(
                    y_test,
                    test_preds
                )
            )

            prec = float(
                precision_score(
                    y_test,
                    test_preds,
                    zero_division=0
                )
            )

            rec = float(
                recall_score(
                    y_test,
                    test_preds,
                    zero_division=0
                )
            )

            f1 = float(
                f1_score(
                    y_test,
                    test_preds,
                    zero_division=0
                )
            )

            try:

                auc_val = float(
                    roc_auc_score(
                        y_test,
                        test_probs
                    )
                )

            except Exception:

                auc_val = 0.0

            # -----------------------------------------------------
            # Confusion matrix
            # -----------------------------------------------------

            cm = confusion_matrix(
                y_test,
                test_preds,
                labels=[0, 1]
            )

            tn = 0
            fp = 0
            fn = 0
            tp = 0

            if cm.shape == (2, 2):

                tn = int(cm[0, 0])
                fp = int(cm[0, 1])
                fn = int(cm[1, 0])
                tp = int(cm[1, 1])

        else:

            acc = 0.0
            prec = 0.0
            rec = 0.0
            f1 = 0.0
            auc_val = 0.0

            tn = 0
            fp = 0
            fn = 0
            tp = 0

        # =========================================================
        # STORE MODEL METRICS
        # =========================================================

        self.metrics = {

            "modelType":
                "Python CatBoost with Recall-Focused Threshold Tuning",

            "classificationThreshold":
                round(
                    float(
                        self.classification_threshold
                    ),
                    4
                ),

            "thresholdObjective":
                "F2-score with minimum precision constraint",

            "accuracy":
                round(acc, 4),

            "precision":
                round(prec, 4),

            "recall":
                round(rec, 4),

            "f1Score":
                round(f1, 4),

            "rocAuc":
                round(auc_val, 4),

            "confusionMatrix": {

                "truePositive": tp,

                "falsePositive": fp,

                "trueNegative": tn,

                "falseNegative": fn,
            },

            "trainSize":
                len(X_train),

            "testSize":
                len(X_test),
        }

        # =========================================================
        # FEATURE IMPORTANCE
        # =========================================================

        self._calculate_global_importance()

        # =========================================================
        # CACHE ALL PREDICTIONS
        # =========================================================

        self._precompute_all_predictions_and_cache(
            members
        )

        return {

            "metrics":
                self.metrics,

            "featureImportance":
                self.global_feature_importance,
        }

    # =============================================================
    # CREATE CATBOOST MODEL
    # =============================================================

    def _create_catboost_model(
        self
    ) -> CatBoostClassifier:

        return CatBoostClassifier(

            iterations=
                settings.CATBOOST_ITERATIONS,

            depth=
                settings.CATBOOST_DEPTH,

            learning_rate=
                settings.CATBOOST_LEARNING_RATE,

            l2_leaf_reg=
                settings.CATBOOST_L2_REG,

            loss_function=
                "Logloss",

            eval_metric=
                "AUC",

            random_seed=
                42,

            verbose=
                False,

            allow_writing_files=
                False,
        )

    # =============================================================
    # THRESHOLD TUNING
    # =============================================================

    def _tune_threshold(
        self,
        y_true: np.ndarray,
        probabilities: np.ndarray
    ) -> float:

        """
        Tune the CatBoost classification threshold.

        F2-score gives more importance to Recall than Precision.

        A minimum precision constraint prevents the threshold
        from becoming too low and generating too many false positives.
        """

        best_threshold = (
            settings.DEFAULT_CLASSIFICATION_THRESHOLD
        )

        best_f2 = -1.0

        best_recall = -1.0

        # ---------------------------------------------------------
        # Candidate thresholds
        # ---------------------------------------------------------

        candidates = np.arange(

            settings.THRESHOLD_SEARCH_MIN,

            settings.THRESHOLD_SEARCH_MAX
            + settings.THRESHOLD_SEARCH_STEP / 2,

            settings.THRESHOLD_SEARCH_STEP,
        )

        # ---------------------------------------------------------
        # First find thresholds satisfying minimum precision
        # ---------------------------------------------------------

        constrained_candidates = []

        for threshold in candidates:

            preds = (
                probabilities >= threshold
            ).astype(int)

            precision = precision_score(

                y_true,

                preds,

                zero_division=0
            )

            if (
                precision >=
                settings.MIN_THRESHOLD_PRECISION
            ):

                constrained_candidates.append(
                    threshold
                )

        # If no threshold satisfies precision constraint,
        # search all thresholds.
        search_candidates = (
            constrained_candidates
            if constrained_candidates
            else list(candidates)
        )

        # ---------------------------------------------------------
        # Calculate F2 for every candidate
        # ---------------------------------------------------------

        for threshold in search_candidates:

            preds = (
                probabilities >= threshold
            ).astype(int)

            precision = precision_score(

                y_true,

                preds,

                zero_division=0
            )

            recall = recall_score(

                y_true,

                preds,

                zero_division=0
            )

            beta = 2.0

            denominator = (
                (beta ** 2 * precision)
                + recall
            )

            if denominator > 0:

                f2 = (
                    (1 + beta ** 2)
                    * precision
                    * recall
                    / denominator
                )

            else:

                f2 = 0.0

            # -----------------------------------------------------
            # Select best F2
            # If tied, prefer higher recall.
            # -----------------------------------------------------

            if (

                f2 > best_f2

                or (

                    np.isclose(
                        f2,
                        best_f2
                    )

                    and recall >
                    best_recall
                )
            ):

                best_f2 = float(f2)

                best_recall = float(
                    recall
                )

                best_threshold = float(
                    threshold
                )

        return round(
            best_threshold,
            4
        )

    # =============================================================
    # PRECOMPUTE PREDICTIONS
    # =============================================================

    def _precompute_all_predictions_and_cache(
        self,
        members: List[Dict[str, Any]]
    ) -> None:

        if (
            not self.model
            or not self.processed_data
            or not members
        ):
            return

        id_col = (
            self.schema.get(
                "idColumn",
                "Member_ID"
            )
            if self.schema
            else "Member_ID"
        )

        X_all = np.array(
            self.processed_data["X"],
            dtype=np.float32
        )

        # ---------------------------------------------------------
        # Predict probability for every member
        # ---------------------------------------------------------

        if len(X_all) > 0:

            probs = (
                self.model
                .predict_proba(X_all)[:, 1]
            )

        else:

            probs = np.array([])

        pred_map = {}

        for i, m in enumerate(members):

            m_id = str(

                m.get(id_col)

                or m.get(
                    "Member_ID",
                    f"MMB-{10001 + i}"
                )
            )

            prob = (

                round(
                    float(probs[i]),
                    4
                )

                if i < len(probs)

                else 0.0
            )

            risk_level = (
                self.classify_risk_level(
                    prob
                )
            )

            # -----------------------------------------------------
            # IMPORTANT:
            # Use tuned CatBoost threshold.
            # -----------------------------------------------------

            prediction = (

                "Churn"

                if
                prob >=
                self.classification_threshold

                else
                "Retained"
            )

            pred_map[m_id] = {

                "probability":
                    prob,

                "riskLevel":
                    risk_level,

                "prediction":
                    prediction,
            }

        self.member_predictions_map = pred_map

        self._refresh_caches_for_new_thresholds()

    # =============================================================
    # REFRESH DASHBOARD CACHE
    # =============================================================

    def _refresh_caches_for_new_thresholds(
        self
    ) -> None:

        if (
            not self.cached_members
            or not self.schema
        ):
            return

        members = self.cached_members

        schema = self.schema

        id_col = schema.get(
            "idColumn",
            "Member_ID"
        )

        high_risk = 0

        medium_risk = 0

        low_risk = 0

        total_prob_sum = 0.0

        plan_type_churn: Dict[
            str,
            Dict[str, int]
        ] = {}

        risk_segments = {

            "unresolvedCases": 0,

            "highCostIncrease": 0,

            "lowBenefitUtil": 0,

            "providerAccessDelay": 0,

            "decliningEngagement": 0,
        }

        driver_counts: Dict[
            str,
            int
        ] = {}

        action_counts: Dict[
            str,
            int
        ] = {}

        # =========================================================
        # Process each member
        # =========================================================

        for i, m in enumerate(members):

            m_id = str(

                m.get(id_col)

                or m.get(
                    "Member_ID",
                    f"MMB-{10001 + i}"
                )
            )

            pred_item = (
                self.member_predictions_map
                .get(m_id)
            )

            if not pred_item:

                prob = 0.0

                risk_level = "LOW"

                prediction = "Retained"

            else:

                prob = (
                    pred_item["probability"]
                )

                risk_level = (
                    self.classify_risk_level(
                        prob
                    )
                )

                prediction = (
                    pred_item["prediction"]
                )

                pred_item["riskLevel"] = (
                    risk_level
                )

            total_prob_sum += prob

            # -----------------------------------------------------
            # Risk counts
            # -----------------------------------------------------

            if risk_level == "HIGH":

                high_risk += 1

            elif risk_level == "MEDIUM":

                medium_risk += 1

            else:

                low_risk += 1

            # -----------------------------------------------------
            # Plan type churn
            # -----------------------------------------------------

            plan = str(
                m.get("Plan_Type")
                or "Other"
            )

            if plan not in plan_type_churn:

                plan_type_churn[plan] = {

                    "total": 0,

                    "churn": 0,
                }

            plan_type_churn[plan]["total"] += 1

            if (
                prob >=
                self.classification_threshold
            ):

                plan_type_churn[
                    plan
                ]["churn"] += 1

            # =====================================================
            # RISK SEGMENTS
            # =====================================================

            if (
                safe_float(
                    m.get(
                        "Unresolved_Service_Cases"
                    )
                ) >= 1
            ):

                risk_segments[
                    "unresolvedCases"
                ] += 1

                driver_counts[
                    "Unresolved Service Cases"
                ] = (

                    driver_counts.get(
                        "Unresolved Service Cases",
                        0
                    ) + 1
                )

                action_counts[
                    "Service Recovery"
                ] = (

                    action_counts.get(
                        "Service Recovery",
                        0
                    ) + 1
                )

            if (
                safe_float(
                    m.get(
                        "Out_Of_Pocket_Change_Pct"
                    )
                ) > 20
            ):

                risk_segments[
                    "highCostIncrease"
                ] += 1

            util_score = safe_float(

                m.get(
                    "Benefit_Utilization_Score"
                ),

                default=-1.0
            )

            if (
                0 <= util_score < 0.35
            ):

                risk_segments[
                    "lowBenefitUtil"
                ] += 1

            if (

                safe_float(
                    m.get(
                        "Out_Of_Pocket_Change_Pct"
                    )
                ) > 15

                or

                (
                    0 <= util_score < 0.35
                )
            ):

                driver_counts[
                    "Cost & Low Benefit Utilization"
                ] = (

                    driver_counts.get(
                        "Cost & Low Benefit Utilization",
                        0
                    ) + 1
                )

                action_counts[
                    "Benefit Education"
                ] = (

                    action_counts.get(
                        "Benefit Education",
                        0
                    ) + 1
                )

            if (

                safe_float(
                    m.get(
                        "Provider_Access_Issues"
                    )
                ) >= 1

                or

                safe_float(
                    m.get(
                        "Appointment_Wait_Days"
                    )
                ) >= 21
            ):

                risk_segments[
                    "providerAccessDelay"
                ] += 1

                driver_counts[
                    "Provider Access & Wait Days"
                ] = (

                    driver_counts.get(
                        "Provider Access & Wait Days",
                        0
                    ) + 1
                )

                action_counts[
                    "Care/Provider Outreach"
                ] = (

                    action_counts.get(
                        "Care/Provider Outreach",
                        0
                    ) + 1
                )

            if (
                safe_float(
                    m.get(
                        "Pharmacy_Support_Issues"
                    )
                ) >= 1
            ):

                driver_counts[
                    "Pharmacy Support Issues"
                ] = (

                    driver_counts.get(
                        "Pharmacy Support Issues",
                        0
                    ) + 1
                )

                action_counts[
                    "Pharmacy Support"
                ] = (

                    action_counts.get(
                        "Pharmacy Support",
                        0
                    ) + 1
                )

            if (
                str(
                    m.get(
                        "Plan_Change_Recent"
                    )
                    or ""
                )
                == "Yes"
            ):

                driver_counts[
                    "Recent Plan Change"
                ] = (

                    driver_counts.get(
                        "Recent Plan Change",
                        0
                    ) + 1
                )

                action_counts[
                    "Plan Education"
                ] = (

                    action_counts.get(
                        "Plan Education",
                        0
                    ) + 1
                )

            if (
                str(
                    m.get(
                        "Engagement_Score_Trend"
                    )
                    or ""
                )
                == "Declining"
            ):

                risk_segments[
                    "decliningEngagement"
                ] += 1

                driver_counts[
                    "Declining Engagement"
                ] = (

                    driver_counts.get(
                        "Declining Engagement",
                        0
                    ) + 1
                )

                action_counts[
                    "Member Education/Outreach"
                ] = (

                    action_counts.get(
                        "Member Education/Outreach",
                        0
                    ) + 1
                )

        # =========================================================
        # DASHBOARD CALCULATIONS
        # =========================================================

        total_members = len(members)

        predicted_churn_rate = (

            round(
                total_prob_sum /
                total_members,
                4
            )

            if total_members > 0

            else 0.0
        )

        # =========================================================
        # Plan distribution
        # =========================================================

        plan_type_distribution = []

        for plan, data in plan_type_churn.items():

            tot = data["total"]

            chk = data["churn"]

            plan_type_distribution.append({

                "plan":
                    plan,

                "totalMembers":
                    tot,

                "predictedChurnCount":
                    chk,

                "churnRate":
                    round(
                        (
                            chk /
                            tot
                        ) * 100,
                        1
                    )
                    if tot > 0
                    else 0.0,
            })

        global_drivers = (
            self.global_feature_importance[:8]
        )

        # =========================================================
        # Dashboard cache
        # =========================================================

        self.dashboard_cache = {

            "kpis": {

                "totalMembers":
                    total_members,

                "highRiskMembers":
                    high_risk,

                "mediumRiskMembers":
                    medium_risk,

                "lowRiskMembers":
                    low_risk,

                "predictedChurnRate":
                    round(
                        predicted_churn_rate * 100,
                        1
                    ),
            },

            "riskDistribution": [

                {
                    "name":
                        f"Low Risk (<"
                        f"{int(self.thresholds['lowMax'] * 100)}%)",

                    "count":
                        low_risk,

                    "color":
                        "#10B981",
                },

                {
                    "name":
                        f"Medium Risk ("
                        f"{int(self.thresholds['lowMax'] * 100)}-"
                        f"{int(self.thresholds['mediumMax'] * 100)}%)",

                    "count":
                        medium_risk,

                    "color":
                        "#F59E0B",
                },

                {
                    "name":
                        f"High Risk (>="
                        f"{int((self.thresholds['mediumMax'] + 0.01) * 100)}%)",

                    "count":
                        high_risk,

                    "color":
                        "#EF4444",
                },
            ],

            "planTypeDistribution":
                plan_type_distribution,

            "riskSegments":
                risk_segments,

            "globalDrivers":
                global_drivers,

            "modelMetrics":
                self.metrics,

            "datasetName":
                schema.get("fileName")
                or "Uploaded_dataset.csv",
        }

        # =========================================================
        # Retention summary
        # =========================================================

        most_common_drivers = [

            {
                "driver":
                    driver,

                "count":
                    count,

                "percentage":
                    round(
                        (
                            count /
                            (total_members or 1)
                        ) * 100,
                        1
                    ),
            }

            for driver, count
            in driver_counts.items()
        ]

        most_common_drivers.sort(
            key=lambda d: d["count"],
            reverse=True
        )

        most_recommended_actions = [

            {
                "action":
                    action,

                "count":
                    count,

                "percentage":
                    round(
                        (
                            count /
                            (total_members or 1)
                        ) * 100,
                        1
                    ),
            }

            for action, count
            in action_counts.items()
        ]

        most_recommended_actions.sort(
            key=lambda a: a["count"],
            reverse=True
        )

        self.retention_summary_cache = {

            "totalHighRiskMembers":
                high_risk,

            "totalMediumRiskMembers":
                medium_risk,

            "totalLowRiskMembers":
                low_risk,

            "predictedChurnRate":
                predicted_churn_rate,

            "mostCommonDrivers":
                most_common_drivers,

            "mostRecommendedActions":
                most_recommended_actions,

            "highPriorityOpportunitiesCount":
                int(
                    round(
                        high_risk * 0.85
                    )
                ),
        }

    # =============================================================
    # DASHBOARD
    # =============================================================

    def get_cached_dashboard(
        self
    ) -> Dict[str, Any]:

        if not self.dashboard_cache:

            from app.services.data_service import DataService

            members, schema = (
                DataService.load_dataset()
            )

            self.train_model(
                members,
                schema
            )

        return (
            self.dashboard_cache
            or {}
        )

    # =============================================================
    # RETENTION SUMMARY
    # =============================================================

    def get_cached_retention_summary(
        self
    ) -> Dict[str, Any]:

        if not self.retention_summary_cache:

            from app.services.data_service import DataService

            members, schema = (
                DataService.load_dataset()
            )

            self.train_model(
                members,
                schema
            )

        return (
            self.retention_summary_cache
            or {}
        )

    # =============================================================
    # FAST MEMBER PREDICTION
    # =============================================================

    def get_member_prediction_fast(
        self,
        member_id: str,
        member: Dict[str, Any]
    ) -> Dict[str, Any]:

        if (
            member_id
            in self.member_predictions_map
        ):

            return (
                self.member_predictions_map[
                    member_id
                ]
            )

        return self.predict_member(
            member
        )

    # =============================================================
    # SINGLE MEMBER PREDICTION
    # =============================================================

    def predict_member(
        self,
        member: Dict[str, Any]
    ) -> Dict[str, Any]:

        if (

            not self.model

            or not self.processed_data

            or not self.schema
        ):

            from app.services.data_service import DataService

            members, schema = (
                DataService.load_dataset()
            )

            self.train_model(
                members,
                schema
            )

        try:

            row = (
                PreprocessingService
                .transform_single_member(
                    member,
                    self.schema,
                    self.processed_data
                )
            )

            X_single = np.array(
                [row],
                dtype=np.float32
            )

            prob = float(
                self.model.predict_proba(
                    X_single
                )[0, 1]
            )

        except Exception:

            from app.services.data_service import DataService

            members, schema = (
                DataService.load_dataset()
            )

            self.train_model(
                members,
                schema
            )

            row = (
                PreprocessingService
                .transform_single_member(
                    member,
                    self.schema,
                    self.processed_data
                )
            )

            X_single = np.array(
                [row],
                dtype=np.float32
            )

            prob = float(
                self.model.predict_proba(
                    X_single
                )[0, 1]
            )

        prob = round(
            prob,
            4
        )

        risk_level = (
            self.classify_risk_level(
                prob
            )
        )
        prediction = (

            "Churn"

            if
            prob >=
            self.classification_threshold

            else
            "Retained"
        )

        return {

            "probability":
                prob,

            "riskLevel":
                risk_level,

            "prediction":
                prediction,
        }

    # =============================================================
    # RISK LEVEL
    # =============================================================

    def classify_risk_level(
        self,
        prob: float
    ) -> str:

        if (
            prob <
            self.thresholds["lowMax"]
        ):

            return "LOW"

        if (
            prob <=
            self.thresholds["mediumMax"]
        ):

            return "MEDIUM"

        return "HIGH"

    # =============================================================
    # METRICS
    # =============================================================

    def get_metrics(
        self
    ) -> Dict[str, Any]:

        if (
            not self.metrics
            or not self.model
        ):

            from app.services.data_service import DataService

            members, schema = (
                DataService.load_dataset()
            )

            self.train_model(
                members,
                schema
            )

        return self.metrics

    # =============================================================
    # FEATURE IMPORTANCE
    # =============================================================

    def get_global_feature_importance(
        self
    ) -> List[Dict[str, Any]]:

        if (
            not self.global_feature_importance
            or not self.model
        ):

            from app.services.data_service import DataService

            members, schema = (
                DataService.load_dataset()
            )

            self.train_model(
                members,
                schema
            )

        return (
            self.global_feature_importance
        )

    # =============================================================
    # PROCESSED DATASET
    # =============================================================

    def get_processed_dataset(
        self
    ) -> Optional[Dict[str, Any]]:

        if not self.processed_data:

            from app.services.data_service import DataService

            members, schema = (
                DataService.load_dataset()
            )

            self.train_model(
                members,
                schema
            )

        return self.processed_data

    # =============================================================
    # SCHEMA
    # =============================================================

    def get_schema(
        self
    ) -> Optional[Dict[str, Any]]:

        if not self.schema:

            from app.services.data_service import DataService

            members, schema = (
                DataService.load_dataset()
            )

            self.train_model(
                members,
                schema
            )

        return self.schema

    # =============================================================
    # GLOBAL FEATURE IMPORTANCE
    # =============================================================

    def _calculate_global_importance(
        self
    ) -> None:

        if (
            not self.processed_data
            or not self.model
        ):

            return

        feature_names = (
            self.processed_data[
                "featureNames"
            ]
        )

        feature_labels = (
            self.processed_data[
                "featureLabels"
            ]
        )

        # CatBoost feature importance
        raw_importances = (
            self.model.feature_importances_
        )

        sum_imp = float(
            np.sum(
                raw_importances
            )
        )

        if sum_imp == 0:

            norm_importances = (
                np.ones(
                    len(feature_names)
                )
                /
                len(feature_names)
            )

        else:

            norm_importances = (
                raw_importances
                /
                sum_imp
            )

        importance_list = []

        for i, name in enumerate(
            feature_names
        ):

            importance_list.append({

                "feature":
                    name,

                "featureLabel":
                    feature_labels.get(
                        name,
                        name
                    ),

                "importance":
                    round(
                        float(
                            norm_importances[i]
                        ),
                        4
                    ),
            })

        importance_list.sort(
            key=lambda item:
                item["importance"],
            reverse=True
        )

        self.global_feature_importance = (
            importance_list
        )
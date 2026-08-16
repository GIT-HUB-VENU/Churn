import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from app.utils.helpers import format_feature_label

class PreprocessingService:
    @staticmethod
    def process_dataset(
        members: List[Dict[str, Any]],
        schema: Dict[str, Any],
        train_ratio: float = 0.8
    ) -> Dict[str, Any]:
        medians: Dict[str, float] = {}
        modes: Dict[str, str] = {}
        categorical_maps: Dict[str, List[str]] = {}

        # 1. Compute Medians for Numerical Features
        for feat in schema["numericalFeatures"]:
            vals = [float(m[feat]) for m in members if m.get(feat) is not None and not pd.isna(m.get(feat))]
            if len(vals) > 0:
                medians[feat] = float(np.median(vals))
            else:
                medians[feat] = 0.0

        # 2. Compute Unique Values & Categorical Encodings
        for feat in schema["categoricalFeatures"]:
            counts: Dict[str, int] = {}
            for m in members:
                val = str(m.get(feat, "")).strip()
                if val:
                    counts[val] = counts.get(val, 0) + 1

            unique_vals = sorted(list(counts.keys()))
            categorical_maps[feat] = unique_vals

            mode_val = "Unknown"
            max_count = 0
            for k, v in counts.items():
                if v > max_count:
                    max_count = v
                    mode_val = k
            modes[feat] = mode_val

        # 3. Construct Feature Names & Labels
        feature_names: List[str] = []
        feature_labels: Dict[str, str] = {}

        for feat in schema["numericalFeatures"]:
            feature_names.append(feat)
            feature_labels[feat] = format_feature_label(feat)

        for feat in schema["categoricalFeatures"]:
            categories = categorical_maps[feat]
            for cat in categories:
                encoded_name = f"{feat}_{cat}"
                feature_names.append(encoded_name)
                feature_labels[encoded_name] = f"{format_feature_label(feat)}: {cat}"

        # 4. Transform Records to Feature Matrix X and Target y
        X: List[List[float]] = []
        y: List[int] = []
        member_ids: List[str] = []

        for m in members:
            member_ids.append(str(m.get(schema["idColumn"], "")))

            target_val = str(m.get(schema["targetColumn"], "")).lower()
            is_churn = 1 if target_val in ("yes", "1", "true") else 0
            y.append(is_churn)

            row_features: List[float] = []

            # Numerical
            for feat in schema["numericalFeatures"]:
                val = m.get(feat)
                try:
                    if val is None or pd.isna(val):
                        val_num = medians[feat]
                    else:
                        val_num = float(val)
                except (ValueError, TypeError):
                    val_num = medians[feat]
                row_features.append(val_num)

            # Categorical One-Hot
            for feat in schema["categoricalFeatures"]:
                m_val = str(m.get(feat, "")).strip()
                categories = categorical_maps[feat]
                for cat in categories:
                    row_features.append(1.0 if m_val == cat else 0.0)

            X.append(row_features)

        # 5. Split into Train & Test (80/20 stratified-like)
        total_count = len(X)
        split_index = int(total_count * train_ratio)

        # Deterministic shuffle matching JS hash ordering for consistency
        indices = list(range(total_count))
        indices.sort(key=lambda i: (i * 9301 + 49297) % 233280)

        train_indices = indices[:split_index]
        test_indices = indices[split_index:]

        X_train = [X[i] for i in train_indices]
        y_train = [y[i] for i in train_indices]

        X_test = [X[i] for i in test_indices]
        y_test = [y[i] for i in test_indices]
        test_member_ids = [member_ids[i] for i in test_indices]

        return {
            "featureNames": feature_names,
            "X": X,
            "y": y,
            "XTrain": X_train,
            "yTrain": y_train,
            "XTest": X_test,
            "yTest": y_test,
            "memberIds": member_ids,
            "testMemberIds": test_member_ids,
            "medians": medians,
            "categoricalMaps": categorical_maps,
            "featureLabels": feature_labels,
        }

    @staticmethod
    def transform_single_member(
        member: Dict[str, Any],
        schema: Dict[str, Any],
        processed: Dict[str, Any]
    ) -> List[float]:
        row_features: List[float] = []

        # Numerical
        for feat in schema["numericalFeatures"]:
            val = member.get(feat)
            try:
                if val is None or pd.isna(val):
                    val_num = processed["medians"].get(feat, 0.0)
                else:
                    val_num = float(val)
            except (ValueError, TypeError):
                val_num = processed["medians"].get(feat, 0.0)
            row_features.append(val_num)

        # Categorical One-Hot
        for feat in schema["categoricalFeatures"]:
            m_val = str(member.get(feat, "")).strip()
            categories = processed["categoricalMaps"].get(feat, [])
            for cat in categories:
                row_features.append(1.0 if m_val == cat else 0.0)

        return row_features

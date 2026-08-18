import os
import io
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from app.config.settings import settings

class DataService:
    _cached_members: Optional[List[Dict[str, Any]]] = None
    _cached_schema: Optional[Dict[str, Any]] = None
    _active_file_path: str = settings.DATASET_PATH

    @classmethod
    def set_dataset_file_path(cls, file_path: str) -> None:
        cls._active_file_path = file_path
        cls._cached_members = None
        cls._cached_schema = None

    @classmethod
    def find_any_csv_in_dirs(cls) -> Optional[str]:
        data_dir = Path(settings.DATA_DIR)
        if data_dir.exists():
            for f in data_dir.glob("*.csv"):
                return str(f)
        return None

    @classmethod
    def load_dataset(cls) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        if cls._cached_members is not None and cls._cached_schema is not None:
            return cls._cached_members, cls._cached_schema

        file_path = cls._active_file_path
        if not os.path.exists(file_path):
            if os.path.exists(settings.FALLBACK_DATASET_PATH):
                file_path = str(settings.FALLBACK_DATASET_PATH)
            elif os.path.exists(settings.DEFAULT_DATASET_PATH):
                file_path = str(settings.DEFAULT_DATASET_PATH)
            else:
                discovered = cls.find_any_csv_in_dirs()
                if discovered:
                    file_path = discovered
                else:
                    raise FileNotFoundError("No CSV dataset file found in data/ or backend/data/. Please upload a CSV dataset.")

        file_name = os.path.basename(file_path)

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            file_content = f.read()

        non_col_lines = [line for line in file_content.splitlines() if line.strip()]
        if len(non_col_lines) > 1:
            first_cols = [c.strip() for c in non_col_lines[0].split(",") if c.strip()]
            second_cols = [c.strip() for c in non_col_lines[1].split(",") if c.strip()]
            if len(first_cols) <= 1 and len(second_cols) > 2:
                file_content = "\n".join(non_col_lines[1:])

        df = pd.read_csv(io.StringIO(file_content))
        if df.empty:
            raise ValueError("CSV dataset is empty.")

        columns = list(df.columns)

        # Detect Target Column
        target_column = None
        target_candidates = ["churn", "disenrolled", "target", "is_churn", "left_plan"]
        for col in columns:
            if col.lower() in target_candidates:
                target_column = col
                break
        
        if not target_column:
            for col in columns:
                if "churn" in col.lower():
                    target_column = col
                    break
        
        if not target_column:
            target_column = columns[-1]

        # Detect Member ID Column
        id_column = None
        id_candidates = ["member_id", "memberid", "id", "user_id", "subscriber_id"]
        for col in columns:
            if col.lower() in id_candidates:
                id_column = col
                break
        
        if not id_column:
            for col in columns:
                if "id" in col.lower():
                    id_column = col
                    break
        
        if not id_column:
            id_column = columns[0]

        numerical_features = []
        categorical_features = []

        for col in columns:
            if col in (id_column, target_column):
                continue
            
            non_null_series = df[col].dropna()
            if non_null_series.empty:
                categorical_features.append(col)
                continue

            # Infer type: check numeric ratio
            sample = non_null_series.head(100)
            numeric_count = 0
            for val in sample:
                try:
                    float(val)
                    numeric_count += 1
                except (ValueError, TypeError):
                    pass

            if numeric_count / len(sample) >= 0.8:
                numerical_features.append(col)
            else:
                categorical_features.append(col)

        # Build clean list of dictionaries
        raw_rows = df.to_dict(orient="records")
        members = []

        for idx, row in enumerate(raw_rows):
            cleaned_row = dict(row)
            
            # Ensure ID
            if pd.isna(cleaned_row.get(id_column)) or str(cleaned_row.get(id_column, "")).strip() == "":
                cleaned_row[id_column] = f"MMB-{10001 + idx}"
            else:
                cleaned_row[id_column] = str(cleaned_row[id_column]).strip()

            cleaned_row["Member_ID"] = cleaned_row[id_column]

            # Target normalization
            raw_target = str(cleaned_row.get(target_column, "")).strip().lower()
            if raw_target in ["yes", "1", "true", "churn", "y"]:
                cleaned_row[target_column] = "Yes"
            else:
                cleaned_row[target_column] = "No"

            cleaned_row["Churn"] = cleaned_row[target_column]

            # Convert numerical features safely
            for col in numerical_features:
                val = cleaned_row.get(col)
                if pd.isna(val) or val is None or val == "":
                    cleaned_row[col] = 0
                else:
                    try:
                        cleaned_row[col] = float(val)
                    except (ValueError, TypeError):
                        cleaned_row[col] = 0.0

            # Convert categorical features safely
            for col in categorical_features:
                val = cleaned_row.get(col)
                if pd.isna(val) or val is None:
                    cleaned_row[col] = ""
                else:
                    cleaned_row[col] = str(val).strip()

            members.append(cleaned_row)

        schema = {
            "targetColumn": target_column,
            "idColumn": id_column,
            "numericalFeatures": numerical_features,
            "categoricalFeatures": categorical_features,
            "totalRows": len(members),
            "columns": columns,
            "fileName": file_name,
            "filePath": file_path,
        }

        cls._cached_members = members
        cls._cached_schema = schema

        return members, schema

    @classmethod
    def get_member_by_id(cls, member_id: str) -> Optional[Dict[str, Any]]:
        members, schema = cls.load_dataset()
        id_col = schema["idColumn"]
        query_id = str(member_id).strip().lower()
        for m in members:
            if str(m.get(id_col, "")).strip().lower() == query_id:
                return m
        return None

    @classmethod
    def reload_dataset(cls) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        cls._cached_members = None
        cls._cached_schema = None
        return cls.load_dataset()

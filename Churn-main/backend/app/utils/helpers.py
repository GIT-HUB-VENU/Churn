import re
from typing import Any

def safe_float(val: Any, default: float = 0.0) -> float:
    """Safely convert any value (numeric, string, boolean representation) to float."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).strip().lower()
    if val_str in ("yes", "true", "y", "churn"):
        return 1.0
    if val_str in ("no", "false", "n", "retained", ""):
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def format_feature_label(feat: str) -> str:
    """Format feature names into business-friendly display labels."""
    s = feat.replace("_", " ")
    s = re.sub(r"([a-z])([A-Z])", r"\1 \2", s)
    s = re.sub(r"\bPct\b", "%", s, flags=re.IGNORECASE)
    s = re.sub(r"\b90d\b", "(90 Days)", s, flags=re.IGNORECASE)
    words = s.split()
    capitalized_words = [w.capitalize() if not w.startswith("%") and not w.startswith("(") else w for w in words]
    return " ".join(capitalized_words)


from pathlib import Path
import joblib, pandas as pd
from app.ml.features import extract_url_features, FEATURE_NAMES

ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "models"

def load_model(name):
    path = MODEL_DIR / name
    if not path.exists():
        raise RuntimeError(f"Model {name} not found. Train models first; see README.md.")
    return joblib.load(path)

def result(kind, model, features):
    probabilities = model.predict_proba(features)[0]
    probability = float(probabilities[list(model.classes_).index(1)])
    label = "phishing" if probability >= 0.5 else "legitimate"
    return {"input_type": kind, "prediction": label, "risk_score": round(probability*100, 2),
            "warning": "Potential phishing detected" if label == "phishing" else "Model classified this as legitimate",
            "disclaimer": "Prototype score only; this does not guarantee safety."}

def scan_url(url):
    model = load_model("url_model.joblib")
    X = pd.DataFrame([extract_url_features(url)])[FEATURE_NAMES]
    return result("url", model, X)

def scan_email(email_text):
    model = load_model("email_model.joblib")
    return result("email", model, [email_text])

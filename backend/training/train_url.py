from pathlib import Path
import joblib, pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from app.ml.features import extract_url_features, FEATURE_NAMES
from training.demo_data import URL_EXAMPLES

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def main():
    df = pd.DataFrame(URL_EXAMPLES, columns=["url", "label"])
    X = pd.DataFrame([extract_url_features(u) for u in df.url])[FEATURE_NAMES]
    y = df.label
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.25, 
                                                        random_state=42, 
                                                        stratify=y)
    model = RandomForestClassifier(n_estimators=150, class_weight="balanced",
                                   random_state=42)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    print("URL model report (toy dataset; not production evidence):")
    print(classification_report(y_test, pred, labels=[0,1], target_names=[" Legitimate ","Phishing"], zero_division=0))
    print("Confusion matrix:", confusion_matrix(y_test, pred, labels=[0,1]))
    joblib.dump(model, MODEL_DIR / "url_model.joblib")
    print("Saved", MODEL_DIR / "url_model.joblib")
if __name__ == "__main__":
    main()

from pathlib import Path
import joblib, pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from training.demo_data import EMAIL_EXAMPLES

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def main():
    df = pd.DataFrame(EMAIL_EXAMPLES, columns=["email", "label"])
    X_train, X_test, y_train, y_test = train_test_split(df.email, df.label, test_size=.25, random_state=42, stratify=df.label)
    model = Pipeline([("tfidf", TfidfVectorizer(ngram_range=(1,2), max_features=5000, sublinear_tf=True)),
                      ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))])
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    print("Email model report (toy dataset; not production evidence):")
    print(classification_report(y_test, pred, labels=[0,1], target_names=["Legitimate","Phishing"], zero_division=0))
    print("Confusion matrix:", confusion_matrix(y_test, pred, labels=[0,1]))
    joblib.dump(model, MODEL_DIR / "email_model.joblib")
    print("Saved", MODEL_DIR / "email_model.joblib")
if __name__ == "__main__":
    main()

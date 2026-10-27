# AI-Based Phishing URL and Email Detection System

Starter full-stack project: Python, Scikit-learn, FastAPI, React/Vite, and a MySQL-ready scaffold.

## Windows setup

### Backend (PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m training.train_url
python -m training.train_email
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

### Frontend (second terminal)
```powershell
cd frontend
npm install
npm run dev
```

The bundled dataset is synthetic and tiny, for pipeline demonstration only. Do not use its scores for real-world security decisions. The URL scanner never opens submitted URLs. Database persistence and authentication are not implemented yet.

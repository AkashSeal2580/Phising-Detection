from fastapi import APIRouter, HTTPException
from app.schemas.scan import EmailScanRequest
from app.services.predictor import scan_email
router = APIRouter(prefix="/api/scan", tags=["Email scanning"])

@router.post("/email")
def scan_email_route(payload: EmailScanRequest):
    try:
        return scan_email(payload.email_text)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

from fastapi import APIRouter, HTTPException
from app.schemas.scan import URLScanRequest
from app.services.predictor import scan_url
router = APIRouter(prefix="/api/scan", tags=["URL scanning"])

@router.post("/url")
def scan_url_route(payload: URLScanRequest):
    try:
        return scan_url(payload.url)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

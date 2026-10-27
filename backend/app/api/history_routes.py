from fastapi import APIRouter
router = APIRouter(prefix="/api", tags=["History"])

@router.get("/history")
def history():
    return {"items": [], "note": "Database-backed history will be added in a later step."}

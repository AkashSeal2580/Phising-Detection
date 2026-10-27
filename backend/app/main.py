from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, CORS_ORIGINS
from app.api.url_routes import router as url_router
from app.api.email_routes import router as email_router
from app.api.history_routes import router as history_router
from app.auth import router as auth_router
from app.auth_db import init_auth_db

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_auth_db()
    yield


app = FastAPI(
    title=APP_NAME,
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(url_router)
app.include_router(email_router)
app.include_router(history_router)
app.include_router(auth_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": APP_NAME}

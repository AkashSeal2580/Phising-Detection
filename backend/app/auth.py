import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from jwt import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy import func
from sqlalchemy.orm import Session

from .auth_db import User, get_db
from .auth_schemas import (
    LoginRequest,
    RegisterRequest,
    UserResponse,
)

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "")
FRONTEND_ORIGINS = {
    value.strip().rstrip("/")
    for value in os.getenv(
        "API_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if value.strip()
}

COOKIE_NAME = "phishguard_session"
COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"
SESSION_HOURS = 8
ALGORITHM = "HS256"

password_hasher = PasswordHash.recommended()


def require_secret():
    if len(SECRET_KEY) < 32:
        raise RuntimeError(
            "AUTH_SECRET_KEY must be at least 32 characters. "
            "Set it in your backend .env file."
        )


def check_origin(request: Request):
    origin = request.headers.get("origin")

    # Browser requests must originate from an allowed frontend.
    if origin and origin.rstrip("/") not in FRONTEND_ORIGINS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid request origin.",
        )


def create_token(user: User) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user.id),
        "iat": now,
        "exp": now + timedelta(hours=SESSION_HOURS),
        "jti": secrets.token_urlsafe(16),
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def set_session_cookie(response: Response, user: User):
    response.set_cookie(
        key=COOKIE_NAME,
        value=create_token(user),
        max_age=SESSION_HOURS * 60 * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    require_secret()

    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Please log in.",
        )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["sub", "exp", "iat", "jti"]},
        )
        user_id = int(payload["sub"])

    except (InvalidTokenError, ValueError, TypeError, KeyError):
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid. Please log in again.",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Invalid session.",
        )

    return user


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    require_secret()
    check_origin(request)

    name = body.name.strip()
    email = body.email.strip().lower()
    password = body.password

    if len(name) < 2:
        raise HTTPException(422, "Please enter your full name.")

    if not any(char.isalpha() for char in password) or not any(
        char.isdigit() for char in password
    ):
        raise HTTPException(
            422,
            "Password must contain at least one letter and one number.",
        )

    existing = db.query(User).filter(func.lower(User.email) == email).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists. Please log in.",
        )

    user = User(
        name=name,
        email=email,
        password_hash=password_hasher.hash(password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    set_session_cookie(response, user)

    return {
        "message": "Account created successfully.",
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/login")
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    require_secret()
    check_origin(request)

    email = body.email.strip().lower()

    user = db.query(User).filter(func.lower(User.email) == email).first()

    # Do not disclose whether the email exists.
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )

    try:
        password_matches = password_hasher.verify(
            body.password,
            user.password_hash,
        )
    except (ValueError, TypeError):
        # The stored hash may use an incompatible format.
        password_matches = False

    if not password_matches or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )

    set_session_cookie(response, user)

    return {
        "message": "Logged in successfully.",
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(current_user)):
    return user


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    user: User = Depends(current_user),
):
    check_origin(request)

    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        secure=COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )

    return {"message": "Logged out successfully."}

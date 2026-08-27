from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from ..services.auth_service import (
    create_user,
    authenticate_user,
    create_access_token,
    decode_token,
    to_user_response,
)
from ..models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    user = db.get(User, payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


# Re-export for reuse in other modules
get_current_user = _get_current_user


def get_current_user_optional(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        return None
    return db.get(User, payload["sub"])


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = create_user(db, req.name, req.email, req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=to_user_response(user))


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=to_user_response(user))


@router.get("/me", response_model=UserResponse)
def me(current: User = Depends(_get_current_user)):
    return to_user_response(current)

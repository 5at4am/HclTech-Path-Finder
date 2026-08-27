from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone, timedelta

import jwt
from sqlalchemy.orm import Session

from ..config import SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES
from ..models import User
from ..schemas import UserResponse

try:
    import bcrypt as _bcrypt

    def _hash_password(password: str) -> str:
        return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

    def _verify_password(password: str, stored: str) -> bool:
        try:
            return _bcrypt.checkpw(password.encode(), stored.encode())
        except Exception:
            return False

except ImportError:
    # Fallback: salted sha256 (portable, no native deps)
    def _hash_password(password: str) -> str:
        salt = uuid.uuid4().hex[:16]
        digest = hashlib.sha256((salt + password).encode()).hexdigest()
        return f"{salt}${digest}"

    def _verify_password(password: str, stored: str) -> bool:
        try:
            salt, digest = stored.split("$", 1)
        except ValueError:
            return False
        check = hashlib.sha256((salt + password).encode()).hexdigest()
        return check == digest


def create_user(db: Session, name: str, email: str, password: str) -> User:
    existing = db.query(User).filter(User.email == email.lower().strip()).first()
    if existing:
        raise ValueError("Email already registered.")
    user = User(
        id=uuid.uuid4().hex,
        email=email.lower().strip(),
        name=name.strip(),
        password_hash=_hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        return None
    if not _verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(user_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRE_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at,
    )

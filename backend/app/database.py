from __future__ import annotations

import sys
from pathlib import Path

# Allow importing the existing ML model (Model/solution.py) without moving it.
# Search a few candidate locations so this works whether the app runs from the
# repo root (local dev), a backend-only deploy root (Render), or a container.
_MODEL_CANDIDATES = [
    Path(__file__).resolve().parents[2] / "Model",  # <repo>/Model
    Path(__file__).resolve().parents[1] / "Model",  # <deploy_root>/Model
    Path(__file__).resolve().parent / "Model",      # app/Model
]
MODEL_DIR = next((p for p in _MODEL_CANDIDATES if (p / "solution.py").exists()), None)
if MODEL_DIR is not None and str(MODEL_DIR) not in sys.path:
    sys.path.insert(0, str(MODEL_DIR))

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

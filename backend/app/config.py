from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
MODEL_DIR = PROJECT_ROOT / "Model"
DATA_DIR = PROJECT_ROOT / "Data"


def _get_env(key: str, default: str) -> str:
    return os.environ.get(key, default)


GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "qwen/qwen3.6-27b")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{(BACKEND_DIR.parent / 'padhai.db')}")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Comma-separated list wins if provided, e.g.
# CORS_ORIGINS=https://padhai.vercel.app,https://padhai-git-main-you.vercel.app
_env_origins = [
    o.strip().rstrip("/")
    for o in os.environ.get("CORS_ORIGINS", "").split(",")
    if o.strip()
]
CORS_ORIGINS = list(
    dict.fromkeys(
        _env_origins
        + [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            FRONTEND_URL.rstrip("/"),
        ]
    )
)

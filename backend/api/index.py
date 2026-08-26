"""
Vercel entry point for FastAPI.

When `backend/` is set as the Vercel Project's Root Directory,
Vercel's Python runtime (@vercel/python) treats `api/index.py`
as a serverless function and routes all requests to the exported
ASGI `app`.

Local / Render still use:  uvicorn app.main:app
Vercel uses:               api/index.py:app
"""
from app.main import app  # noqa: F401

# Explicit export for Vercel
__all__ = ["app"]

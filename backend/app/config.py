"""Application configuration — loads from .env at project root."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Walk up to find .env next to requirements.txt
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


class Settings:
    """Singleton-ish settings pulled from environment variables."""

    IMPULSE_AI_URL: str = os.getenv("IMPULSE_AI_URL", "")
    IMPULSE_AI_KEY: str = os.getenv("IMPULSE_AI_KEY", "")
    IMPULSE_AI_DEPLOYMENT_ID: str = os.getenv("IMPULSE_AI_DEPLOYMENT_ID", "")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{Path(__file__).resolve().parent.parent / 'triage_audit.db'}",
    )


settings = Settings()

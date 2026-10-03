"""
core/config.py — App settings loaded from environment variables.

Uses pydantic-settings so all config is type-checked and validated at startup.
Add any new env vars here first, then use them via `from core.config import settings`.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    # Must be the Supabase Session Pooler URI, not the direct host.
    database_url: str

    # ── Supabase ──────────────────────────────────────────────────────────────
    supabase_url: str
    supabase_service_key: str  # service role key — backend only

    # ── AI Model ──────────────────────────────────────────────────────────────
    model_path: str = "./models/chest_xray_seg.pth"

    # ── App & Auth ────────────────────────────────────────────────────────────
    environment: str = "development"
    allowed_origins: str = "http://localhost:5173"
    jwt_secret: str = "MEDORA_SUPER_SECURE_JWT_SECRET_KEY_CHANGE_IN_PRODUCTION_2026"

    @property
    def origins_list(self) -> list[str]:
        """Parse comma-separated ALLOWED_ORIGINS into a list."""
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    Use as a FastAPI dependency: settings = Depends(get_settings)
    Or import directly: from core.config import settings
    """
    return Settings()


# Convenience singleton for non-DI usage
settings = get_settings()

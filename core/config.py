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

    # Remote U-Net Deep Learning (DL) service (Render). API key is server-side only — never expose to frontend.
    dl_api_url: str = "https://chest-xray-ai-annotation.onrender.com"
    ml_api_url: str = "https://chest-xray-ai-annotation.onrender.com"
    dl_api_key: str = ""
    ml_api_key: str = ""
    x_api_key: str = ""
    dl_api_timeout: float = 120.0
    ml_api_timeout: float = 120.0
    use_remote_model: bool = True

    @property
    def effective_dl_api_key(self) -> str:
        return self.dl_api_key or self.ml_api_key or self.x_api_key

    @property
    def effective_dl_url(self) -> str:
        return self.dl_api_url or self.ml_api_url

    # ── App & Auth ────────────────────────────────────────────────────────────
    environment: str = "development"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    jwt_secret: str = "MEDORA_SUPER_SECURE_JWT_SECRET_KEY_CHANGE_IN_PRODUCTION_2026"

    @property
    def origins_list(self) -> list[str]:
        """Parse comma-separated ALLOWED_ORIGINS into a list."""
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
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

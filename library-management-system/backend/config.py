"""Application configuration loaded from environment variables."""
from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Reads values from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/library_db"
    )
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    app_name: str = "Library Management System API"
    app_version: str = "1.0.0"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

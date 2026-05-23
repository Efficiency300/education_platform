from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    llm_model: str = "claude-haiku-4-5-20251001"

    database_url: str = "sqlite+aiosqlite:///./data/app.db"
    frontend_origin: str = "http://localhost:5173"

    ispring_base_url: str = ""
    ispring_api_key: str = ""

    regulations_dir: str = "./data/regulations"

    jwt_secret: str = "dev-secret-change-me-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24 * 7

    @property
    def regulations_path(self) -> Path:
        return Path(self.regulations_dir).resolve()


settings = Settings()

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Primary LLM: Gemini. Falls back to Anthropic when set, mock otherwise.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    anthropic_api_key: str = ""
    llm_model: str = "claude-haiku-4-5-20251001"

    database_url: str = "sqlite+aiosqlite:///./data/app.db"
    frontend_origin: str = "http://localhost:5173"

    ispring_base_url: str = ""
    ispring_api_key: str = ""

    # Local file storage.
    regulations_dir: str = "./data/regulations"
    uploads_dir: str = "./data/uploads"

    jwt_secret: str = "dev-secret-change-me-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24 * 7

    @property
    def regulations_path(self) -> Path:
        return Path(self.regulations_dir).resolve()

    @property
    def uploads_path(self) -> Path:
        return Path(self.uploads_dir).resolve()

    @property
    def llm_provider(self) -> str:
        if self.gemini_api_key:
            return "gemini"
        if self.anthropic_api_key:
            return "anthropic"
        return "mock"


settings = Settings()

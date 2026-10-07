from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str = ""
    mongodb_database: str = "gd_arena"
    gemini_api_key: str = ""
    llm_model: str = "gemini-2.5-flash"
    jwt_secret: str = "change-me"
    backend_url: str = "http://localhost:8000"
    next_public_api_url: str = "http://localhost:8000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()


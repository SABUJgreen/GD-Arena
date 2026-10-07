from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str = ""
    mongodb_database: str = "gd_arena"
    groq_api_key: str = ""
    llm_model: str = "llama-3.1-8b-instant"
    jwt_secret: str = "change-me"
    backend_url: str = "http://localhost:8000"
    next_public_api_url: str = "http://localhost:8000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()


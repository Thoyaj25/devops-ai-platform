from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Knowledge Assistant"
    app_version: str = "0.1.0"
    environment: str = "development"

    aws_region: str = "us-east-1"

    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-6"
    embedding_model_id: str = "us.cohere.embed-v4:0"
    embedding_dimension: int = 1536

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()

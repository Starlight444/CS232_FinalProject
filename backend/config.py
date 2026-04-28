from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET: str
    CRYPTO_SECRET: str
    USE_MOCK: bool
    #SNS_TOPIC_ARN: str

    class Config:
        env_file = ".env"

settings = Settings()
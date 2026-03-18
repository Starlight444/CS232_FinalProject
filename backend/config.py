from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET: str
    #SNS_TOPIC_ARN: str

    class Config:
        env_file = ".env"

settings = Settings()
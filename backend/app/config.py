from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./storypulse.db"
    jwt_secret_key: str  # 必填 — 不设则启动失败，杜绝密钥随机生成
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 小时
    api_encryption_key: str = ""  # 44-char base64 Fernet key; generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:5173"]
    allowed_hosts: list[str] = ["localhost", "127.0.0.1"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

import os
import secrets

# 数据库文件路径（相对于 backend/ 目录）
DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(os.path.dirname(DB_DIR), "storypulse.db")

# SQLite 开发环境 / PostgreSQL 生产环境
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# JWT 配置
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24  # 24 小时


class Settings:
    database_url: str = DATABASE_URL
    secret_key: str = JWT_SECRET_KEY
    algorithm: str = JWT_ALGORITHM
    jwt_expire_minutes: int = JWT_EXPIRE_MINUTES
    debug: bool = False


settings = Settings()

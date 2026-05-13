import os

# 数据库文件路径（相对于 backend/ 目录）
DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(os.path.dirname(DB_DIR), "storypulse.db")

# SQLite 开发环境 / PostgreSQL 生产环境（切换环境只需改这里）
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# SQLAlchemy 配置
class Settings:
    database_url: str = DATABASE_URL
    debug: bool = False  # 开发时改为 True 可查看 SQL 日志


settings = Settings()

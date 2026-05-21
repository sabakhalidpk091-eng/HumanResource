import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent

# Support both normal `.env` and the accidentally committed ` .env`.
for env_name in (".env", " .env"):
    env_path = BASE_DIR / env_name
    if env_path.exists():
        load_dotenv(env_path, override=False)

DATABASE_URL = os.getenv("DATABASE_URL")
SQLSERVER_HOST = os.getenv("SQLSERVER_HOST", "localhost")
SQLSERVER_DB = os.getenv("SQLSERVER_DB", "HumanResource")
SQLSERVER_DRIVER = os.getenv("SQLSERVER_DRIVER", "ODBC Driver 17 for SQL Server")
USE_SQLITE_FALLBACK = os.getenv("USE_SQLITE_FALLBACK", "1") == "1"

sqlite_path = BASE_DIR / "hrm_dev.db"
SQLITE_FALLBACK_URL = f"sqlite:///{sqlite_path.as_posix()}"

if DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
elif os.getenv("SQLSERVER_HOST") or os.getenv("SQLSERVER_DB") or not USE_SQLITE_FALLBACK:
    driver = quote_plus(SQLSERVER_DRIVER)
    SQLALCHEMY_DATABASE_URL = (
        f"mssql+pyodbc://@{SQLSERVER_HOST}/{SQLSERVER_DB}"
        f"?driver={driver}&trusted_connection=yes"
    )
else:
    SQLALCHEMY_DATABASE_URL = SQLITE_FALLBACK_URL


def _connect_args_for(url: str) -> dict:
    if url.startswith("sqlite:///"):
        return {"check_same_thread": False}
    return {}


def _build_engine(url: str):
    return create_engine(url, connect_args=_connect_args_for(url))

engine = _build_engine(SQLALCHEMY_DATABASE_URL)
if USE_SQLITE_FALLBACK and not SQLALCHEMY_DATABASE_URL.startswith("sqlite:///"):
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        SQLALCHEMY_DATABASE_URL = SQLITE_FALLBACK_URL
        engine = _build_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

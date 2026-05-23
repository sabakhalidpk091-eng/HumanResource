import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext

BASE_DIR = Path(__file__).resolve().parent
for env_name in (".env", " .env"):
    env_path = BASE_DIR / env_name
    if env_path.exists():
        load_dotenv(env_path, override=False)

SECRET_KEY = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY")

# Crash loudly at startup if no secret is configured.
# A missing secret means tokens would be signed with None — a critical vulnerability.
if not SECRET_KEY:
    print(
        "\n[FATAL] JWT_SECRET environment variable is not set.\n"
        "Create a python_backend/.env file with:\n"
        "  JWT_SECRET=some-long-random-string\n"
        "Server cannot start without it.\n",
        file=sys.stderr,
    )
    sys.exit(1)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

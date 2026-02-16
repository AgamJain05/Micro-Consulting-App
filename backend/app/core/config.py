import os
import secrets
from typing import List, Union, Optional

from pydantic import AnyHttpUrl, EmailStr, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Micro Consulting Marketplace"
    API_V1_STR: str = "/api/v1"
    
    # Security - Must be set via environment variable in production
    SECRET_KEY: str = os.environ.get("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 hours (reduced from 8 days for security)

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "micro_consulting"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = "noreply@microconsult.com"
    EMAILS_FROM_NAME: str = "MicroConsult"
    
    # TURN Server Configuration (for WebRTC)
    TURN_SERVER_URL: Optional[str] = None
    TURN_SERVER_USERNAME: Optional[str] = None
    TURN_SERVER_CREDENTIAL: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Environment
    ENVIRONMENT: str = "development"
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def ice_servers(self) -> List[dict]:
        """Return ICE servers configuration for WebRTC"""
        servers = [{"urls": "stun:stun.l.google.com:19302"}]
        if self.TURN_SERVER_URL and self.TURN_SERVER_USERNAME:
            servers.append({
                "urls": self.TURN_SERVER_URL,
                "username": self.TURN_SERVER_USERNAME,
                "credential": self.TURN_SERVER_CREDENTIAL
            })
        return servers
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback")
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Validate secret key in production
if settings.is_production and settings.SECRET_KEY == "YOUR_SUPER_SECRET_KEY_CHANGE_IN_PROD":
    raise ValueError("SECRET_KEY must be changed in production!")


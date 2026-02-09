from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.session import Session
from app.models.review import Review
from app.models.message import Message

async def init_db():
    # Add SSL/TLS parameters to fix Python 3.13 compatibility issues
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tlsAllowInvalidCertificates=True,  # Bypass SSL cert validation
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000
    )
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Session, Review, Message])

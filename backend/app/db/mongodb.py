from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import certifi
from app.core.config import settings
from app.models.user import User
from app.models.session import Session
from app.models.review import Review
from app.models.message import Message

async def init_db():
    """
    Initialize MongoDB connection.
    Uses simplified SSL configuration for Python 3.13 compatibility.
    """
    # For Python 3.13 compatibility, use minimal TLS configuration
    # Let MongoDB driver handle SSL/TLS automatically from connection string
    # TEMPORARY: Allow invalid certificates until Python 3.11 is used
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tlsAllowInvalidCertificates=True,  # Bypass strict Python 3.13 SSL validation
        serverSelectionTimeoutMS=30000,  # 30 seconds for initial connection
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
    )
    
    # Test connection
    try:
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print(f"Connection string (sanitized): {settings.MONGODB_URL.split('@')[1] if '@' in settings.MONGODB_URL else 'invalid'}")
        raise
    
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Session, Review, Message])

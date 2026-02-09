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
    Initialize MongoDB connection with proper SSL/TLS configuration.
    Fixes SSL handshake errors on production platforms like Render.
    """
    # MongoDB Atlas requires TLS/SSL - configure properly for production
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tls=True,  # Enable TLS/SSL
        tlsAllowInvalidCertificates=False,  # Validate certificates in production
        serverSelectionTimeoutMS=10000,  # Increased timeout for initial connection
        connectTimeoutMS=20000, 
        tlsCAFile=certifi.where(), # Increased connection timeout
        retryWrites=True,  # Enable retryable writes
        w='majority'  # Write concern for data safety
    )
    
    # Test connection
    try:
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise
    
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Session, Review, Message])

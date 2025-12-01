from typing import List, Optional
from datetime import datetime
from enum import Enum
from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field

class UserRole(str, Enum):
    CLIENT = "client"
    CONSULTANT = "consultant"

class AvailabilityStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"

class User(Document):
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    role: UserRole = UserRole.CLIENT
    
    first_name: str
    last_name: str
    
    # Client specific fields
    credits: float = 50.0 # Replaced free_minutes_balance with credits (default $50)
    
    # Profile fields (mostly for consultants, but clients can have some too)
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    price_per_minute: Optional[float] = None  # In USD
    
    # New UI fields
    rating: float = 5.0
    review_count: int = 0
    category: str = "Development"
    avatar_url: Optional[str] = None
    
    status: AvailabilityStatus = AvailabilityStatus.OFFLINE
    timezone: str = "UTC"
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

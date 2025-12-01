from typing import Optional
from datetime import datetime
from enum import Enum
from beanie import Document, Link
from pydantic import Field
from app.models.user import User

class SessionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Session(Document):
    client: Link[User]
    consultant: Link[User]
    
    topic: str
    description: Optional[str] = None
    
    status: SessionStatus = SessionStatus.PENDING
    
    # Scheduling
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_at: Optional[datetime] = None # Immediate if None
    duration_minutes: int = 15 # Initial estimate
    
    # Actual Usage
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    actual_duration_seconds: int = 0
    
    # Cost Calculation
    cost_per_minute: float = 0.0
    total_cost: float = 0.0
    is_paid: bool = False
    
    # Meeting details
    meeting_link: Optional[str] = None # For WebRTC or external
    
    class Settings:
        name = "sessions"

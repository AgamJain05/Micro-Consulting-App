from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from beanie import PydanticObjectId
from app.models.session import SessionStatus
from app.schemas.user import UserResponse

class SessionBase(BaseModel):
    topic: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = 15
    scheduled_at: Optional[datetime] = None

class SessionCreate(SessionBase):
    consultant_id: str

class SessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None
    meeting_link: Optional[str] = None

class SessionResponse(SessionBase):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PydanticObjectId: str}
    )

    # Return id as string (not alias) for frontend compatibility
    id: Optional[str] = Field(default=None)
    client: Optional[UserResponse] = None
    consultant: Optional[UserResponse] = None
    status: SessionStatus
    created_at: datetime

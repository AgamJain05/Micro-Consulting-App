from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from beanie import PydanticObjectId
from app.models.user import UserRole, AvailabilityStatus

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole = UserRole.CLIENT

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to receive via API on update
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    price_per_minute: Optional[float] = None
    free_minutes: Optional[int] = None
    timezone: Optional[str] = None
    status: Optional[AvailabilityStatus] = None
    category: Optional[str] = None
    avatar_url: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Properties to return via API
class UserResponse(UserBase):
    # Pydantic v2 config using ConfigDict
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PydanticObjectId: str}
    )

    # Return both id and _id for compatibility
    id: Optional[str] = Field(default=None)
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    price_per_minute: Optional[float] = None
    free_minutes: int = 15
    status: AvailabilityStatus
    timezone: str
    rating: float = 5.0
    review_count: int = 0
    category: str = "Development"
    avatar_url: Optional[str] = None
    credits: float = 0.0

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from beanie import PydanticObjectId

class ReviewBase(BaseModel):
    rating: int
    comment: str

class ReviewCreate(ReviewBase):
    session_id: str

class ReviewResponse(ReviewBase):
    id: Optional[str] = None
    client_name: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PydanticObjectId: str}
    )


from datetime import datetime
from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from app.models.user import User
from app.models.session import Session

class Review(Document):
    session: Link[Session]
    client: Link[User]
    consultant: Link[User]
    rating: int = Field(ge=1, le=5)
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reviews"


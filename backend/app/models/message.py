from datetime import datetime
from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from app.models.user import User
from app.models.session import Session

class Message(Document):
    session: Link[Session]
    sender: Link[User]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "messages"


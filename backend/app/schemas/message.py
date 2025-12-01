from typing import Any, List
from pydantic import BaseModel
from datetime import datetime

class MessageSchema(BaseModel):
    id: str
    sender_id: str
    content: str
    timestamp: datetime


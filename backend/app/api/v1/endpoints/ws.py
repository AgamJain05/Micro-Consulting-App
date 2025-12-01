from typing import Any, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from beanie import PydanticObjectId
from app.api.v1.websockets import manager
from app.models.message import Message
from app.models.session import Session
from app.models.user import User
import json
from datetime import datetime

router = APIRouter()

@router.websocket("/ws/session/{session_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, user_id: str):
    await manager.connect(websocket, session_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            msg_type = message_data.get("type")
            
            if msg_type in ["offer", "answer", "ice-candidate"]:
                # WebRTC Signaling: Relay to other peer(s)
                await manager.broadcast_to_room(session_id, message_data, exclude_user=user_id)
            
            elif msg_type == "chat":
                text = message_data.get("text")
                timestamp = message_data.get("timestamp", datetime.utcnow().timestamp() * 1000)
                
                # Persist to DB
                try:
                    # We need actual Document objects for Links
                    # This is async inside a loop, might be slow but ensures data integrity
                    session = await Session.get(PydanticObjectId(session_id))
                    user = await User.get(PydanticObjectId(user_id))
                    
                    if session and user:
                        msg_doc = Message(
                            session=session,
                            sender=user,
                            content=text,
                            timestamp=datetime.fromtimestamp(timestamp / 1000.0)
                        )
                        await msg_doc.create()
                except Exception as e:
                    print(f"Error saving message: {e}")

                # Broadcast
                await manager.broadcast_to_room(session_id, {
                    "type": "chat",
                    "userId": user_id,
                    "text": text,
                    "timestamp": timestamp
                }, exclude_user=user_id) 
            
            elif msg_type == "end-session":
                await manager.broadcast_to_room(session_id, {
                    "type": "session-ended",
                    "userId": user_id
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id, user_id)
        await manager.broadcast_to_room(session_id, {
            "type": "user-left",
            "userId": user_id
        })

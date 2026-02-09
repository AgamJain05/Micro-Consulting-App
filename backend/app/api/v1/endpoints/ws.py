from typing import Any, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, WebSocketException, status
from beanie import PydanticObjectId
from jose import JWTError, jwt
from app.api.v1.websockets import manager
from app.models.message import Message
from app.models.session import Session
from app.models.user import User
from app.core.config import settings
from app.core.security import ALGORITHM
import json
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


async def verify_websocket_token(token: Optional[str]) -> Optional[str]:
    """
    Verify JWT token from WebSocket connection.
    Returns user_id if valid, None otherwise.
    """
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None


@router.websocket("/ws/session/{session_id}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    session_id: str, 
    user_id: str,
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for session communication.
    """
    # Token is REQUIRED for authentication (security fix)
    if not token:
        logger.warning(f"[WS] Connection rejected: No token provided for session {session_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    verified_user_id = await verify_websocket_token(token)
    if verified_user_id is None:
        logger.warning(f"[WS] Connection rejected: Invalid token for session {session_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Ensure token user matches URL user
    if verified_user_id != user_id:
        logger.warning(f"[WS] Connection rejected: Token user mismatch for session {session_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Verify user exists and has access to session
    try:
        user = await User.get(PydanticObjectId(user_id))
        session = await Session.get(PydanticObjectId(session_id))
        
        if not user or not session:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verify user is participant in session
        client_id = str(session.client.ref.id) if session.client else None
        consultant_id = str(session.consultant.ref.id) if session.consultant else None
        
        if user_id not in [client_id, consultant_id]:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
    except Exception as e:
        logger.error(f"[WS] Auth error: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Accept connection and add to room
    await manager.connect(websocket, session_id, user_id)
    
    # Notify others that user joined
    await manager.broadcast_to_room(session_id, {
        "type": "user-joined",
        "userId": user_id
    }, exclude_user=user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            msg_type = message_data.get("type")
            
            if msg_type in ["offer", "answer", "ice-candidate"]:
                # WebRTC Signaling: Relay to other peer(s)
                await manager.broadcast_to_room(session_id, message_data, exclude_user=user_id)
            
            elif msg_type == "chat":
                text = message_data.get("text")
                sender_id = message_data.get("userId", user_id)
                timestamp = message_data.get("timestamp", datetime.utcnow().timestamp() * 1000)
                
                # Persist to DB
                try:
                    session_doc = await Session.get(PydanticObjectId(session_id))
                    user_doc = await User.get(PydanticObjectId(user_id))
                    
                    if session_doc and user_doc:
                        msg_doc = Message(
                            session=session_doc,
                            sender=user_doc,
                            content=text,
                            timestamp=datetime.fromtimestamp(timestamp / 1000.0)
                        )
                        await msg_doc.create()
                except Exception as e:
                    logger.error(f"[WS] Error saving message: {e}")

                # Broadcast to OTHER users in the room
                broadcast_msg = {
                    "type": "chat",
                    "userId": user_id,
                    "text": text,
                    "timestamp": timestamp
                }
                await manager.broadcast_to_room(session_id, broadcast_msg, exclude_user=user_id)
            
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

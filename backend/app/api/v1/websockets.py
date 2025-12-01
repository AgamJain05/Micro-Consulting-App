from typing import Dict, List, Any
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # active_connections: {session_id: {user_id: WebSocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # User presence: {user_id: status}
        self.user_presence: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        self.active_connections[session_id][user_id] = websocket
        
        # Notify others in room
        await self.broadcast_to_room(session_id, {
            "type": "user-joined",
            "userId": user_id,
            "count": len(self.active_connections[session_id])
        }, exclude_user=user_id)
        
        logger.info(f"User {user_id} connected to session {session_id}")

    def disconnect(self, session_id: str, user_id: str):
        if session_id in self.active_connections:
            if user_id in self.active_connections[session_id]:
                del self.active_connections[session_id][user_id]
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        
        logger.info(f"User {user_id} disconnected from session {session_id}")

    async def broadcast_to_room(self, session_id: str, message: dict, exclude_user: str = None):
        if session_id in self.active_connections:
            for user_id, connection in self.active_connections[session_id].items():
                if user_id != exclude_user:
                    try:
                        await connection.send_text(json.dumps(message))
                    except Exception as e:
                        logger.error(f"Error sending message to {user_id}: {e}")

manager = ConnectionManager()


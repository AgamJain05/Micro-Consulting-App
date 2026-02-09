"""
Config Endpoints - Expose client-side configuration
"""
from typing import Any, Dict
from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User
from app.services.webrtc_service import webrtc_service

router = APIRouter()


@router.get("/webrtc", response_model=Dict[str, Any])
async def get_webrtc_config(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get WebRTC configuration including ICE servers.
    Requires authentication to prevent abuse of TURN credentials.
    """
    return webrtc_service.get_rtc_configuration()


@router.get("/ice-servers")
async def get_ice_servers(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get ICE servers list for WebRTC.
    """
    return {"iceServers": webrtc_service.get_ice_servers()}

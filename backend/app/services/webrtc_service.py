"""
WebRTC Service - Configuration for ICE servers including TURN
"""
from typing import List, Dict
from app.core.config import settings


class WebRTCService:
    """Service for WebRTC configuration"""
    
    @staticmethod
    def get_ice_servers() -> List[Dict]:
        """
        Get ICE servers configuration for WebRTC.
        Includes STUN and TURN servers if configured.
        """
        servers = [
            # Google's public STUN server
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
        ]
        
        # Add TURN server if configured
        if settings.TURN_SERVER_URL:
            turn_config = {
                "urls": settings.TURN_SERVER_URL,
            }
            
            if settings.TURN_SERVER_USERNAME:
                turn_config["username"] = settings.TURN_SERVER_USERNAME
            
            if settings.TURN_SERVER_CREDENTIAL:
                turn_config["credential"] = settings.TURN_SERVER_CREDENTIAL
            
            servers.append(turn_config)
            
            # Also add TURNS (TURN over TLS) if it's a turn: URL
            if settings.TURN_SERVER_URL.startswith("turn:"):
                turns_url = settings.TURN_SERVER_URL.replace("turn:", "turns:", 1)
                turns_config = turn_config.copy()
                turns_config["urls"] = turns_url
                servers.append(turns_config)
        
        return servers
    
    @staticmethod
    def get_rtc_configuration() -> Dict:
        """Get full RTCPeerConnection configuration"""
        return {
            "iceServers": WebRTCService.get_ice_servers(),
            "iceCandidatePoolSize": 10,
        }


# Singleton instance
webrtc_service = WebRTCService()

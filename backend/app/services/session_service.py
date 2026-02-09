"""
Session Service - Business logic for session management
"""
from typing import List, Optional
from datetime import datetime
from beanie import PydanticObjectId
from beanie.operators import Or, In

from app.models.session import Session, SessionStatus
from app.models.user import User, AvailabilityStatus


class SessionService:
    """Service class for session-related business logic"""
    
    @staticmethod
    async def get_user_sessions(
        user: User,
        status: Optional[SessionStatus] = None,
        limit: int = 100
    ) -> List[Session]:
        """
        Efficiently fetch sessions for a user using database queries
        instead of fetching all and filtering in Python.
        """
        # Build query using Beanie's Or operator for linked documents
        query = Session.find(
            Or(
                {"client.$id": user.id},
                {"consultant.$id": user.id}
            )
        ).sort("-created_at").limit(limit)
        
        if status:
            query = query.find(Session.status == status)
        
        sessions = await query.to_list()
        
        # Populate linked users
        for session in sessions:
            await SessionService._populate_session_users(session)
        
        return sessions
    
    @staticmethod
    async def get_session_by_id(session_id: str, user: Optional[User] = None) -> Optional[Session]:
        """Get a session by ID with optional authorization check"""
        session = await Session.get(PydanticObjectId(session_id))
        if not session:
            return None
        
        await SessionService._populate_session_users(session)
        
        # Check authorization if user provided
        if user:
            client_id = session.client.id if hasattr(session.client, 'id') else None
            consultant_id = session.consultant.id if hasattr(session.consultant, 'id') else None
            
            if user.id != client_id and user.id != consultant_id:
                return None
        
        return session
    
    @staticmethod
    async def create_session(
        client: User,
        consultant: User,
        topic: str,
        description: Optional[str] = None,
        duration_minutes: int = 15,
        scheduled_at: Optional[datetime] = None
    ) -> Session:
        """Create a new session request"""
        session = Session(
            client=client,
            consultant=consultant,
            topic=topic,
            description=description,
            duration_minutes=duration_minutes,
            scheduled_at=scheduled_at,
            status=SessionStatus.PENDING,
            cost_per_minute=consultant.price_per_minute or 0
        )
        await session.create()
        
        # Populate for response
        session.client = client
        session.consultant = consultant
        
        return session
    
    @staticmethod
    async def accept_session(session: Session, consultant: User) -> Session:
        """Accept a session (consultant only)"""
        if session.consultant.id != consultant.id:
            raise PermissionError("Only the consultant can accept this session")
        
        if session.status != SessionStatus.PENDING:
            raise ValueError("Session is not pending")
        
        session.status = SessionStatus.ACCEPTED
        await session.save()
        return session
    
    @staticmethod
    async def reject_session(session: Session, consultant: User) -> Session:
        """Reject a session (consultant only)"""
        if session.consultant.id != consultant.id:
            raise PermissionError("Only the consultant can reject this session")
        
        session.status = SessionStatus.REJECTED
        await session.save()
        return session
    
    @staticmethod
    async def start_video_session(session: Session, user: User) -> Session:
        """Start video for a session"""
        client_id = session.client.id
        consultant_id = session.consultant.id
        
        if user.id != client_id and user.id != consultant_id:
            raise PermissionError("Not authorized")
        
        if session.status not in [SessionStatus.ACCEPTED, SessionStatus.ACTIVE]:
            raise ValueError("Session must be accepted first")
        
        # Credit check for client
        if user.id == client_id:
            consultant_rate = session.consultant.price_per_minute or 0
            if consultant_rate > 0 and user.credits < consultant_rate:
                raise ValueError(f"Insufficient credits. Rate is ${consultant_rate}/min. You have ${user.credits}.")
        
        session.status = SessionStatus.ACTIVE
        session.actual_start_time = datetime.utcnow()
        
        # Mark consultant as busy
        if isinstance(session.consultant, User):
            session.consultant.status = AvailabilityStatus.BUSY
            await session.consultant.save()
        
        await session.save()
        return session
    
    @staticmethod
    async def complete_session(session: Session, user: User) -> Session:
        """Complete a session and handle billing"""
        client_id = session.client.id
        consultant_id = session.consultant.id
        
        if user.id != client_id and user.id != consultant_id:
            raise PermissionError("Not authorized")
        
        session.status = SessionStatus.COMPLETED
        session.actual_end_time = datetime.utcnow()
        
        # Calculate cost and transfer credits
        if session.actual_start_time:
            duration_seconds = (session.actual_end_time - session.actual_start_time).total_seconds()
            duration_minutes = duration_seconds / 60.0
            
            rate = session.consultant.price_per_minute or 0
            cost = rate * duration_minutes
            
            # Deduct from client
            client = session.client
            client.credits -= cost
            await client.save()
            
            # Add to consultant
            consultant = session.consultant
            consultant.credits += cost
            consultant.status = AvailabilityStatus.ONLINE
            await consultant.save()
            
            session.total_cost = cost
            session.is_paid = True
            session.actual_duration_seconds = int(duration_seconds)
        
        await session.save()
        return session
    
    @staticmethod
    async def cancel_session(session: Session, user: User) -> Session:
        """Cancel a session"""
        client_id = session.client.id
        consultant_id = session.consultant.id
        
        if user.id != client_id and user.id != consultant_id:
            raise PermissionError("Not authorized to cancel")
        
        session.status = SessionStatus.CANCELLED
        
        # Make consultant available again if they were busy
        if isinstance(session.consultant, User) and session.consultant.status == AvailabilityStatus.BUSY:
            session.consultant.status = AvailabilityStatus.ONLINE
            await session.consultant.save()
        
        await session.save()
        return session
    
    @staticmethod
    async def _populate_session_users(session: Session) -> Session:
        """Manually fetch and populate client and consultant for a session"""
        from beanie import Link
        
        if isinstance(session.client, Link) and session.client.ref:
            client = await User.get(session.client.ref.id)
            if client:
                session.client = client
        
        if isinstance(session.consultant, Link) and session.consultant.ref:
            consultant = await User.get(session.consultant.ref.id)
            if consultant:
                session.consultant = consultant
        
        return session


# Singleton instance
session_service = SessionService()

from typing import Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId, Link
from beanie.operators import Or
from app.models.session import Session, SessionStatus
from app.models.user import User, AvailabilityStatus
from app.models.message import Message
from app.schemas.session import SessionCreate, SessionResponse, SessionUpdate
from app.schemas.message import MessageSchema
from app.api import deps

router = APIRouter()

async def manual_fetch_session_users(session: Session) -> Session:
    """
    Manually fetch client and consultant for a session to avoid fetch_links() issues.
    Returns the session object with populated fields (hacky for Pydantic serialization).
    """
    # Check if client is already fetched (it might be if we just created it)
    if isinstance(session.client, Link) and session.client.ref:
        client_id = session.client.ref.id
        client = await User.get(client_id)
        if client:
            session.client = client

    if isinstance(session.consultant, Link) and session.consultant.ref:
        consultant_id = session.consultant.ref.id
        consultant = await User.get(consultant_id)
        if consultant:
            session.consultant = consultant

    return session

@router.post("/", response_model=SessionResponse)
async def request_session(
    session_in: SessionCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    consultant = await User.get(PydanticObjectId(session_in.consultant_id))
        
    if not consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")
    
    if consultant.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot request session with yourself")

    session = Session(
        client=current_user,
        consultant=consultant,
        topic=session_in.topic,
        description=session_in.description,
        duration_minutes=session_in.duration_minutes or 15,
        scheduled_at=session_in.scheduled_at,
        status=SessionStatus.PENDING
    )
    
    await session.create()
    
    # Populate for response
    session.client = current_user
    session.consultant = consultant
    return session

@router.post("/{session_id}/accept", response_model=SessionResponse)
async def accept_session(
    session_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    session = await Session.get(PydanticObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await manual_fetch_session_users(session)
    
    if session.consultant.id != current_user.id:
        raise HTTPException(status_code=403, detail="Only consultant can accept session")
        
    if session.status != SessionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Session is not pending")
        
    session.status = SessionStatus.ACCEPTED
    await session.save()
    return session

@router.post("/{session_id}/reject", response_model=SessionResponse)
async def reject_session(
    session_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    session = await Session.get(PydanticObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await manual_fetch_session_users(session)
        
    if session.consultant.id != current_user.id:
        raise HTTPException(status_code=403, detail="Only consultant can reject session")
        
    session.status = SessionStatus.REJECTED
    await session.save()
    return session

@router.post("/{session_id}/start_video", response_model=SessionResponse)
async def start_session_video(
    session_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    session = await Session.get(PydanticObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await manual_fetch_session_users(session)
    
    client_id = session.client.id
    consultant_id = session.consultant.id

    if client_id != current_user.id and consultant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Only start if Accepted or Active (re-joining)
    if session.status != SessionStatus.ACCEPTED and session.status != SessionStatus.ACTIVE:
         raise HTTPException(status_code=400, detail="Session must be accepted first")

    if client_id == current_user.id:
        consultant_rate = session.consultant.price_per_minute or 0
        required_credits = consultant_rate * 1
        
        if current_user.credits < required_credits:
             raise HTTPException(status_code=402, detail=f"Insufficient credits. Rate is ${consultant_rate}/min. You have ${current_user.credits}.")
    
    session.status = SessionStatus.ACTIVE
    session.actual_start_time = datetime.utcnow()
    
    # Mark consultant as BUSY
    if isinstance(session.consultant, User):
        session.consultant.status = AvailabilityStatus.BUSY
        await session.consultant.save()

    await session.save()
    return session

@router.get("/", response_model=List[SessionResponse])
async def get_my_sessions(
    current_user: User = Depends(deps.get_current_user),
    status: SessionStatus = None
) -> Any:
    # DEBUG: Print current user ID
    print(f"Fetching sessions for User: {current_user.id} ({current_user.email})")
    
    # Fallback: Fetch ALL sessions and filter in Python to guarantee finding them
    # This helps debug if it's a query issue or data issue
    all_sessions = await Session.find_all().sort("-created_at").to_list()
    
    user_sessions = []
    for s in all_sessions:
        # Manually check IDs
        # session.client is Link, so check .ref.id
        c_id = s.client.ref.id if s.client and s.client.ref else None
        cons_id = s.consultant.ref.id if s.consultant and s.consultant.ref else None
        
        if c_id == current_user.id or cons_id == current_user.id:
            await manual_fetch_session_users(s)
            user_sessions.append(s)
            
    if status:
        user_sessions = [s for s in user_sessions if s.status == status]
        
    print(f"Found {len(user_sessions)} sessions for user.")
    return user_sessions

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    session = await Session.get(PydanticObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await manual_fetch_session_users(session)
    
    if session.client.id != current_user.id and session.consultant.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
    return session

@router.get("/{session_id}/messages", response_model=List[MessageSchema])
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    session = await Session.get(PydanticObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Check auth
    c_id = session.client.ref.id if session.client.ref else session.client.id
    cons_id = session.consultant.ref.id if session.consultant.ref else session.consultant.id
    
    if c_id != current_user.id and cons_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    messages = await Message.find(Message.session.id == session.id).sort("timestamp").to_list()
    
    # Transform to schema
    return [
        MessageSchema(
            id=str(m.id),
            sender_id=str(m.sender.ref.id),
            content=m.content,
            timestamp=m.timestamp
        ) for m in messages
    ]

@router.patch("/{session_id}/status", response_model=SessionResponse)
async def update_session_status(
    session_id: str,
    status_update: SessionUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    session = await Session.get(PydanticObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await manual_fetch_session_users(session)

    new_status = status_update.status
    if new_status:
        if new_status in [SessionStatus.ACCEPTED, SessionStatus.REJECTED]:
            if session.consultant.id != current_user.id:
                raise HTTPException(status_code=403, detail="Only consultant can accept/reject")
        
        if new_status == SessionStatus.CANCELLED:
             if session.client.id != current_user.id and session.consultant.id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to cancel")

        session.status = new_status
        
        # When session ends (Completed or Cancelled), make consultant ONLINE again
        if new_status in [SessionStatus.COMPLETED, SessionStatus.CANCELLED]:
            if isinstance(session.consultant, User):
                session.consultant.status = AvailabilityStatus.ONLINE
                await session.consultant.save()
        
        if new_status == SessionStatus.COMPLETED:
            session.actual_end_time = datetime.utcnow()
            if session.actual_start_time:
                duration_seconds = (session.actual_end_time - session.actual_start_time).total_seconds()
                duration_minutes = duration_seconds / 60.0
                
                rate = session.consultant.price_per_minute or 0
                cost = rate * duration_minutes
                
                # Deduct
                client = session.client
                client.credits -= cost
                await client.save()
                
                consultant = session.consultant
                consultant.credits += cost
                await consultant.save()
                
                session.total_cost = cost
                session.is_paid = True
            
    await session.save()
    return session

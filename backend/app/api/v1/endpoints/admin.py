"""
Admin Endpoints - Platform administration
"""
from typing import Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from beanie import PydanticObjectId
from pydantic import BaseModel

from app.models.user import User, UserRole, AvailabilityStatus
from app.models.session import Session, SessionStatus
from app.models.review import Review
from app.api import deps

router = APIRouter()


# --- Pydantic Models for Admin ---

class AdminUserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    status: str
    credits: float
    rating: float
    review_count: int
    created_at: datetime
    is_active: bool = True


class PlatformStats(BaseModel):
    total_users: int
    total_clients: int
    total_consultants: int
    total_sessions: int
    completed_sessions: int
    active_sessions: int
    pending_sessions: int
    total_revenue: float
    total_reviews: int
    avg_rating: float
    users_today: int
    sessions_today: int


class UserActionRequest(BaseModel):
    action: str  # 'ban', 'unban', 'verify', 'unverify', 'adjust_credits'
    value: Optional[float] = None  # For credit adjustments


# --- Helper Functions ---

async def verify_admin(current_user: User = Depends(deps.get_current_user)) -> User:
    """Verify user has admin privileges"""
    # Check for admin role
    if current_user.role == UserRole.ADMIN:
        return current_user
    
    # Also check for specific admin emails (bootstrap admin)
    admin_emails = ["admin@microconsult.com"]
    if current_user.email in admin_emails:
        return current_user
    
    raise HTTPException(
        status_code=403,
        detail="Admin privileges required"
    )


# --- Endpoints ---

@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    admin: User = Depends(verify_admin)
) -> Any:
    """Get platform-wide statistics"""
    
    # User stats
    total_users = await User.count()
    total_clients = await User.find(User.role == UserRole.CLIENT).count()
    total_consultants = await User.find(User.role == UserRole.CONSULTANT).count()
    
    # Session stats
    total_sessions = await Session.count()
    completed_sessions = await Session.find(Session.status == SessionStatus.COMPLETED).count()
    active_sessions = await Session.find(Session.status == SessionStatus.ACTIVE).count()
    pending_sessions = await Session.find(Session.status == SessionStatus.PENDING).count()
    
    # Revenue (sum of all completed session costs)
    completed = await Session.find(Session.status == SessionStatus.COMPLETED).to_list()
    total_revenue = sum(s.total_cost for s in completed if s.total_cost)
    
    # Review stats
    reviews = await Review.find_all().to_list()
    total_reviews = len(reviews)
    avg_rating = sum(r.rating for r in reviews) / total_reviews if total_reviews > 0 else 5.0
    
    # Today's stats
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    users_today = await User.find(User.created_at >= today_start).count()
    sessions_today = await Session.find(Session.created_at >= today_start).count()
    
    return PlatformStats(
        total_users=total_users,
        total_clients=total_clients,
        total_consultants=total_consultants,
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        active_sessions=active_sessions,
        pending_sessions=pending_sessions,
        total_revenue=total_revenue,
        total_reviews=total_reviews,
        avg_rating=round(avg_rating, 2),
        users_today=users_today,
        sessions_today=sessions_today
    )


@router.get("/users", response_model=List[AdminUserResponse])
async def list_all_users(
    admin: User = Depends(verify_admin),
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> Any:
    """List all users with optional filtering"""
    
    query = User.find()
    
    if role:
        query = query.find(User.role == role)
    
    if search:
        query = query.find({
            "$or": [
                {"email": {"$regex": search, "$options": "i"}},
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}}
            ]
        })
    
    users = await query.sort("-created_at").skip(skip).limit(limit).to_list()
    
    return [
        AdminUserResponse(
            id=str(u.id),
            email=u.email,
            first_name=u.first_name,
            last_name=u.last_name,
            role=u.role.value,
            status=u.status.value,
            credits=u.credits,
            rating=u.rating,
            review_count=u.review_count,
            created_at=u.created_at,
            is_active=getattr(u, 'is_active', True)
        )
        for u in users
    ]


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin: User = Depends(verify_admin)
) -> Any:
    """Get detailed info about a specific user"""
    
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's sessions
    sessions = await Session.find({
        "$or": [
            {"client.$id": user.id},
            {"consultant.$id": user.id}
        ]
    }).sort("-created_at").limit(20).to_list()
    
    # Get user's reviews (given or received)
    reviews_given = await Review.find({"client.$id": user.id}).count()
    reviews_received = await Review.find({"consultant.$id": user.id}).count() if user.role == UserRole.CONSULTANT else 0
    
    return {
        "user": AdminUserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role.value,
            status=user.status.value,
            credits=user.credits,
            rating=user.rating,
            review_count=user.review_count,
            created_at=user.created_at,
            is_active=getattr(user, 'is_active', True)
        ),
        "session_count": len(sessions),
        "reviews_given": reviews_given,
        "reviews_received": reviews_received,
        "recent_sessions": [
            {
                "id": str(s.id),
                "topic": s.topic,
                "status": s.status.value,
                "created_at": s.created_at,
                "total_cost": s.total_cost
            }
            for s in sessions[:10]
        ]
    }


@router.post("/users/{user_id}/action")
async def perform_user_action(
    user_id: str,
    action_request: UserActionRequest,
    admin: User = Depends(verify_admin)
) -> Any:
    """Perform admin action on a user"""
    
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    action = action_request.action
    
    if action == "adjust_credits":
        if action_request.value is None:
            raise HTTPException(status_code=400, detail="Value required for credit adjustment")
        user.credits += action_request.value
        await user.save()
        return {"message": f"Credits adjusted by {action_request.value}. New balance: {user.credits}"}
    
    elif action == "set_offline":
        user.status = AvailabilityStatus.OFFLINE
        await user.save()
        return {"message": "User set to offline"}
    
    elif action == "activate":
        user.is_active = True
        await user.save()
        return {"message": "User activated"}
    
    elif action == "deactivate":
        user.is_active = False
        await user.save()
        return {"message": "User deactivated"}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@router.get("/sessions")
async def list_all_sessions(
    admin: User = Depends(verify_admin),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> Any:
    """List all sessions with optional filtering"""
    
    query = Session.find()
    
    if status:
        query = query.find(Session.status == status)
    
    sessions = await query.sort("-created_at").skip(skip).limit(limit).to_list()
    
    result = []
    for s in sessions:
        # Get client and consultant names
        client = await User.get(s.client.ref.id) if s.client.ref else None
        consultant = await User.get(s.consultant.ref.id) if s.consultant.ref else None
        
        result.append({
            "id": str(s.id),
            "client_name": f"{client.first_name} {client.last_name}" if client else "Unknown",
            "consultant_name": f"{consultant.first_name} {consultant.last_name}" if consultant else "Unknown",
            "topic": s.topic,
            "status": s.status.value,
            "created_at": s.created_at,
            "total_cost": s.total_cost,
            "duration_minutes": s.actual_duration_seconds // 60 if s.actual_duration_seconds else 0
        })
    
    return result


@router.get("/analytics/revenue")
async def get_revenue_analytics(
    admin: User = Depends(verify_admin),
    days: int = Query(default=30, le=365)
) -> Any:
    """Get revenue analytics for the past N days"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    sessions = await Session.find(
        Session.status == SessionStatus.COMPLETED,
        Session.created_at >= start_date
    ).sort("created_at").to_list()
    
    # Group by day
    daily_revenue = {}
    for s in sessions:
        day = s.created_at.strftime("%Y-%m-%d")
        daily_revenue[day] = daily_revenue.get(day, 0) + (s.total_cost or 0)
    
    return {
        "period_days": days,
        "total_revenue": sum(daily_revenue.values()),
        "session_count": len(sessions),
        "daily_breakdown": [
            {"date": date, "revenue": revenue}
            for date, revenue in sorted(daily_revenue.items())
        ]
    }


@router.get("/analytics/users")
async def get_user_analytics(
    admin: User = Depends(verify_admin),
    days: int = Query(default=30, le=365)
) -> Any:
    """Get user registration analytics"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    users = await User.find(User.created_at >= start_date).sort("created_at").to_list()
    
    # Group by day
    daily_signups = {}
    for u in users:
        day = u.created_at.strftime("%Y-%m-%d")
        daily_signups[day] = daily_signups.get(day, 0) + 1
    
    # Count by role
    clients = sum(1 for u in users if u.role == UserRole.CLIENT)
    consultants = sum(1 for u in users if u.role == UserRole.CONSULTANT)
    
    return {
        "period_days": days,
        "total_new_users": len(users),
        "new_clients": clients,
        "new_consultants": consultants,
        "daily_breakdown": [
            {"date": date, "signups": count}
            for date, count in sorted(daily_signups.items())
        ]
    }

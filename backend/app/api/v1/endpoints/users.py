from typing import List, Optional, Any
import re
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate
from app.api import deps

router = APIRouter()

def user_to_response(user: User) -> dict:
    """Convert Beanie User document to response dict with proper id serialization."""
    user_dict = user.model_dump()
    user_dict["id"] = str(user.id)
    return user_dict

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Update fields
    if user_in.first_name:
        current_user.first_name = user_in.first_name
    if user_in.last_name:
        current_user.last_name = user_in.last_name
    if user_in.headline:
        current_user.headline = user_in.headline
    if user_in.bio:
        current_user.bio = user_in.bio
    if user_in.skills is not None:
        current_user.skills = user_in.skills
    if user_in.price_per_minute is not None:
        current_user.price_per_minute = user_in.price_per_minute
    if user_in.timezone:
        current_user.timezone = user_in.timezone
    if user_in.status:
        current_user.status = user_in.status
        
    await current_user.save()
    return user_to_response(current_user)

@router.post("/topup", response_model=UserResponse)
async def topup_credits(
    amount: float = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    current_user.credits += amount
    await current_user.save()
    return user_to_response(current_user)

@router.get("/consultants", response_model=List[UserResponse])
async def search_consultants(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    skills: Optional[List[str]] = Query(None),
    category: Optional[str] = None,
) -> Any:
    query = User.find(User.role == UserRole.CONSULTANT)
    
    if category and category != "All":
        query = query.find(User.category == category)
    
    if search:
        # Simple regex search for name or headline
        # Use re.escape to prevent regex injection/errors
        safe_search = re.escape(search)
        query = query.find({
            "$or": [
                {"first_name": {"$regex": safe_search, "$options": "i"}},
                {"last_name": {"$regex": safe_search, "$options": "i"}},
                {"headline": {"$regex": safe_search, "$options": "i"}},
                {"skills": {"$in": [search]}} # Keep original for exact match in array
            ]
        })
        
    if skills:
        query = query.find({"skills": {"$all": skills}})
        
    users = await query.skip(skip).limit(limit).to_list()
    return [user_to_response(u) for u in users]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str) -> Any:
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_response(user)

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.core import security
from app.api import deps

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate) -> Any:
    # Check if email already exists
    existing_user_email = await User.find_one(User.email == user_in.email)
    if existing_user_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already taken",
        )
    
    user_data = user_in.model_dump(exclude={"password"})
    user_data["hashed_password"] = security.get_password_hash(user_in.password)
    
    user = User(**user_data)
    await user.create()
    
    # Convert Beanie document to dict and ensure id is a string
    user_dict = user.model_dump()
    user_dict["id"] = str(user.id)
    return user_dict

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    # OAuth2PasswordRequestForm expects username, but we use email
    user = await User.find_one(User.email == form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    return {
        "access_token": security.create_access_token(user.id),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(deps.get_current_user)) -> Any:
    # Convert Beanie document to dict and ensure id is a string
    user_dict = current_user.model_dump()
    user_dict["id"] = str(current_user.id)  # Explicitly convert ObjectId to string
    return user_dict


from typing import Any
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from itsdangerous import URLSafeTimedSerializer
import secrets

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.core import security
from app.api import deps
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# CSRF state serializer
serializer = URLSafeTimedSerializer(settings.SECRET_KEY)

def create_state_token() -> str:
    """Generate CSRF state token"""
    return serializer.dumps(secrets.token_urlsafe(32))

def verify_state_token(token: str, max_age: int = 600) -> bool:
    """Verify CSRF state token (10 min expiry)"""
    try:
        serializer.loads(token, max_age=max_age)
        return True
    except:
        return False

def create_temp_token(user_info: dict) -> str:
    """Create temporary token for role selection (5 min expiry)"""
    return serializer.dumps(user_info, salt='role-selection')

def verify_temp_token(token: str) -> dict:
    """Verify and extract user info from temp token"""
    try:
        return serializer.loads(token, salt='role-selection', max_age=300)
    except:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

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

# Google OAuth Endpoints

@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth flow with CSRF protection"""
    # Generate and store CSRF state
    state = create_state_token()
    
    # Redirect to Google OAuth
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(
        request, 
        redirect_uri,
        state=state
    )

@router.get("/google/callback")
async def google_callback(request: Request, response: Response):
    """
    Handle Google OAuth callback
    ✅ Validates CSRF state
    ✅ Redirects to frontend (not JSON)
    ✅ Uses HTTP-only cookies
    """
    # Verify CSRF state
    state = request.query_params.get('state')
    if not state or not verify_state_token(state):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=invalid_state"
        )
    
    try:
        # Exchange code for token
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info or not user_info.get('email'):
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=no_email"
            )
        
        # Check if user exists by OAuth ID (more secure than email)
        user = await User.find_one(
            User.oauth_provider == "google",
            User.oauth_id == user_info['sub']
        )
        
        if user:
            # ✅ Existing user - Set HTTP-only cookie and redirect to callback
            access_token = security.create_access_token(user.id)
            
            # Redirect to frontend callback route to populate auth store
            redirect_url = f"{settings.FRONTEND_URL}/auth/callback?success=true"
            
            redirect_response = RedirectResponse(url=redirect_url)
            redirect_response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=settings.is_production,  # HTTPS only in production
                samesite="lax",
                max_age=86400 * 7  # 7 days
            )
            return redirect_response
        
        else:
            # ✅ New user - Redirect to role selection with temp token
            temp_token = create_temp_token(user_info)
            
            redirect_response = RedirectResponse(
                url=f"{settings.FRONTEND_URL}/auth/select-role?token={temp_token}"
            )
            return redirect_response
            
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=oauth_failed"
        )

@router.post("/google/complete")
async def complete_google_signup(
    request: Request,
    response: Response,
):
    """
    Complete Google signup with role selection
    ✅ Validates role enum
    ✅ Enforces unique OAuth ID
    ✅ Returns HTTP-only cookie
    """
    # Parse JSON body
    body = await request.json()
    role = body.get('role')
    temp_token = body.get('temp_token')
    
    if not role or not temp_token:
        raise HTTPException(status_code=400, detail="Missing role or temp_token")
    
    # Validate role
    try:
        role = UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Verify temp token
    user_info = verify_temp_token(temp_token)
    
    # Check if user already exists (race condition protection)
    existing = await User.find_one(
        User.oauth_provider == "google",
        User.oauth_id == user_info['sub']
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    user = User(
        email=user_info['email'],
        first_name=user_info.get('given_name', ''),
        last_name=user_info.get('family_name', ''),
        avatar_url=user_info.get('picture'),
        role=role,  # ✅ Enum ensures only "client" or "consultant"
        oauth_provider='google',
        oauth_id=user_info['sub'],  # ✅ Unique constraint in DB
        is_verified=True,  # Google emails are pre-verified
        hashed_password="",  # OAuth users don't have password
        credits=50.0 if role == UserRole.CLIENT else 0.0
    )
    
    try:
        await user.insert()
    except Exception as e:
        # Handle duplicate OAuth ID
        if "duplicate" in str(e).lower():
            raise HTTPException(status_code=400, detail="Account already exists")
        raise
    
    # Generate access token
    access_token = security.create_access_token(user.id)
    
    # ✅ Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=86400 * 7
    )
    
    # Convert user to dict
    user_dict = user.model_dump()
    user_dict["id"] = str(user.id)
    
    return {
        "user": user_dict,
        "token": access_token,  # ✅ Include token in response for frontend
        "message": "Account created successfully"
    }

@router.post("/logout")
async def logout(response: Response):
    """Clear authentication cookie"""
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

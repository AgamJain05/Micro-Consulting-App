from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, sessions, ws, reviews, config, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(config.router, prefix="/config", tags=["config"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(ws.router, tags=["websockets"])

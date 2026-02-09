import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.db.mongodb import init_db
from app.api.v1.api import api_router
from contextlib import asynccontextmanager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Debug: Print registered routes on startup
    print("--- Registered Routes ---")
    for route in app.routes:
        if hasattr(route, "path"):
            methods = getattr(route, "methods", None)
            if methods:
                print(f"{route.path} [{','.join(methods)}]")
            else:
                print(f"{route.path} [WebSocket]")
    print("-------------------------")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # Security headers to protect against common vulnerabilities
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # HSTS in production (enforce HTTPS)
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Custom error handler - secure for production
@app.exception_handler(Exception)
async def validation_exception_handler(request: Request, exc: Exception):
    # Log detailed error server-side with full traceback
    logger.error(f"Global exception: {exc}", exc_info=True)
    
    # Include CORS headers in error responses
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in origins or ("*" in origins and settings.ENVIRONMENT == "development"):
        headers = {
            "Access-Control-Allow-Origin": origin or "*",
            "Access-Control-Allow-Credentials": "true",
        }
    
    # Return generic message in production, detailed in development
    if settings.is_production:
        error_message = "An internal error occurred. Please try again later."
    else:
        error_message = f"Internal Server Error: {str(exc)}"
    
    return JSONResponse(
        status_code=500,
        content={"message": error_message},
        headers=headers,
    )

# CORS Configuration - Use allowed origins from settings
origins = settings.BACKEND_CORS_ORIGINS
if settings.ENVIRONMENT == "development":
    # In development, also allow localhost variations
    origins = list(set(origins + ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]))

logger.info(f"Configuring CORS with origins: {origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # Specific methods only
    allow_headers=["Authorization", "Content-Type", "Accept"],  # Specific headers only
    max_age=600,  # Cache preflight requests for 10 minutes
)

# CRITICAL FIX: Include the API router so endpoints are registered
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to Micro Consulting Marketplace API"}

import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import init_db
from app.api.v1.api import api_router
from contextlib import asynccontextmanager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Custom error handler for debugging
@app.exception_handler(Exception)
async def validation_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal Server Error: {exc}"},
    )

if settings.BACKEND_CORS_ORIGINS:
    # Print origins for debugging
    print(f"Configuring CORS with origins: {settings.BACKEND_CORS_ORIGINS}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # TEMPORARY: Allow all to rule out origin mismatch
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# CRITICAL FIX: Include the API router so endpoints are registered
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to Micro Consulting Marketplace API"}

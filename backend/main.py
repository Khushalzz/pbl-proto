from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import UPLOAD_DIR
from routers import (
    admin_routes,
    analytics_routes,
    auth_routes,
    engineer_routes,
    issue_routes,
    notification_routes,
    officer_routes,
    verification_routes,
)
from seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed database if empty
    print("[Startup] Initializing CivicLens Backend Services...")
    seed_database()
    yield
    print("[Shutdown] CivicLens Backend Services stopped.")

app = FastAPI(
    title="CivicLens API",
    description="AI-Powered Community-Based Urban Issue Reporting and Intelligent Prioritization System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads (FR-007, TC-06)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth_routes.router)
app.include_router(issue_routes.router)
app.include_router(verification_routes.router)
app.include_router(officer_routes.router)
app.include_router(engineer_routes.router)
app.include_router(analytics_routes.router)
app.include_router(admin_routes.router)
app.include_router(notification_routes.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CivicLens Backend",
        "version": "1.0.0",
        "framework": "FastAPI"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

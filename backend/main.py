from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import os
import logging
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Configure logging to show all our performance logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This ensures logs go to console
    ]
)

from routes import auth, upload, chat, enterprise, analytics
from db.mongodb_client import init_db

app = FastAPI(title="Multi-Tenant RAG Agent", version="1.0.0")

# CORS middleware
def get_cors_origins():
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    if cors_origins:
        # Split by comma and strip whitespace and quotes
        origins = [origin.strip().strip('"').strip("'") for origin in cors_origins.split(",")]
        # Filter out empty strings
        origins = [origin for origin in origins if origin]
        print(f"🌐 CORS Origins configured: {origins}")
        return origins
    return ["*"]

cors_origins = get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

print(f"🚀 FastAPI server starting with CORS origins: {cors_origins}")

# Initialize database and services
@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization warning: {e}")
        # Don't fail startup for database connection issues
    
    # Initialize Pinecone client once at startup
    try:
        from db.pinecone_client import pinecone_client
        pinecone_client.initialize()
        print("✅ Pinecone client initialized successfully")
    except Exception as e:
        print(f"⚠️ Pinecone initialization warning: {e}")
        # Don't fail startup for Pinecone connection issues

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(enterprise.router, prefix="/api/enterprise", tags=["Enterprise"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    return {"message": "Multi-Tenant RAG Agent API", "version": "1.0.1"}

@app.get("/health")
async def health_check():
    try:
        # Basic health check
        return {
            "status": "healthy",
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "production")
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
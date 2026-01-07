#!/bin/bash

# Render startup script for Enterprise RAG Backend

echo "🚀 Starting Enterprise RAG Backend on Render..."

# Set default port if not provided
export PORT=${PORT:-10000}

echo "📡 Port: $PORT"
echo "🌍 Environment: Production"

# Start the application with uvicorn
echo "🎯 Starting FastAPI application..."
exec uvicorn main:app \
    --host 0.0.0.0 \
    --port $PORT \
    --workers 1 \
    --log-level info \
    --access-log
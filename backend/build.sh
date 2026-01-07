#!/bin/bash

# Render build script for Enterprise RAG Backend
set -o errexit  # Exit on error

echo "🔧 Starting build process..."

# Upgrade pip and install build tools
echo "📦 Upgrading pip and installing build tools..."
python -m pip install --upgrade pip setuptools wheel

# Install dependencies with timeout and retry
echo "📚 Installing Python dependencies..."
pip install --no-cache-dir --timeout 300 -r requirements.txt

# Verify deployment
echo "🔍 Verifying deployment..."
python verify_deployment.py

echo "✅ Build completed successfully!"
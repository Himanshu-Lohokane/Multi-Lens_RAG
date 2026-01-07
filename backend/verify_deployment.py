#!/usr/bin/env python3
"""
Deployment verification script for Enterprise RAG Backend
"""

import sys
import os
from dotenv import load_dotenv

def verify_environment():
    """Verify all required environment variables are set"""
    load_dotenv()
    
    required_vars = [
        'MONGODB_URL',
        'PINECONE_API_KEY', 
        'PINECONE_HOST',
        'GOOGLE_API_KEY',
        'SECRET_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ All required environment variables are set")
    return True

def verify_imports():
    """Verify all critical imports work"""
    try:
        import fastapi
        import uvicorn
        import pymongo
        import pinecone
        import langchain
        import google.generativeai
        import email_validator  # Required for pydantic EmailStr
        from pydantic import EmailStr  # Test EmailStr import
        print("✅ All critical imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def main():
    print("🔍 Verifying deployment...")
    
    if not verify_imports():
        sys.exit(1)
    
    if not verify_environment():
        print("⚠️  Some environment variables are missing, but deployment can continue")
    
    print("✅ Deployment verification completed")

if __name__ == "__main__":
    main()
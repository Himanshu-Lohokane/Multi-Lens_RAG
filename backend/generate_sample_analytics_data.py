#!/usr/bin/env python3
"""
Generate sample analytics data for demonstration
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
import random
from bson import ObjectId

from db.mongodb_client import get_database

def generate_sample_data(tenant_id: str = "demo_tenant", days: int = 30):
    """Generate sample analytics data"""
    print(f"🎲 Generating sample analytics data for tenant: {tenant_id}")
    
    try:
        # Initialize database connection
        from db.mongodb_client import init_db
        init_db()
        db = get_database()
        
        if db is None:
            print("❌ Failed to connect to database")
            return False
        
        # Clear existing demo data
        db.documents.delete_many({"tenant_id": tenant_id})
        db.chat_history.delete_many({"tenant_id": tenant_id})
        print("🧹 Cleared existing demo data")
        
        # Generate sample documents
        document_types = ["financial", "legal", "technical", "policy", "general"]
        sample_documents = []
        
        for i in range(50):  # 50 sample documents
            doc_date = datetime.utcnow() - timedelta(days=random.randint(0, days))
            doc_type = random.choice(document_types)
            
            document = {
                "_id": ObjectId(),
                "tenant_id": tenant_id,
                "file_name": f"sample_document_{i+1}.pdf",
                "file_path": f"demo/{tenant_id}/sample_document_{i+1}.pdf",
                "file_size": random.randint(50000, 5000000),
                "chunk_count": random.randint(5, 50),
                "document_type": doc_type,
                "created_at": doc_date,
                "uploaded_by": f"user_{random.randint(1, 10)}",
                "processing_metadata": {
                    "total_words": random.randint(1000, 10000),
                    "entity_extraction_time_ms": random.randint(500, 3000),
                    "total_entities": random.randint(10, 100)
                },
                "entity_data": {
                    "entities": [
                        {
                            "name": f"Entity_{j}",
                            "type": random.choice(["PERSON", "ORGANIZATION", "LOCATION", "DATE", "MONEY"]),
                            "salience": random.uniform(0.1, 0.9)
                        }
                        for j in range(random.randint(5, 20))
                    ],
                    "enterprise_entities": {
                        "financial_terms": [f"financial_term_{k}" for k in range(random.randint(0, 5))],
                        "technical_terms": [f"technical_term_{k}" for k in range(random.randint(0, 5))],
                        "legal_terms": [f"legal_term_{k}" for k in range(random.randint(0, 5))]
                    }
                }
            }
            sample_documents.append(document)
        
        db.documents.insert_many(sample_documents)
        print(f"✅ Generated {len(sample_documents)} sample documents")
        
        # Generate sample chat history
        sample_queries = [
            "What are the key financial metrics?",
            "Show me the revenue trends",
            "What are the compliance requirements?",
            "Explain the technical specifications",
            "What are the main risks mentioned?",
            "Summarize the legal agreements",
            "What is the market analysis?",
            "Show me the performance indicators",
            "What are the strategic initiatives?",
            "Explain the operational procedures"
        ]
        
        sample_chats = []
        
        for i in range(200):  # 200 sample queries
            chat_date = datetime.utcnow() - timedelta(days=random.randint(0, days))
            query = random.choice(sample_queries)
            
            chat = {
                "_id": ObjectId(),
                "tenant_id": tenant_id,
                "user_id": f"user_{random.randint(1, 10)}",
                "session_id": f"session_{random.randint(1, 20)}",
                "query": query,
                "answer": f"This is a sample answer for: {query}",
                "confidence": random.uniform(0.3, 0.95),
                "response_time_ms": random.randint(800, 8000),
                "context_chunks": random.randint(1, 5),
                "created_at": chat_date,
                "sources": [
                    {
                        "file_name": f"sample_document_{random.randint(1, 50)}.pdf",
                        "relevance_score": random.uniform(0.5, 0.9)
                    }
                    for _ in range(random.randint(1, 3))
                ]
            }
            sample_chats.append(chat)
        
        db.chat_history.insert_many(sample_chats)
        print(f"✅ Generated {len(sample_chats)} sample chat entries")
        
        print(f"🎉 Sample data generation completed for tenant: {tenant_id}")
        return True
        
    except Exception as e:
        print(f"❌ Sample data generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def clear_sample_data(tenant_id: str = "demo_tenant"):
    """Clear sample data"""
    try:
        # Initialize database connection
        from db.mongodb_client import init_db
        init_db()
        db = get_database()
        
        if db is None:
            print("❌ Failed to connect to database")
            return False
        
        doc_count = db.documents.delete_many({"tenant_id": tenant_id}).deleted_count
        chat_count = db.chat_history.delete_many({"tenant_id": tenant_id}).deleted_count
        
        print(f"🧹 Cleared {doc_count} documents and {chat_count} chat entries for tenant: {tenant_id}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to clear sample data: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate sample analytics data")
    parser.add_argument("--tenant", default="demo_tenant", help="Tenant ID")
    parser.add_argument("--days", type=int, default=30, help="Number of days of data")
    parser.add_argument("--clear", action="store_true", help="Clear existing data")
    
    args = parser.parse_args()
    
    if args.clear:
        print("🧹 Clearing sample data...")
        clear_sample_data(args.tenant)
    else:
        print("🎲 Generating sample data...")
        generate_sample_data(args.tenant, args.days)
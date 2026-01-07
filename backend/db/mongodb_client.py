from pymongo import MongoClient
from pymongo import IndexModel, ASCENDING
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: MongoClient = None
    database = None

mongodb = MongoDB()

def get_database():
    return mongodb.database

def init_db():
    """Initialize MongoDB connection and create indexes"""
    try:
        # Add connection timeout and server selection timeout
        mongodb.client = MongoClient(
            os.getenv("MONGODB_URL"),
            serverSelectionTimeoutMS=5000,  # 5 seconds timeout
            connectTimeoutMS=5000,  # 5 seconds connection timeout
            socketTimeoutMS=5000,   # 5 seconds socket timeout
            maxPoolSize=10,
            retryWrites=True
        )
        
        # Test the connection
        mongodb.client.admin.command('ping')
        mongodb.database = mongodb.client[os.getenv("DATABASE_NAME")]
        
        # Create indexes
        create_indexes()
        logger.info("MongoDB initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB: {e}")
        # Don't raise the exception to allow the app to start
        # The app can still function with limited capabilities
        mongodb.client = None
        mongodb.database = None

def create_indexes():
    """Create necessary indexes for optimal performance"""
    db = mongodb.database
    
    # Users collection indexes
    db.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("tenant_id", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("role", ASCENDING)])
    ])
    
    # Tenants collection indexes
    db.tenants.create_indexes([
        IndexModel([("name", ASCENDING)], unique=True),
        IndexModel([("created_at", ASCENDING)])
    ])
    
    # Documents collection indexes
    db.documents.create_indexes([
        IndexModel([("tenant_id", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("file_name", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("created_at", ASCENDING)]),
        IndexModel([("file_path", ASCENDING)], unique=True)
    ])
    
    # Chat history collection indexes
    db.chat_history.create_indexes([
        IndexModel([("tenant_id", ASCENDING), ("user_id", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("created_at", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("user_id", ASCENDING), ("session_id", ASCENDING)]),
        IndexModel([("session_id", ASCENDING), ("created_at", ASCENDING)])
    ])

def close_db():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()

# Database models
class UserModel:
    @staticmethod
    def create_user(user_data: dict):
        db = get_database()
        user_data["created_at"] = datetime.utcnow()
        result = db.users.insert_one(user_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_by_email(email: str):
        db = get_database()
        return db.users.find_one({"email": email})
    
    @staticmethod
    def get_user_by_id(user_id: str):
        db = get_database()
        from bson import ObjectId
        return db.users.find_one({"_id": ObjectId(user_id)})
    
    @staticmethod
    def get_users_by_tenant(tenant_id: str):
        db = get_database()
        cursor = db.users.find({"tenant_id": tenant_id})
        return list(cursor)

class TenantModel:
    @staticmethod
    def create_tenant(tenant_data: dict):
        db = get_database()
        tenant_data["created_at"] = datetime.utcnow()
        result = db.tenants.insert_one(tenant_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_tenant_by_id(tenant_id: str):
        db = get_database()
        from bson import ObjectId
        return db.tenants.find_one({"_id": ObjectId(tenant_id)})
    
    @staticmethod
    def get_tenant_by_name(name: str):
        db = get_database()
        return db.tenants.find_one({"name": name})

class DocumentModel:
    @staticmethod
    def create_document(doc_data: dict):
        db = get_database()
        doc_data["created_at"] = datetime.utcnow()
        result = db.documents.insert_one(doc_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_documents_by_tenant(tenant_id: str):
        db = get_database()
        cursor = db.documents.find({"tenant_id": tenant_id})
        return list(cursor)
    
    @staticmethod
    def get_document_by_id(doc_id: str, tenant_id: str):
        db = get_database()
        from bson import ObjectId
        return db.documents.find_one({
            "_id": ObjectId(doc_id),
            "tenant_id": tenant_id
        })
    
    @staticmethod
    def delete_document(doc_id: str, tenant_id: str):
        db = get_database()
        from bson import ObjectId
        result = db.documents.delete_one({
            "_id": ObjectId(doc_id),
            "tenant_id": tenant_id
        })
        return result.deleted_count > 0

class ChatHistoryModel:
    @staticmethod
    def save_chat(chat_data: dict):
        db = get_database()
        chat_data["created_at"] = datetime.utcnow()
        result = db.chat_history.insert_one(chat_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_chat_history(tenant_id: str, user_id: str, limit: int = 50, session_id: str = None):
        db = get_database()
        query = {
            "tenant_id": tenant_id,
            "user_id": user_id
        }
        
        if session_id:
            query["session_id"] = session_id
        
        cursor = db.chat_history.find(query).sort("created_at", -1).limit(limit)
        return list(cursor)
    
    @staticmethod
    def get_chat_sessions(tenant_id: str, user_id: str):
        db = get_database()
        pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "user_id": user_id
                }
            },
            {
                "$group": {
                    "_id": "$session_id",
                    "last_message": {"$max": "$created_at"},
                    "message_count": {"$sum": 1},
                    "first_query": {"$first": "$query"}
                }
            },
            {
                "$sort": {"last_message": -1}
            },
            {
                "$limit": 20
            }
        ]
        
        cursor = db.chat_history.aggregate(pipeline)
        sessions = []
        for session in cursor:
            sessions.append({
                "session_id": session["_id"],
                "last_message": session["last_message"],
                "message_count": session["message_count"],
                "preview": session["first_query"][:50] + "..." if len(session["first_query"]) > 50 else session["first_query"]
            })
        
        return sessions
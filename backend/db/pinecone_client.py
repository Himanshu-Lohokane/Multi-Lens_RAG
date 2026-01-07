from pinecone import Pinecone, ServerlessSpec
import os
from typing import List, Dict, Any
import logging
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class PineconeClient:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PineconeClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'api_key'):
            self.api_key = None
            self.host = None
            self.index_name = None
            self.pc = None
            self.index = None
    
    def initialize(self):
        """Initialize Pinecone connection once at startup"""
        if self._initialized:
            logger.info("Pinecone client already initialized, skipping re-initialization")
            return
            
        try:
            # Load environment variables
            self.api_key = os.getenv("PINECONE_API_KEY")
            self.host = os.getenv("PINECONE_HOST")
            self.index_name = os.getenv("PINECONE_INDEX_NAME")
            
            if not self.api_key:
                raise ValueError("PINECONE_API_KEY environment variable is required")
            
            self.pc = Pinecone(api_key=self.api_key)
            
            # For serverless, we connect directly to the index using host URL
            if self.host:
                # Connect to existing index using host URL
                self.index = self.pc.Index(host=self.host)
                logger.info(f"Connected to Pinecone index via host: {self.host}")
            else:
                if not self.index_name:
                    raise ValueError("Either PINECONE_HOST or PINECONE_INDEX_NAME must be provided")
                    
                # Fallback: Create index if it doesn't exist (for new setups)
                existing_indexes = [index.name for index in self.pc.list_indexes()]
                if self.index_name not in existing_indexes:
                    self.pc.create_index(
                        name=self.index_name,
                        dimension=768,  # Google Gemini embedding dimension
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud="aws",
                            region="us-east-1"
                        )
                    )
                    logger.info(f"Created Pinecone index: {self.index_name}")
                
                self.index = self.pc.Index(self.index_name)
                logger.info(f"Connected to Pinecone index: {self.index_name}")
            
            PineconeClient._initialized = True
            logger.info("Pinecone client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {e}")
            raise
    
    def upsert_vectors(self, vectors: List[Dict[str, Any]], namespace: str):
        """Upsert vectors to Pinecone with tenant namespace"""
        if not self._initialized:
            raise RuntimeError("Pinecone client not initialized. Call initialize() first.")
        try:
            response = self.index.upsert(
                vectors=vectors,
                namespace=namespace
            )
            logger.info(f"Upserted {len(vectors)} vectors to namespace {namespace}")
            return response
        except Exception as e:
            logger.error(f"Failed to upsert vectors: {e}")
            raise
    
    def query_vectors(self, query_vector: List[float], namespace: str, 
                     top_k: int = 2, filter_dict: Dict = None):
        """Query vectors from Pinecone with tenant namespace"""
        if not self._initialized:
            raise RuntimeError("Pinecone client not initialized. Call initialize() first.")
        try:
            pinecone_start = time.time()
            logger.info(f"🌲 Querying Pinecone index '{self.index_name}' namespace '{namespace}' with top_k={top_k}...")
            response = self.index.query(
                vector=query_vector,
                namespace=namespace,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            pinecone_time = (time.time() - pinecone_start) * 1000
            logger.info(f"✅ Pinecone query completed in {pinecone_time:.2f}ms - Found {len(response.matches)} matches")
            return response
        except Exception as e:
            logger.error(f"💥 Failed to query vectors: {e}")
            raise
    
    def delete_vectors(self, ids: List[str], namespace: str):
        """Delete vectors from Pinecone"""
        if not self._initialized:
            raise RuntimeError("Pinecone client not initialized. Call initialize() first.")
        try:
            response = self.index.delete(ids=ids, namespace=namespace)
            logger.info(f"Deleted vectors {ids} from namespace {namespace}")
            return response
        except Exception as e:
            logger.error(f"Failed to delete vectors: {e}")
            raise
    
    def delete_namespace(self, namespace: str):
        """Delete entire namespace (all vectors for a tenant)"""
        if not self._initialized:
            raise RuntimeError("Pinecone client not initialized. Call initialize() first.")
        try:
            response = self.index.delete(delete_all=True, namespace=namespace)
            logger.info(f"Deleted namespace {namespace}")
            return response
        except Exception as e:
            logger.error(f"Failed to delete namespace: {e}")
            raise
    
    def get_index_stats(self, namespace: str = None):
        """Get index statistics"""
        if not self._initialized:
            raise RuntimeError("Pinecone client not initialized. Call initialize() first.")
        try:
            if namespace:
                stats = self.index.describe_index_stats(filter={"namespace": namespace})
            else:
                stats = self.index.describe_index_stats()
            return stats
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            raise

# Global Pinecone client instance
pinecone_client = PineconeClient()
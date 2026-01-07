from langchain_google_genai import GoogleGenerativeAIEmbeddings
from typing import List
import os
import logging
import time

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )
    
    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            embed_start = time.time()
            logger.info(f"🧠 Calling Google Embedding API for {len(text)} characters...")
            embedding = self.embeddings.embed_query(text)
            embed_time = (time.time() - embed_start) * 1000
            logger.info(f"✅ Google Embedding API responded in {embed_time:.2f}ms - Generated {len(embedding)} dimensions")
            return embedding
        except Exception as e:
            logger.error(f"💥 Failed to generate embedding: {e}")
            raise
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            batch_start = time.time()
            total_chars = sum(len(text) for text in texts)
            logger.info(f"🧠 Calling Google Embedding API for {len(texts)} documents ({total_chars} chars total)...")
            embeddings = self.embeddings.embed_documents(texts)
            batch_time = (time.time() - batch_start) * 1000
            logger.info(f"✅ Google Embedding API batch responded in {batch_time:.2f}ms - Generated {len(embeddings)} embeddings")
            return embeddings
        except Exception as e:
            logger.error(f"💥 Failed to generate embeddings: {e}")
            raise

# Global embedding service instance
embedding_service = EmbeddingService()
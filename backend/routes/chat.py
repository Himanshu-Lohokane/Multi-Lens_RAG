from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
import time

from routes.auth import get_current_active_user
from services.enterprise_rag_pipeline import enterprise_rag_pipeline as rag_pipeline
from db.mongodb_client import ChatHistoryModel

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatQuery(BaseModel):
    query: str
    top_k: Optional[int] = 2
    session_id: Optional[str] = None

class SourceInfo(BaseModel):
    file_name: str
    file_id: Optional[str] = None
    file_path: Optional[str] = None
    document_type: Optional[str] = None
    section_title: Optional[str] = None
    page_number: Optional[int] = None
    chunk_text: str = ""
    relevance_score: float = 0.0
    word_count: Optional[int] = None
    upload_date: Optional[str] = None

class RichContent(BaseModel):
    has_tabular_data: bool = False
    has_numerical_data: bool = False
    has_comparison_data: bool = False
    has_time_series: bool = False
    tables: List[dict] = []
    charts: List[dict] = []
    images: List[dict] = []
    structured_data: List[dict] = []
    summary_visualization: Optional[dict] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceInfo]
    confidence: float
    query: str
    session_id: str
    processing_time_ms: float
    context_quality: Optional[float] = None
    response_type: Optional[str] = None
    processing_metadata: Optional[dict] = None
    rich_content: Optional[RichContent] = None

@router.post("/query", response_model=ChatResponse)
async def chat_query(
    chat_query: ChatQuery,
    current_user: dict = Depends(get_current_active_user)
):
    """Process a chat query using RAG pipeline"""
    request_start_time = time.time()
    logger.info(f"🚀 CHAT QUERY STARTED - User: {current_user['email']}, Query: '{chat_query.query[:100]}...', Top-K: {chat_query.top_k}")
    
    try:
        validation_start = time.time()
        if not chat_query.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )
        
        if len(chat_query.query) > 1000:
            raise HTTPException(
                status_code=400,
                detail="Query too long. Maximum 1000 characters allowed"
            )
        
        validation_time = (time.time() - validation_start) * 1000
        logger.info(f"⏱️  Validation completed in {validation_time:.2f}ms")
        
        # Process query through RAG pipeline
        rag_start_time = time.time()
        logger.info(f"🔍 Starting RAG pipeline processing for tenant: {current_user['tenant_id']}")
        
        result = rag_pipeline.query_documents(
            query=chat_query.query,
            tenant_id=current_user["tenant_id"],
            user_id=str(current_user["_id"]),
            top_k=chat_query.top_k
        )
        
        rag_processing_time = (time.time() - rag_start_time) * 1000
        logger.info(f"🎯 RAG pipeline completed in {rag_processing_time:.2f}ms")
        
        # Generate session ID if not provided
        import uuid
        session_id = chat_query.session_id or str(uuid.uuid4())
        
        # Save chat history
        db_save_start = time.time()
        chat_data = {
            "tenant_id": current_user["tenant_id"],
            "user_id": str(current_user["_id"]),
            "session_id": session_id,
            "query": chat_query.query,
            "answer": result["answer"],
            "sources": result["sources"],
            "confidence": result["confidence"],
            "context_chunks": len(result.get("context", [])),
            "response_time_ms": result.get("response_time_ms", 0)
        }
        
        try:
            ChatHistoryModel.save_chat(chat_data)
            db_save_time = (time.time() - db_save_start) * 1000
            logger.info(f"💾 Chat history saved in {db_save_time:.2f}ms")
        except Exception as e:
            db_save_time = (time.time() - db_save_start) * 1000
            logger.warning(f"❌ Failed to save chat history in {db_save_time:.2f}ms: {e}")
        
        # Final response preparation
        response_prep_start = time.time()
        total_request_time = (time.time() - request_start_time) * 1000
        
        response = ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            confidence=result["confidence"],
            query=chat_query.query,
            session_id=session_id,
            processing_time_ms=round(total_request_time, 2),
            context_quality=result.get("context_quality"),
            response_type=result.get("response_type"),
            processing_metadata=result.get("processing_metadata"),
            rich_content=RichContent(**result.get("rich_content", {})) if result.get("rich_content") else None
        )
        response_prep_time = (time.time() - response_prep_start) * 1000
        logger.info(f"✅ CHAT QUERY COMPLETED - Total time: {total_request_time:.2f}ms, Answer length: {len(result['answer'])} chars, Sources: {len(result['sources'])}")
        logger.info(f"📊 Performance breakdown - RAG: {rag_processing_time:.2f}ms, DB Save: {db_save_time:.2f}ms, Response Prep: {response_prep_time:.2f}ms")
        
        return response
        
    except HTTPException:
        total_request_time = (time.time() - request_start_time) * 1000
        logger.error(f"❌ CHAT QUERY HTTP ERROR - Total time: {total_request_time:.2f}ms")
        raise
    except Exception as e:
        total_request_time = (time.time() - request_start_time) * 1000
        logger.error(f"❌ CHAT QUERY FAILED - Total time: {total_request_time:.2f}ms, Error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process query"
        )

@router.get("/history")
async def get_chat_history(
    limit: int = 50,
    session_id: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Get chat history for the current user"""
    try:
        if limit > 100:
            limit = 100
        
        history = ChatHistoryModel.get_chat_history(
            tenant_id=current_user["tenant_id"],
            user_id=str(current_user["_id"]),
            limit=limit,
            session_id=session_id
        )
        
        formatted_history = []
        for chat in history:
            # Format sources with download links
            formatted_sources = []
            for source in chat.get("sources", []):
                if isinstance(source, dict):
                    formatted_sources.append({
                        **source,
                        "download_url": f"/api/upload/documents/{source.get('file_id')}/download" if source.get('file_id') else None,
                        "preview_url": f"/api/upload/documents/{source.get('file_id')}/preview" if source.get('file_id') else None
                    })
                else:
                    # Handle legacy string format
                    formatted_sources.append({
                        "file_name": source,
                        "download_url": None,
                        "preview_url": None
                    })
            
            formatted_history.append({
                "id": str(chat["_id"]),
                "query": chat["query"],
                "answer": chat["answer"],
                "sources": formatted_sources,
                "created_at": chat["created_at"],
                "context_chunks": chat.get("context_chunks", 0),
                "confidence": chat.get("confidence", 0.0),
                "session_id": chat.get("session_id")
            })
        
        return {"history": formatted_history}
        
    except Exception as e:
        logger.error(f"Failed to get chat history: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve chat history"
        )

@router.get("/sessions")
async def get_chat_sessions(
    current_user: dict = Depends(get_current_active_user)
):
    """Get chat sessions for the current user"""
    try:
        sessions = ChatHistoryModel.get_chat_sessions(
            tenant_id=current_user["tenant_id"],
            user_id=str(current_user["_id"])
        )
        
        return {"sessions": sessions}
        
    except Exception as e:
        logger.error(f"Failed to get chat sessions: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve chat sessions"
        )

@router.get("/suggestions")
async def get_query_suggestions(current_user: dict = Depends(get_current_active_user)):
    """Get suggested queries based on available documents"""
    try:
        # This is a simple implementation - in production, you might want to
        # analyze document content to generate more relevant suggestions
        suggestions = [
            "Create a pie chart of projects including technologies used",
            "Show me the financial performance data in a bar chart",
            "Generate a visualization of market share distribution",
            "Display the quarterly revenue trends in a line graph",
            "Create a table of the key performance metrics",
            "Visualize the budget breakdown by department",
            "Show me a chart comparing sales across regions",
            "Generate a pie chart of customer satisfaction ratings",
            "Create a bar graph of employee performance scores",
            "Display the survey results in a visual format"
        ]
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Failed to get suggestions: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get query suggestions"
        )

@router.post("/feedback")
async def submit_feedback(
    chat_id: str,
    rating: int,
    feedback: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Submit feedback for a chat response"""
    try:
        if rating not in [1, 2, 3, 4, 5]:
            raise HTTPException(
                status_code=400,
                detail="Rating must be between 1 and 5"
            )
        
        # In a production system, you would store this feedback
        # and use it to improve the RAG pipeline
        logger.info(f"Feedback received for chat {chat_id}: rating={rating}, feedback={feedback}")
        
        return {"message": "Feedback submitted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to submit feedback"
        )

@router.get("/debug/sources")
async def debug_sources(
    query: str = "test",
    current_user: dict = Depends(get_current_active_user)
):
    """Debug endpoint to check source metadata"""
    try:
        from services.enterprise_rag_pipeline import enterprise_rag_pipeline as rag_pipeline
        from services.embeddings import embedding_service
        from db.pinecone_client import pinecone_client
        
        # Generate query embedding
        query_embedding = embedding_service.embed_text(query)
        
        # Search similar chunks in Pinecone
        search_results = pinecone_client.query_vectors(
            query_vector=query_embedding,
            namespace=current_user["tenant_id"],
            top_k=3
        )
        
        debug_info = []
        for match in search_results.matches:
            debug_info.append({
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata
            })
        
        return {
            "query": query,
            "tenant_id": current_user["tenant_id"],
            "results_count": len(debug_info),
            "results": debug_info
        }
        
    except Exception as e:
        logger.error(f"Debug sources failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Debug failed: {str(e)}"
        )
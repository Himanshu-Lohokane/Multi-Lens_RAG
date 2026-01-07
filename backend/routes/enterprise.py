from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from datetime import datetime

from routes.auth import get_current_active_user
from config.enterprise_config import enterprise_config
from services.analytics_service import analytics_service

router = APIRouter()
logger = logging.getLogger(__name__)

class ConfigUpdateRequest(BaseModel):
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    similarity_threshold: Optional[float] = None
    max_context_tokens: Optional[int] = None
    temperature: Optional[float] = None
    max_output_tokens: Optional[int] = None
    enable_cache: Optional[bool] = None

@router.get("/config")
async def get_enterprise_config(current_user: dict = Depends(get_current_active_user)):
    """Get current enterprise RAG configuration"""
    try:
        # Only allow admin users to view configuration
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required to view enterprise configuration"
            )
        
        config_dict = enterprise_config.to_dict()
        
        return {
            "config": config_dict,
            "status": "active",
            "validation": enterprise_config.validate_config()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get enterprise config: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve enterprise configuration"
        )

@router.post("/config/update")
async def update_enterprise_config(
    config_update: ConfigUpdateRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """Update enterprise RAG configuration"""
    try:
        # Only allow admin users to update configuration
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required to update enterprise configuration"
            )
        
        # Update configuration values
        if config_update.chunk_size is not None:
            enterprise_config.chunking.chunk_size = config_update.chunk_size
        
        if config_update.chunk_overlap is not None:
            enterprise_config.chunking.chunk_overlap = config_update.chunk_overlap
        
        if config_update.similarity_threshold is not None:
            enterprise_config.retrieval.similarity_threshold = config_update.similarity_threshold
        
        if config_update.max_context_tokens is not None:
            enterprise_config.retrieval.max_context_tokens = config_update.max_context_tokens
        
        if config_update.temperature is not None:
            enterprise_config.response.temperature = config_update.temperature
        
        if config_update.max_output_tokens is not None:
            enterprise_config.response.max_output_tokens = config_update.max_output_tokens
        
        if config_update.enable_cache is not None:
            enterprise_config.cache.enable_cache = config_update.enable_cache
        
        # Validate updated configuration
        if not enterprise_config.validate_config():
            raise HTTPException(
                status_code=400,
                detail="Invalid configuration values provided"
            )
        
        logger.info(f"Enterprise configuration updated by user {current_user['email']}")
        
        return {
            "message": "Enterprise configuration updated successfully",
            "config": enterprise_config.to_dict(),
            "updated_by": current_user["email"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update enterprise config: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update enterprise configuration"
        )

@router.get("/metrics")
async def get_enterprise_metrics(current_user: dict = Depends(get_current_active_user)):
    """Get enterprise RAG performance metrics"""
    try:
        # Only allow admin users to view metrics
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required to view enterprise metrics"
            )
        
        # Get metrics from the enterprise RAG pipeline
        from services.enterprise_rag_pipeline import enterprise_rag_pipeline
        
        metrics = {
            "cache_stats": {
                "cache_size": len(enterprise_rag_pipeline.query_cache),
                "max_cache_size": enterprise_rag_pipeline.cache_max_size,
                "cache_hit_rate": "N/A"  # Would need to implement tracking
            },
            "configuration": {
                "similarity_threshold": enterprise_rag_pipeline.similarity_threshold,
                "max_context_tokens": enterprise_rag_pipeline.max_context_tokens,
                "chunk_size": enterprise_rag_pipeline.config.chunking.chunk_size,
                "chunk_overlap": enterprise_rag_pipeline.config.chunking.chunk_overlap
            },
            "system_status": {
                "pipeline_status": "active",
                "llm_model": "gemini-2.5-flash",
                "embedding_model": "models/embedding-001"
            }
        }
        
        return {
            "metrics": metrics,
            "timestamp": "2024-12-18T20:00:00Z",
            "tenant_id": current_user["tenant_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get enterprise metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve enterprise metrics"
        )

@router.post("/config/reset")
async def reset_enterprise_config(current_user: dict = Depends(get_current_active_user)):
    """Reset enterprise configuration to defaults"""
    try:
        # Only allow admin users to reset configuration
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required to reset enterprise configuration"
            )
        
        # Reinitialize configuration with defaults
        global enterprise_config
        from config.enterprise_config import EnterpriseConfig
        enterprise_config = EnterpriseConfig()
        
        logger.info(f"Enterprise configuration reset to defaults by user {current_user['email']}")
        
        return {
            "message": "Enterprise configuration reset to defaults",
            "config": enterprise_config.to_dict(),
            "reset_by": current_user["email"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reset enterprise config: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to reset enterprise configuration"
        )

@router.get("/document-types")
async def get_document_type_configs(current_user: dict = Depends(get_current_active_user)):
    """Get document type specific configurations"""
    try:
        document_types = ["financial", "legal", "technical", "policy", "general"]
        
        configs = {}
        for doc_type in document_types:
            configs[doc_type] = enterprise_config.get_document_type_config(doc_type)
        
        return {
            "document_type_configs": configs,
            "available_types": document_types
        }
        
    except Exception as e:
        logger.error(f"Failed to get document type configs: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve document type configurations"
        )

@router.get("/analytics/documents")
async def get_document_analytics(
    days: int = 30,
    current_user: dict = Depends(get_current_active_user)
):
    """Get comprehensive document analytics"""
    try:
        analytics = analytics_service.get_document_analytics(
            tenant_id=current_user["tenant_id"],
            days=days
        )
        
        return {
            "analytics": analytics,
            "tenant_id": current_user["tenant_id"],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get document analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve document analytics"
        )

@router.get("/analytics/queries")
async def get_query_analytics(
    days: int = 30,
    current_user: dict = Depends(get_current_active_user)
):
    """Get comprehensive query analytics"""
    try:
        analytics = analytics_service.get_query_analytics(
            tenant_id=current_user["tenant_id"],
            days=days
        )
        
        return {
            "analytics": analytics,
            "tenant_id": current_user["tenant_id"],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get query analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve query analytics"
        )

@router.get("/analytics/entities")
async def get_entity_analytics(
    days: int = 30,
    current_user: dict = Depends(get_current_active_user)
):
    """Get entity trends and insights"""
    try:
        trends = analytics_service.get_entity_trends(
            tenant_id=current_user["tenant_id"],
            days=days
        )
        
        return {
            "trends": trends,
            "tenant_id": current_user["tenant_id"],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get entity analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve entity analytics"
        )

@router.get("/insights/dashboard")
async def get_enterprise_dashboard(
    days: int = 30,
    current_user: dict = Depends(get_current_active_user)
):
    """Get comprehensive enterprise dashboard data"""
    try:
        # Get all analytics in parallel
        doc_analytics = analytics_service.get_document_analytics(current_user["tenant_id"], days)
        query_analytics = analytics_service.get_query_analytics(current_user["tenant_id"], days)
        entity_trends = analytics_service.get_entity_trends(current_user["tenant_id"], days)
        
        # Create dashboard summary
        dashboard = {
            "overview": {
                "total_documents": doc_analytics.get("document_overview", {}).get("total_documents", 0),
                "total_queries": query_analytics.get("query_overview", {}).get("total_queries", 0),
                "active_users": query_analytics.get("user_behavior", {}).get("active_users", 0),
                "avg_response_time": query_analytics.get("query_overview", {}).get("avg_response_time", 0),
                "success_rate": query_analytics.get("success_metrics", {}).get("overall_success_score", 0)
            },
            "document_insights": {
                "document_types": doc_analytics.get("document_overview", {}).get("document_types", {}),
                "entity_distribution": doc_analytics.get("entity_insights", {}).get("entity_type_distribution", {}),
                "processing_efficiency": doc_analytics.get("processing_metrics", {}).get("processing_efficiency", {})
            },
            "query_insights": {
                "performance_distribution": query_analytics.get("performance_metrics", {}).get("performance_distribution", {}),
                "confidence_distribution": query_analytics.get("performance_metrics", {}).get("confidence_distribution", {}),
                "user_engagement": query_analytics.get("user_behavior", {}).get("user_engagement", {})
            },
            "entity_insights": {
                "sentiment_analysis": entity_trends.get("sentiment_analysis", {}),
                "top_insights": entity_trends.get("top_insights", []),
                "entity_trends": entity_trends.get("entity_trends", {}).get("entity_type_trends", {})
            },
            "time_range": {
                "days": days,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
        
        return {
            "dashboard": dashboard,
            "tenant_id": current_user["tenant_id"]
        }
        
    except Exception as e:
        logger.error(f"Failed to get enterprise dashboard: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve enterprise dashboard"
        )
"""
Analytics API Routes for Enterprise RAG System
Provides comprehensive analytics endpoints for dashboard, documents, queries, and entities
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging

from routes.auth import get_current_active_user
from services.analytics_service import analytics_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/dashboard")
async def get_dashboard_analytics(
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365),
    current_user: dict = Depends(get_current_active_user)
):
    """Get comprehensive dashboard analytics"""
    try:
        logger.info(f"Dashboard analytics requested by {current_user['email']} for {days} days")
        
        analytics_data = analytics_service.get_dashboard_analytics(
            tenant_id=current_user["tenant_id"],
            days=days
        )
        
        return analytics_data
        
    except Exception as e:
        logger.error(f"Dashboard analytics failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve dashboard analytics"
        )

@router.get("/documents")
async def get_document_analytics(
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365),
    current_user: dict = Depends(get_current_active_user)
):
    """Get detailed document analytics"""
    try:
        logger.info(f"Document analytics requested by {current_user['email']} for {days} days")
        
        analytics_data = analytics_service.get_document_analytics(
            tenant_id=current_user["tenant_id"],
            days=days
        )
        
        return analytics_data
        
    except Exception as e:
        logger.error(f"Document analytics failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve document analytics"
        )

@router.get("/queries")
async def get_query_analytics(
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365),
    current_user: dict = Depends(get_current_active_user)
):
    """Get detailed query analytics"""
    try:
        logger.info(f"Query analytics requested by {current_user['email']} for {days} days")
        
        analytics_data = analytics_service.get_query_analytics(
            tenant_id=current_user["tenant_id"],
            days=days
        )
        
        return analytics_data
        
    except Exception as e:
        logger.error(f"Query analytics failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve query analytics"
        )

@router.get("/entities")
async def get_entity_analytics(
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365),
    current_user: dict = Depends(get_current_active_user)
):
    """Get detailed entity analytics"""
    try:
        logger.info(f"Entity analytics requested by {current_user['email']} for {days} days")
        
        analytics_data = analytics_service.get_entity_analytics(
            tenant_id=current_user["tenant_id"],
            days=days
        )
        
        return analytics_data
        
    except Exception as e:
        logger.error(f"Entity analytics failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve entity analytics"
        )

@router.get("/export/pdf")
async def export_analytics_pdf(
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365),
    current_user: dict = Depends(get_current_active_user)
):
    """Export analytics as PDF (placeholder)"""
    try:
        logger.info(f"PDF export requested by {current_user['email']} for {days} days")
        
        # This is a placeholder - in a real implementation, you'd generate a PDF
        # using libraries like reportlab, weasyprint, or similar
        
        return {
            "message": "PDF export functionality will be implemented",
            "status": "placeholder",
            "requested_days": days,
            "tenant_id": current_user["tenant_id"]
        }
        
    except Exception as e:
        logger.error(f"PDF export failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to export PDF"
        )

@router.get("/export/excel")
async def export_analytics_excel(
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365),
    current_user: dict = Depends(get_current_active_user)
):
    """Export analytics as Excel (placeholder)"""
    try:
        logger.info(f"Excel export requested by {current_user['email']} for {days} days")
        
        # This is a placeholder - in a real implementation, you'd generate an Excel file
        # using libraries like openpyxl, xlsxwriter, or pandas
        
        return {
            "message": "Excel export functionality will be implemented",
            "status": "placeholder",
            "requested_days": days,
            "tenant_id": current_user["tenant_id"]
        }
        
    except Exception as e:
        logger.error(f"Excel export failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to export Excel"
        )

@router.get("/health")
async def analytics_health_check():
    """Health check for analytics service"""
    try:
        # Basic health check
        return {
            "status": "healthy",
            "service": "analytics",
            "timestamp": "2024-12-20T20:30:00Z"
        }
        
    except Exception as e:
        logger.error(f"Analytics health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Analytics service unhealthy"
        )
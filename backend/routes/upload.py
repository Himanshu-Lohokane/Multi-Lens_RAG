from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
import logging
import io
from bson import ObjectId

from routes.auth import get_current_active_user
from services.enterprise_rag_pipeline import enterprise_rag_pipeline as rag_pipeline
from services.storage_service import storage_service
from utils.file_processor import file_processor
from db.mongodb_client import DocumentModel

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """Upload and process a document"""
    try:
        # Validate file type
        if not file_processor.is_supported_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported types: PDF, DOCX, TXT, CSV, Excel (XLSX/XLS), Images (PNG, JPG, GIF, BMP, WebP), Videos (MP4, AVI, MOV, MKV, WebM, FLV), Audio (MP3, WAV, M4A, FLAC, AAC, OGG)"
            )
        
        # Read file content
        file_content = await file.read()
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Check file size - larger limit for video/audio files
        from services.gemini_multimodal import gemini_multimodal_service
        
        if gemini_multimodal_service.is_video_file(file.filename) or gemini_multimodal_service.is_audio_file(file.filename):
            max_size = 200 * 1024 * 1024  # 200MB for video/audio
            size_label = "200MB"
        else:
            max_size = 50 * 1024 * 1024   # 50MB for other files
            size_label = "50MB"
            
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {size_label}"
            )
        
        # Upload to storage (S3 or GCS)
        file_path = storage_service.upload_file(
            file_content=file_content,
            filename=file.filename,
            tenant_id=current_user["tenant_id"]
        )
        
        if not file_path:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload file to storage"
            )
        
        # Process document with RAG pipeline
        doc_id = rag_pipeline.process_document(
            file_path=file_path,
            file_name=file.filename,
            file_content=file_content,
            tenant_id=current_user["tenant_id"],
            user_id=str(current_user["_id"])
        )
        
        return {
            "message": "Document uploaded and processed successfully",
            "document_id": doc_id,
            "filename": file.filename,
            "file_path": file_path
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during document upload"
        )

@router.get("/documents")
async def get_documents(current_user: dict = Depends(get_current_active_user)):
    """Get all documents for the current tenant"""
    try:
        documents = DocumentModel.get_documents_by_tenant(
            current_user["tenant_id"]
        )
        
        formatted_docs = []
        for doc in documents:
            formatted_docs.append({
                "id": str(doc["_id"]),
                "file_name": doc["file_name"],
                "file_size": doc.get("file_size", 0),
                "chunk_count": doc.get("chunk_count", 0),
                "uploaded_by": doc.get("uploaded_by", "Unknown"),
                "created_at": doc["created_at"],
                "text_preview": doc.get("text_preview", "")
            })
        
        return {"documents": formatted_docs}
        
    except Exception as e:
        logger.error(f"Failed to get documents: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve documents"
        )

@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete a document"""
    try:
        # Check if user has permission (admin or document owner)
        if current_user["role"] not in ["admin", "super_admin"]:
            # Additional check for document ownership could be added here
            pass
        
        success = rag_pipeline.delete_document(
            doc_id=doc_id,
            tenant_id=current_user["tenant_id"]
        )
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Document not found or could not be deleted"
            )
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document deletion failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete document"
        )

@router.post("/documents/bulk")
async def upload_multiple_documents(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """Upload multiple documents at once"""
    try:
        if len(files) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 files can be uploaded at once"
            )
        
        results = []
        errors = []
        
        for file in files:
            try:
                # Validate file type
                if not file_processor.is_supported_file(file.filename):
                    errors.append(f"{file.filename}: Unsupported file type")
                    continue
                
                # Read file content
                file_content = await file.read()
                if len(file_content) == 0:
                    errors.append(f"{file.filename}: Empty file")
                    continue
                
                # Upload to storage (S3 or GCS)
                file_path = storage_service.upload_file(
                    file_content=file_content,
                    filename=file.filename,
                    tenant_id=current_user["tenant_id"]
                )
                
                if not file_path:
                    errors.append(f"{file.filename}: Failed to upload to storage")
                    continue
                
                # Process document
                doc_id = rag_pipeline.process_document(
                    file_path=file_path,
                    file_name=file.filename,
                    file_content=file_content,
                    tenant_id=current_user["tenant_id"],
                    user_id=str(current_user["_id"])
                )
                
                results.append({
                    "filename": file.filename,
                    "document_id": doc_id,
                    "status": "success"
                })
                
            except Exception as e:
                errors.append(f"{file.filename}: {str(e)}")
        
        return {
            "message": f"Processed {len(results)} files successfully",
            "results": results,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Bulk upload failed"
        )

@router.get("/documents/{doc_id}/download")
async def download_document(
    doc_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Download a document file"""
    try:
        # Get document info from database
        document = DocumentModel.get_document_by_id(doc_id, current_user["tenant_id"])
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        # Get file from storage (S3 or GCS)
        file_content = storage_service.download_file(
            file_path=document["file_path"]
        )
        
        if not file_content:
            raise HTTPException(
                status_code=404,
                detail="File not found in storage"
            )
        
        # Determine content type
        content_type = "application/octet-stream"
        if document["file_name"].lower().endswith('.pdf'):
            content_type = "application/pdf"
        elif document["file_name"].lower().endswith(('.doc', '.docx')):
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif document["file_name"].lower().endswith('.txt'):
            content_type = "text/plain"
        elif document["file_name"].lower().endswith('.csv'):
            content_type = "text/csv"
        elif document["file_name"].lower().endswith(('.png', '.jpg', '.jpeg')):
            content_type = f"image/{document['file_name'].split('.')[-1].lower()}"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={document['file_name']}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File download failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to download file"
        )

@router.get("/documents/{doc_id}/preview")
async def preview_document(
    doc_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get document preview information"""
    try:
        # Validate doc_id format first
        try:
            from bson import ObjectId
            if not ObjectId.is_valid(doc_id):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid document ID format: {doc_id}"
                )
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid document ID format: {doc_id}"
            )
        
        # Get document info from database
        document = DocumentModel.get_document_by_id(doc_id, current_user["tenant_id"])
        if not document:
            logger.warning(f"Document not found: doc_id={doc_id}, tenant_id={current_user['tenant_id']}")
            raise HTTPException(
                status_code=404,
                detail=f"Document with ID {doc_id} not found or not accessible to your tenant"
            )
        
        # Return preview information with full text if available
        full_text = document.get("full_text", "")
        text_preview = full_text if full_text else document.get("text_preview", "")
        
        preview_data = {
            "id": str(document["_id"]),
            "file_name": document["file_name"],
            "file_size": document.get("file_size", 0),
            "file_type": document["file_name"].split(".")[-1].upper() if "." in document["file_name"] else "Unknown",
            "chunk_count": document.get("chunk_count", 0),
            "text_preview": text_preview,
            "full_text_available": bool(full_text),
            "uploaded_by": document.get("uploaded_by", "Unknown"),
            "created_at": document["created_at"],
            "download_url": f"/api/upload/documents/{doc_id}/download",
            "can_preview_inline": document["file_name"].lower().endswith(('.txt', '.csv', '.pdf', '.docx'))
        }
        
        return preview_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document preview failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get document preview"
        )

@router.get("/documents/{doc_id}/view")
async def view_document(
    doc_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """View a document inline (especially for PDFs)"""
    try:
        # Get document info from database
        document = DocumentModel.get_document_by_id(doc_id, current_user["tenant_id"])
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        # Try to get file from storage (S3 or GCS)
        try:
            file_content = storage_service.download_file(
                file_path=document["file_path"]
            )
            
            if file_content:
                # Determine content type for inline viewing
                content_type = "application/octet-stream"
                if document["file_name"].lower().endswith('.pdf'):
                    content_type = "application/pdf"
                elif document["file_name"].lower().endswith('.txt'):
                    content_type = "text/plain"
                elif document["file_name"].lower().endswith('.csv'):
                    content_type = "text/csv"
                elif document["file_name"].lower().endswith(('.png', '.jpg', '.jpeg')):
                    content_type = f"image/{document['file_name'].split('.')[-1].lower()}"
                
                return StreamingResponse(
                    io.BytesIO(file_content),
                    media_type=content_type,
                    headers={
                        "Content-Disposition": f"inline; filename={document['file_name']}"
                    }
                )
        except Exception as download_error:
            logger.warning(f"Direct download failed, trying signed URL: {download_error}")
            
            # Fallback: Generate signed URL and redirect
            try:
                signed_url = storage_service.generate_presigned_url(
                    file_path=document["file_path"],
                    expiration=3600  # 1 hour
                )
                
                if signed_url:
                    from fastapi.responses import RedirectResponse
                    return RedirectResponse(url=signed_url)
                    
            except Exception as url_error:
                logger.error(f"Signed URL generation failed: {url_error}")
        
        # If both methods fail
        raise HTTPException(
            status_code=404,
            detail="File not found in storage or access denied"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File view failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to view file"
        )

@router.get("/documents/{doc_id}/url")
async def get_document_url(
    doc_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get a signed URL for direct document access"""
    try:
        # Get document info from database
        document = DocumentModel.get_document_by_id(doc_id, current_user["tenant_id"])
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        # Generate signed URL
        signed_url = storage_service.generate_presigned_url(
            file_path=document["file_path"],
            expiration=3600  # 1 hour
        )
        
        if not signed_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate access URL"
            )
        
        return {
            "url": signed_url,
            "filename": document["file_name"],
            "expires_in": 3600
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate document URL"
        )

@router.get("/documents/{doc_id}/entities")
async def get_document_entities(
    doc_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get extracted entities for a document"""
    try:
        # Get document from MongoDB
        document = DocumentModel.get_document_by_id(doc_id, current_user["tenant_id"])
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Extract entity data
        entity_data = document.get("entity_data", {})
        
        # Format entities for frontend display
        formatted_entities = {
            "entities": entity_data.get("entities", []),
            "enterprise_entities": entity_data.get("enterprise_entities", {}),
            "entity_summary": entity_data.get("entity_summary", {}),
            "sentiment": entity_data.get("sentiment", {}),
            "extraction_metadata": entity_data.get("extraction_metadata", {})
        }
        
        return {
            "document_id": doc_id,
            "file_name": document.get("file_name"),
            "document_type": document.get("document_type"),
            "entities": formatted_entities
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document entities: {e}")
        raise HTTPException(status_code=500, detail="Failed to get document entities")
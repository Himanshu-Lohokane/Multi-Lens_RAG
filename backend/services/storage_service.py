import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        # Determine which storage service to use
        self.storage_provider = os.getenv("STORAGE_PROVIDER", "s3").lower()
        
        if self.storage_provider == "gcs":
            try:
                from .gcs_service import gcs_service
                self.service = gcs_service
                logger.info("Using Google Cloud Storage (GCS) as storage provider")
            except Exception as e:
                logger.error(f"Failed to initialize GCS, falling back to S3: {e}")
                from .s3_service import s3_service
                self.service = s3_service
                self.storage_provider = "s3"
                logger.info("Fallback: Using AWS S3 as storage provider")
        else:
            try:
                from .s3_service import s3_service
                self.service = s3_service
                logger.info("Using AWS S3 as storage provider")
            except Exception as e:
                logger.error(f"Failed to initialize S3: {e}")
                raise
    
    def upload_file(self, file_content: bytes, filename: str, tenant_id: str) -> Optional[str]:
        """Upload file to configured storage service"""
        return self.service.upload_file(file_content, filename, tenant_id)
    
    def download_file(self, file_path: str) -> Optional[bytes]:
        """Download file from configured storage service"""
        return self.service.download_file(file_path)
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from configured storage service"""
        return self.service.delete_file(file_path)
    
    def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> Optional[str]:
        """Generate presigned/signed URL for file access"""
        return self.service.generate_presigned_url(file_path, expiration)
    
    def upload_processed_file(self, file_content: bytes, filename: str, tenant_id: str, processing_type: str = "text") -> Optional[str]:
        """Upload processed file (GCS specific, fallback for S3)"""
        if hasattr(self.service, 'upload_processed_file'):
            return self.service.upload_processed_file(file_content, filename, tenant_id, processing_type)
        else:
            # Fallback for S3 - use regular upload with different path
            import uuid
            file_extension = filename.split('.')[-1] if '.' in filename else 'txt'
            unique_filename = f"{uuid.uuid4().hex}_{processing_type}.{file_extension}"
            processed_filename = f"processed_{unique_filename}"
            return self.service.upload_file(file_content, processed_filename, tenant_id)
    
    def upload_metadata(self, metadata: dict, filename: str, tenant_id: str) -> Optional[str]:
        """Upload metadata (GCS specific, fallback for S3)"""
        if hasattr(self.service, 'upload_metadata'):
            return self.service.upload_metadata(metadata, filename, tenant_id)
        else:
            # Fallback for S3 - upload as JSON file
            import json
            import uuid
            metadata_json = json.dumps(metadata, indent=2)
            unique_filename = f"{uuid.uuid4().hex}_metadata.json"
            return self.service.upload_file(metadata_json.encode(), unique_filename, tenant_id)
    
    def get_storage_provider(self) -> str:
        """Get current storage provider"""
        return self.storage_provider

# Global storage service instance
storage_service = StorageService()
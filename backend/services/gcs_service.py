import os
import logging
from typing import Optional
import uuid
from google.cloud import storage
from google.cloud.exceptions import GoogleCloudError, NotFound
import json

logger = logging.getLogger(__name__)

class GCSService:
    def __init__(self):
        self.bucket_name = os.getenv("GCS_BUCKET_NAME")
        self.project_id = os.getenv("GCS_PROJECT_ID")
        
        # Initialize GCS client
        try:
            # Check if service account key is provided as JSON string or file path
            service_account_key = os.getenv("GCS_SERVICE_ACCOUNT_KEY")
            service_account_file = os.getenv("GCS_SERVICE_ACCOUNT_FILE")
            
            if service_account_key:
                # Parse JSON string and create client with credentials
                import json
                from google.oauth2 import service_account
                
                # Handle both single-line and multi-line JSON
                try:
                    credentials_info = json.loads(service_account_key)
                except json.JSONDecodeError:
                    # Try to clean up multi-line JSON
                    cleaned_key = service_account_key.replace('\n', '').replace('  ', ' ').strip()
                    credentials_info = json.loads(cleaned_key)
                
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                self.client = storage.Client(credentials=credentials, project=self.project_id)
                
            elif service_account_file and os.path.exists(service_account_file):
                # Use service account file
                from google.oauth2 import service_account
                credentials = service_account.Credentials.from_service_account_file(service_account_file)
                self.client = storage.Client(credentials=credentials, project=self.project_id)
                
            else:
                # Use default credentials (for local development with gcloud auth)
                self.client = storage.Client(project=self.project_id)
            
            # Get bucket reference
            self.bucket = self.client.bucket(self.bucket_name)
            
            # Test connection (but don't fail if bucket doesn't exist)
            try:
                self.bucket.reload()
                logger.info("GCS client initialized successfully")
            except Exception as bucket_error:
                logger.warning(f"Bucket '{self.bucket_name}' may not exist or is not accessible: {bucket_error}")
                logger.info("GCS client initialized (bucket verification skipped)")
            
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {e}")
            raise
    
    def upload_file(self, file_content: bytes, filename: str, tenant_id: str) -> Optional[str]:
        """Upload file to GCS and return the file path"""
        try:
            # Generate unique file path
            file_extension = filename.split('.')[-1] if '.' in filename else ''
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            
            # Use raw folder for original files
            file_path = f"raw/tenants/{tenant_id}/documents/{unique_filename}"
            
            # Create blob and upload
            blob = self.bucket.blob(file_path)
            
            # Set metadata
            blob.metadata = {
                'original_filename': filename,
                'tenant_id': tenant_id,
                'file_type': 'raw'
            }
            
            # Set content type
            blob.content_type = self._get_content_type(filename)
            
            # Upload file content
            blob.upload_from_string(file_content, content_type=blob.content_type)
            
            logger.info(f"File uploaded to GCS: {file_path}")
            return file_path
            
        except GoogleCloudError as e:
            logger.error(f"GCS upload failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during GCS upload: {e}")
            return None
    
    def download_file(self, file_path: str) -> Optional[bytes]:
        """Download file from GCS"""
        try:
            blob = self.bucket.blob(file_path)
            
            # Check if blob exists
            if not blob.exists():
                logger.error(f"File not found in GCS: {file_path}")
                return None
            
            # Download file content
            file_content = blob.download_as_bytes()
            logger.info(f"File downloaded from GCS: {file_path}")
            return file_content
            
        except NotFound:
            logger.error(f"File not found in GCS: {file_path}")
            return None
        except GoogleCloudError as e:
            logger.error(f"GCS download failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during GCS download: {e}")
            return None
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from GCS"""
        try:
            blob = self.bucket.blob(file_path)
            
            # Check if blob exists before deleting
            if not blob.exists():
                logger.warning(f"File not found for deletion: {file_path}")
                return False
            
            blob.delete()
            logger.info(f"File deleted from GCS: {file_path}")
            return True
            
        except NotFound:
            logger.warning(f"File not found for deletion: {file_path}")
            return False
        except GoogleCloudError as e:
            logger.error(f"GCS deletion failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during GCS deletion: {e}")
            return False
    
    def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> Optional[str]:
        """Generate signed URL for file access"""
        try:
            blob = self.bucket.blob(file_path)
            
            # Check if blob exists
            if not blob.exists():
                logger.error(f"File not found for URL generation: {file_path}")
                return None
            
            # Generate signed URL
            from datetime import datetime, timedelta
            expiration_time = datetime.utcnow() + timedelta(seconds=expiration)
            
            url = blob.generate_signed_url(
                expiration=expiration_time,
                method='GET'
            )
            
            return url
            
        except GoogleCloudError as e:
            logger.error(f"GCS signed URL generation failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during GCS URL generation: {e}")
            return None
    
    def upload_processed_file(self, file_content: bytes, filename: str, tenant_id: str, processing_type: str = "text") -> Optional[str]:
        """Upload processed file to GCS processed folder"""
        try:
            # Generate unique file path in processed folder
            file_extension = filename.split('.')[-1] if '.' in filename else 'txt'
            unique_filename = f"{uuid.uuid4().hex}_{processing_type}.{file_extension}"
            file_path = f"processed/tenants/{tenant_id}/{processing_type}/{unique_filename}"
            
            # Create blob and upload
            blob = self.bucket.blob(file_path)
            
            # Set metadata
            blob.metadata = {
                'original_filename': filename,
                'tenant_id': tenant_id,
                'file_type': 'processed',
                'processing_type': processing_type
            }
            
            # Set content type
            blob.content_type = self._get_content_type(filename)
            
            # Upload file content
            blob.upload_from_string(file_content, content_type=blob.content_type)
            
            logger.info(f"Processed file uploaded to GCS: {file_path}")
            return file_path
            
        except GoogleCloudError as e:
            logger.error(f"GCS processed file upload failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during GCS processed file upload: {e}")
            return None
    
    def upload_metadata(self, metadata: dict, filename: str, tenant_id: str) -> Optional[str]:
        """Upload metadata to GCS metadata folder"""
        try:
            # Generate unique metadata file path
            unique_filename = f"{uuid.uuid4().hex}_metadata.json"
            file_path = f"metadata/tenants/{tenant_id}/{unique_filename}"
            
            # Create blob and upload
            blob = self.bucket.blob(file_path)
            
            # Set metadata
            blob.metadata = {
                'original_filename': filename,
                'tenant_id': tenant_id,
                'file_type': 'metadata'
            }
            
            # Convert metadata to JSON and upload
            metadata_json = json.dumps(metadata, indent=2)
            blob.upload_from_string(metadata_json, content_type='application/json')
            
            logger.info(f"Metadata uploaded to GCS: {file_path}")
            return file_path
            
        except GoogleCloudError as e:
            logger.error(f"GCS metadata upload failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during GCS metadata upload: {e}")
            return None
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension"""
        extension = filename.split('.')[-1].lower() if '.' in filename else ''
        
        content_types = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp',
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'mkv': 'video/x-matroska',
            'webm': 'video/webm',
            'flv': 'video/x-flv',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'm4a': 'audio/mp4',
            'flac': 'audio/flac',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg',
            'json': 'application/json'
        }
        
        return content_types.get(extension, 'application/octet-stream')

# Global GCS service instance
gcs_service = GCSService()
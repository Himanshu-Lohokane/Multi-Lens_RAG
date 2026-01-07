import boto3
from botocore.exceptions import ClientError, SSLError
from botocore.config import Config
import os
import logging
from typing import Optional
import uuid
import ssl

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("AWS_BUCKET_NAME")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        
        # Configure boto3 with SSL settings and retries
        config = Config(
            region_name=self.region,
            retries={
                'max_attempts': 3,
                'mode': 'adaptive'
            },
            max_pool_connections=50,
            signature_version='s3v4'
        )
        
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
                config=config
            )
            # Test connection
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info("S3 client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            # Create a fallback client with basic configuration
            config_fallback = Config(
                region_name=self.region,
                retries={'max_attempts': 3, 'mode': 'adaptive'}
            )
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
                config=config_fallback
            )
    
    def upload_file(self, file_content: bytes, filename: str, tenant_id: str) -> Optional[str]:
        """Upload file to S3 and return the file path"""
        try:
            # Generate unique file path
            file_extension = filename.split('.')[-1] if '.' in filename else ''
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            file_path = f"tenants/{tenant_id}/documents/{unique_filename}"
            
            # Upload to S3 with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    self.s3_client.put_object(
                        Bucket=self.bucket_name,
                        Key=file_path,
                        Body=file_content,
                        ContentType=self._get_content_type(filename),
                        Metadata={
                            'original_filename': filename,
                            'tenant_id': tenant_id
                        }
                    )
                    
                    logger.info(f"File uploaded to S3: {file_path}")
                    return file_path
                    
                except (SSLError, ssl.SSLError) as ssl_error:
                    logger.warning(f"SSL error on attempt {attempt + 1}: {ssl_error}")
                    if attempt == max_retries - 1:
                        raise
                    continue
                    
        except (ClientError, SSLError, ssl.SSLError) as e:
            logger.error(f"S3 upload failed after retries: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during S3 upload: {e}")
            return None
    
    def download_file(self, file_path: str) -> Optional[bytes]:
        """Download file from S3"""
        try:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = self.s3_client.get_object(
                        Bucket=self.bucket_name,
                        Key=file_path
                    )
                    return response['Body'].read()
                    
                except (SSLError, ssl.SSLError) as ssl_error:
                    logger.warning(f"SSL error on download attempt {attempt + 1}: {ssl_error}")
                    if attempt == max_retries - 1:
                        raise
                    continue
                    
        except (ClientError, SSLError, ssl.SSLError) as e:
            logger.error(f"S3 download failed after retries: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during S3 download: {e}")
            return None
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_path
            )
            logger.info(f"File deleted from S3: {file_path}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 deletion failed: {e}")
            return False
    
    def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> Optional[str]:
        """Generate presigned URL for file access"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_path},
                ExpiresIn=expiration
            )
            return url
            
        except ClientError as e:
            logger.error(f"Presigned URL generation failed: {e}")
            return None
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension"""
        extension = filename.split('.')[-1].lower() if '.' in filename else ''
        
        content_types = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'bmp': 'image/bmp'
        }
        
        return content_types.get(extension, 'application/octet-stream')

# Global S3 service instance
s3_service = S3Service()
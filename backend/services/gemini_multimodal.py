import google.generativeai as genai
import os
import logging
import base64
import tempfile
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

class GeminiMultimodalService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        genai.configure(api_key=self.api_key)
        # Use gemini-2.5-flash for multimodal processing (supports video, audio, images)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Supported file types for multimodal processing
        self.supported_video_formats = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'}
        self.supported_audio_formats = {'.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg'}
        self.supported_image_formats = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'}
    
    def is_video_file(self, filename: str) -> bool:
        """Check if file is a supported video format"""
        return any(filename.lower().endswith(ext) for ext in self.supported_video_formats)
    
    def is_audio_file(self, filename: str) -> bool:
        """Check if file is a supported audio format"""  
        return any(filename.lower().endswith(ext) for ext in self.supported_audio_formats)
    
    def is_supported_image(self, filename: str) -> bool:
        """Check if file is a supported image format for Gemini"""
        return any(filename.lower().endswith(ext) for ext in self.supported_image_formats)
    
    def process_video_file(self, file_content: bytes, filename: str) -> Optional[str]:
        """Process video file with Gemini and return transcription/summary"""
        try:
            logger.info(f"Processing video file: {filename}")
            
            # Create temporary file for Gemini API
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            try:
                # Upload video file to Gemini
                video_file = genai.upload_file(temp_file_path)
                
                # Wait for file to be processed
                import time
                while video_file.state.name == "PROCESSING":
                    logger.info("Video file processing...")
                    time.sleep(5)
                    video_file = genai.get_file(video_file.name)
                
                if video_file.state.name == "FAILED":
                    raise Exception("Video file processing failed")
                
                # Generate comprehensive summary and transcription
                prompt = """Please analyze this video file and provide:

1. Content Summary - key information, general information that can be useful for document retrieval.

2. Transcription
"""

                response = self.model.generate_content([video_file, prompt])
                
                # Clean up uploaded file
                genai.delete_file(video_file.name)
                
                return response.text.strip() if response.text else None
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"Video processing failed for {filename}: {e}")
            return None
    
    def process_audio_file(self, file_content: bytes, filename: str) -> Optional[str]:
        """Process audio file with Gemini and return transcription/summary"""
        try:
            logger.info(f"Processing audio file: {filename}")
            
            # Create temporary file for Gemini API
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            try:
                # Upload audio file to Gemini
                audio_file = genai.upload_file(temp_file_path)
                
                # Wait for file to be processed
                import time
                while audio_file.state.name == "PROCESSING":
                    logger.info("Audio file processing...")
                    time.sleep(3)
                    audio_file = genai.get_file(audio_file.name)
                
                if audio_file.state.name == "FAILED":
                    raise Exception("Audio file processing failed")
                
                # Generate transcription and summary
                prompt = """Please analyze this audio file and provide:

1. Transcription

2. Content Summary - key happenings, general context, surroundings, and any information that can be useful for document retrieval.

Key Information

Context
"""

                response = self.model.generate_content([audio_file, prompt])
                
                # Clean up uploaded file
                genai.delete_file(audio_file.name)
                
                return response.text.strip() if response.text else None
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"Audio processing failed for {filename}: {e}")
            return None
    
    def process_image_file(self, file_content: bytes, filename: str) -> Optional[str]:
        """Process image file with Gemini and return OCR/description"""
        try:
            logger.info(f"Processing image file with Gemini: {filename}")
            
            # Convert image to format suitable for Gemini
            import PIL.Image
            import io
            
            # Open image
            image = PIL.Image.open(io.BytesIO(file_content))
            
            # Generate comprehensive OCR and description
            prompt = """Please analyze this image and provide:

1. *perform ocr

2. provide Visual Description* - general context and key information. anything that can be useful for document retrieval.
"""

            response = self.model.generate_content([image, prompt])
            
            return response.text.strip() if response.text else None
                
        except Exception as e:
            logger.error(f"Image processing with Gemini failed for {filename}: {e}")
            return None

# Global instance
gemini_multimodal_service = GeminiMultimodalService()
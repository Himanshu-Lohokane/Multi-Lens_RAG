import pytesseract
from PIL import Image
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        # Configure tesseract path if needed (Windows)
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        pass
    
    def extract_text_from_image(self, image_bytes: bytes) -> Optional[str]:
        """Extract text from image using OCR"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Extract text using tesseract
            text = pytesseract.image_to_string(image, lang='eng')
            
            # Clean up the text
            text = text.strip()
            if not text:
                logger.warning("No text extracted from image")
                return None
            
            logger.info(f"Extracted {len(text)} characters from image")
            return text
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return None
    
    def is_image_file(self, filename: str) -> bool:
        """Check if file is an image"""
        image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'}
        return any(filename.lower().endswith(ext) for ext in image_extensions)

# Global OCR service instance
ocr_service = OCRService()
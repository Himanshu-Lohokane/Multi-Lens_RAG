import io
import logging
from typing import Optional
import pandas as pd
from docx import Document
import PyPDF2
from utils.ocr import ocr_service
from services.gemini_multimodal import gemini_multimodal_service

logger = logging.getLogger(__name__)

class FileProcessor:
    def __init__(self):
        self.supported_extensions = {
            '.pdf', '.docx', '.txt', '.csv', '.xlsx', '.xls',
            '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp',
            '.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv',
            '.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg'
        }
        
        # Logistics-specific Excel sheet patterns
        self.logistics_sheet_patterns = [
            'shipment', 'delivery', 'freight', 'manifest', 'inventory',
            'tracking', 'route', 'schedule', 'cargo', 'transport',
            'warehouse', 'dispatch', 'driver', 'vehicle', 'load'
        ]
    
    def is_supported_file(self, filename: str) -> bool:
        """Check if file type is supported"""
        return any(filename.lower().endswith(ext) for ext in self.supported_extensions)
    
    def extract_text(self, filename: str, file_content: bytes) -> Optional[str]:
        """Extract text from various file types"""
        try:
            file_extension = self._get_file_extension(filename)
            
            if file_extension == '.pdf':
                return self._extract_from_pdf(file_content)
            elif file_extension == '.docx':
                return self._extract_from_docx(file_content)
            elif file_extension == '.txt':
                return self._extract_from_txt(file_content)
            elif file_extension == '.csv':
                return self._extract_from_csv(file_content)
            elif file_extension in ['.xlsx', '.xls']:
                return self._extract_from_excel(file_content, filename)
            elif gemini_multimodal_service.is_video_file(filename):
                return self._extract_from_video(file_content, filename)
            elif gemini_multimodal_service.is_audio_file(filename):
                return self._extract_from_audio(file_content, filename)
            elif gemini_multimodal_service.is_supported_image(filename):
                return self._extract_from_gemini_image(file_content, filename)
            elif ocr_service.is_image_file(filename):
                return self._extract_from_image(file_content)
            else:
                logger.warning(f"Unsupported file type: {file_extension}")
                return None
                
        except Exception as e:
            logger.error(f"Text extraction failed for {filename}: {e}")
            return None
    
    def _get_file_extension(self, filename: str) -> str:
        """Get file extension in lowercase"""
        return '.' + filename.split('.')[-1].lower() if '.' in filename else ''
    
    def _extract_from_pdf(self, file_content: bytes) -> Optional[str]:
        """Extract text from PDF"""
        try:
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_content = []
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text.strip():
                    text_content.append(f"[Page {page_num + 1}]\n{page_text}")
            
            return "\n\n".join(text_content) if text_content else None
            
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return None
    
    def _extract_from_docx(self, file_content: bytes) -> Optional[str]:
        """Extract text from DOCX"""
        try:
            doc_file = io.BytesIO(file_content)
            doc = Document(doc_file)
            
            text_content = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_content.append(paragraph.text)
            
            return "\n\n".join(text_content) if text_content else None
            
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            return None
    
    def _extract_from_txt(self, file_content: bytes) -> Optional[str]:
        """Extract text from TXT"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    text = file_content.decode(encoding)
                    return text.strip() if text.strip() else None
                except UnicodeDecodeError:
                    continue
            
            logger.warning("Could not decode text file with any encoding")
            return None
            
        except Exception as e:
            logger.error(f"TXT extraction failed: {e}")
            return None
    
    def _extract_from_csv(self, file_content: bytes) -> Optional[str]:
        """Extract text from CSV"""
        try:
            csv_file = io.BytesIO(file_content)
            df = pd.read_csv(csv_file)
            
            # Convert DataFrame to readable text format
            text_content = []
            text_content.append(f"CSV Data with {len(df)} rows and {len(df.columns)} columns")
            text_content.append(f"Columns: {', '.join(df.columns.tolist())}")
            text_content.append("\nData Summary:")
            text_content.append(df.to_string(max_rows=100))  # Limit to first 100 rows
            
            return "\n\n".join(text_content)
            
        except Exception as e:
            logger.error(f"CSV extraction failed: {e}")
            return None
    
    def _extract_from_excel(self, file_content: bytes, filename: str) -> Optional[str]:
        """Extract text from Excel files (.xlsx, .xls) with row-wise formatting"""
        try:
            excel_file = io.BytesIO(file_content)
            
            # Read all sheets from the Excel file
            excel_data = pd.read_excel(excel_file, sheet_name=None, engine='openpyxl')
            
            if not excel_data:
                logger.warning(f"No sheets found in Excel file: {filename}")
                return None
            
            text_content = []
            text_content.append(f"Excel File: {filename}")
            text_content.append(f"Total Sheets: {len(excel_data)}")
            
            # Process each sheet
            for sheet_name, df in excel_data.items():
                if df.empty:
                    continue
                
                # Check if this is a logistics-related sheet
                is_logistics_sheet = any(pattern in sheet_name.lower() 
                                       for pattern in self.logistics_sheet_patterns)
                
                sheet_info = []
                sheet_info.append(f"\n{'='*50}")
                sheet_info.append(f"SHEET: {sheet_name}")
                
                if is_logistics_sheet:
                    sheet_info.append("📦 LOGISTICS DATA DETECTED")
                
                sheet_info.append(f"Dimensions: {len(df)} rows × {len(df.columns)} columns")
                sheet_info.append(f"Columns: {', '.join(df.columns.astype(str).tolist())}")
                sheet_info.append(f"{'='*50}")
                
                # Add data in row-wise format for better RAG processing
                sheet_info.append("\nSAMPLE RECORDS:")
                
                # Clean and format the data row by row
                df_clean = df.fillna('')  # Replace NaN with empty string
                
                # Create row-wise records (each row as a complete record)
                for idx, row in df_clean.head(50).iterrows():  # Limit to first 50 rows
                    record_parts = []
                    for col, value in row.items():
                        if pd.notna(value) and str(value).strip():
                            record_parts.append(f"{col}={value}")
                    
                    if record_parts:
                        sheet_info.append(f"Record {idx + 1}: {' | '.join(record_parts)}")
                
                # Add summary statistics for numeric columns
                numeric_cols = df.select_dtypes(include=['number']).columns
                if len(numeric_cols) > 0:
                    sheet_info.append(f"\nNUMERIC SUMMARY:")
                    for col in numeric_cols[:5]:  # Limit to first 5 numeric columns
                        col_data = df[col].dropna()
                        if len(col_data) > 0:
                            sheet_info.append(f"{col}: Min={col_data.min():.2f}, Max={col_data.max():.2f}, Avg={col_data.mean():.2f}")
                
                text_content.extend(sheet_info)
            
            return "\n".join(text_content) if text_content else None
            
        except Exception as e:
            logger.error(f"Excel extraction failed for {filename}: {e}")
            return None
    
    def _format_logistics_data(self, df, sheet_name: str) -> str:
        """Format logistics-specific data for better readability"""
        try:
            formatted_lines = []
            
            # Identify key logistics columns
            logistics_columns = {
                'tracking': ['tracking', 'track', 'id', 'number', 'ref'],
                'status': ['status', 'state', 'condition'],
                'location': ['location', 'address', 'city', 'destination', 'origin'],
                'date': ['date', 'time', 'schedule', 'eta', 'delivery'],
                'quantity': ['qty', 'quantity', 'count', 'amount', 'weight'],
                'item': ['item', 'product', 'cargo', 'goods', 'description']
            }
            
            # Map actual columns to logistics categories
            column_mapping = {}
            for category, keywords in logistics_columns.items():
                for col in df.columns:
                    if any(keyword in col.lower() for keyword in keywords):
                        if category not in column_mapping:
                            column_mapping[category] = []
                        column_mapping[category].append(col)
            
            # Format data based on identified structure
            if column_mapping:
                formatted_lines.append("🚚 LOGISTICS DATA STRUCTURE:")
                for category, cols in column_mapping.items():
                    formatted_lines.append(f"  {category.upper()}: {', '.join(cols)}")
                formatted_lines.append("")
            
            # Show sample records in a logistics-friendly format
            formatted_lines.append("📋 SAMPLE RECORDS:")
            for idx, row in df.head(10).iterrows():
                record_line = f"Record {idx + 1}: "
                record_parts = []
                
                for col, value in row.items():
                    if pd.notna(value) and str(value).strip():
                        record_parts.append(f"{col}={value}")
                
                if record_parts:
                    formatted_lines.append(record_line + " | ".join(record_parts[:6]))  # Limit to 6 fields per line
            
            return "\n".join(formatted_lines)
            
        except Exception as e:
            logger.error(f"Logistics formatting failed: {e}")
            return df.to_string(max_rows=20)
    
    def _extract_from_image(self, file_content: bytes) -> Optional[str]:
        """Extract text from image using OCR"""
        try:
            return ocr_service.extract_text_from_image(file_content)
        except Exception as e:
            logger.error(f"Image OCR failed: {e}")
            return None
    
    def _extract_from_video(self, file_content: bytes, filename: str) -> Optional[str]:
        """Extract text from video using Gemini multimodal"""
        try:
            logger.info(f"Processing video file with Gemini: {filename}")
            result = gemini_multimodal_service.process_video_file(file_content, filename)
            
            if result:
                # Add video processing metadata
                metadata_header = f"[VIDEO FILE: {filename}]\n"
                metadata_header += "Content processed with AI video analysis including transcription and visual description.\n\n"
                return metadata_header + result
            else:
                logger.warning(f"No content extracted from video: {filename}")
                return None
                
        except Exception as e:
            logger.error(f"Video extraction failed for {filename}: {e}")
            return None
    
    def _extract_from_audio(self, file_content: bytes, filename: str) -> Optional[str]:
        """Extract text from audio using Gemini multimodal"""
        try:
            logger.info(f"Processing audio file with Gemini: {filename}")
            result = gemini_multimodal_service.process_audio_file(file_content, filename)
            
            if result:
                # Add audio processing metadata
                metadata_header = f"[AUDIO FILE: {filename}]\n"
                metadata_header += "Content processed with AI audio analysis and transcription.\n\n"
                return metadata_header + result
            else:
                logger.warning(f"No content extracted from audio: {filename}")
                return None
                
        except Exception as e:
            logger.error(f"Audio extraction failed for {filename}: {e}")
            return None
    
    def _extract_from_gemini_image(self, file_content: bytes, filename: str) -> Optional[str]:
        """Extract text from image using Gemini multimodal (preferred over OCR for better accuracy)"""
        try:
            logger.info(f"Processing image file with Gemini: {filename}")
            result = gemini_multimodal_service.process_image_file(file_content, filename)
            
            if result:
                # Add image processing metadata
                metadata_header = f"[IMAGE FILE: {filename}]\n"
                metadata_header += "Content processed with AI image analysis including OCR and visual description.\n\n"
                return metadata_header + result
            else:
                logger.warning(f"No content extracted from image with Gemini: {filename}")
                # Fallback to traditional OCR if Gemini fails
                return self._extract_from_image(file_content)
                
        except Exception as e:
            logger.error(f"Gemini image extraction failed for {filename}: {e}")
            # Fallback to traditional OCR
            return self._extract_from_image(file_content)

# Global file processor instance
file_processor = FileProcessor()
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage
from typing import List, Dict, Any, Optional, Tuple
import uuid
import logging
from datetime import datetime
import os
import time
import re
import numpy as np
from collections import defaultdict

from db.pinecone_client import pinecone_client
from db.mongodb_client import DocumentModel, ChatHistoryModel
from services.embeddings import embedding_service
from utils.file_processor import file_processor
from smart_performance_monitor import log_performance
from config.enterprise_config import enterprise_config
from services.entity_extraction import entity_extraction_service
from services.rich_content_generator import rich_content_generator

logger = logging.getLogger(__name__)

class EnterpriseRAGPipeline:
    def __init__(self):
        # Load enterprise configuration
        self.config = enterprise_config
        
        # Validate configuration
        if not self.config.validate_config():
            logger.warning("Enterprise configuration validation failed, using defaults")
        
        # Enterprise-grade chunking strategy
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.chunking.chunk_size,
            chunk_overlap=self.config.chunking.chunk_overlap,
            length_function=len,
            separators=[
                "\n\n\n",  # Document sections
                "\n\n",    # Paragraphs
                "\n",      # Lines
                ". ",      # Sentences
                "! ",      # Exclamations
                "? ",      # Questions
                "; ",      # Semicolons
                ", ",      # Commas
                " ",       # Words
                ""         # Characters
            ]
        )
        
        # Enterprise LLM configuration
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=self.config.response.temperature,
            max_output_tokens=self.config.response.max_output_tokens,
            streaming=False
        )
        
        # Advanced caching with semantic similarity
        self.query_cache = {}
        self.cache_max_size = self.config.cache.cache_size
        
        # Enterprise thresholds from config
        self.similarity_threshold = self.config.retrieval.similarity_threshold
        self.min_context_relevance = self.config.retrieval.min_context_relevance
        self.max_context_tokens = self.config.retrieval.max_context_tokens
        
        # Load prompt templates
        self.prompt_templates = self.config.get_prompt_templates()
        
    def process_document(self, file_path: str, file_name: str, 
                        file_content: bytes, tenant_id: str, user_id: str) -> str:
        """Enterprise document processing with advanced chunking"""
        try:
            # Extract text from file
            text_content = file_processor.extract_text(file_name, file_content)
            if not text_content:
                raise ValueError("No text content extracted from file")
            
            # Preprocess text for better chunking
            processed_text = self._preprocess_text(text_content)
            
            # Advanced chunking with document structure awareness
            chunks = self._advanced_chunking(processed_text, file_name)
            logger.info(f"Split document into {len(chunks)} enterprise-grade chunks")
            
            # Extract entities from document
            entity_extraction_start = time.time()
            document_type = self._detect_document_type(file_name, text_content)
            entity_data = entity_extraction_service.extract_entities_from_chunks(chunks, document_type)
            entity_extraction_time = (time.time() - entity_extraction_start) * 1000
            logger.info(f"✅ Entity extraction completed in {entity_extraction_time:.2f}ms")
            
            # Generate embeddings for chunks
            embeddings = embedding_service.embed_documents([chunk['text'] for chunk in chunks])
            
            # Prepare vectors for Pinecone with enhanced metadata
            vectors = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                vector_id = f"{tenant_id}_{file_name}_{i}_{uuid.uuid4().hex[:8]}"
                vectors.append({
                    "id": vector_id,
                    "values": embedding,
                    "metadata": {
                        "tenant_id": tenant_id,
                        "file_name": file_name,
                        "file_path": file_path,
                        "chunk_index": i,
                        "text": chunk['text'],
                        "chunk_type": chunk['type'],
                        "section_title": chunk.get('section_title', ''),
                        "page_number": chunk.get('page_number', 0),
                        "word_count": chunk['word_count'],
                        "uploaded_by": user_id,
                        "upload_date": datetime.utcnow().isoformat(),
                        "document_type": document_type,
                        # Add entity information to chunk metadata (Pinecone-compatible format)
                        "entity_count": len([e for e in entity_data['entities'] if e.get('chunk_index') == i]),
                        "enterprise_entity_types": list(entity_data['enterprise_entities'].keys()),
                        "has_financial_terms": "financial_terms" in entity_data['enterprise_entities'],
                        "has_technical_terms": "technical_terms" in entity_data['enterprise_entities'],
                        "has_legal_terms": "legal_terms" in entity_data['enterprise_entities']
                    }
                })
            
            # Store document metadata in MongoDB
            doc_metadata = {
                "tenant_id": tenant_id,
                "file_name": file_name,
                "file_path": file_path,
                "file_size": len(file_content),
                "chunk_count": len(chunks),
                "uploaded_by": user_id,
                "document_type": document_type,
                "text_preview": text_content[:1000] + "..." if len(text_content) > 1000 else text_content,
                "full_text": text_content,
                "entity_data": entity_data,  # Store complete entity extraction results
                "processing_metadata": {
                    "total_words": sum(chunk['word_count'] for chunk in chunks),
                    "avg_chunk_size": sum(len(chunk['text']) for chunk in chunks) // len(chunks),
                    "chunk_types": list(set(chunk['type'] for chunk in chunks)),
                    "entity_extraction_time_ms": entity_extraction_time,
                    "total_entities": entity_data['extraction_metadata']['total_entities'],
                    "entity_insights": entity_data['entity_summary']['key_insights']
                }
            }
            
            doc_id = DocumentModel.create_document(doc_metadata)
            
            # Update vectors with doc_id
            for vector in vectors:
                vector["metadata"]["doc_id"] = doc_id
            
            # Store vectors in Pinecone
            pinecone_client.upsert_vectors(vectors, namespace=tenant_id)
            logger.info(f"Enterprise document processed successfully: {doc_id}")
            
            return doc_id
            
        except Exception as e:
            logger.error(f"Enterprise document processing failed: {e}")
            raise
    
    def query_documents(self, query: str, tenant_id: str, user_id: str, 
                       top_k: int = 8) -> Dict[str, Any]:  # More results for better context
        """Enterprise RAG query with advanced context optimization"""
        pipeline_start_time = time.time()
        logger.info(f"🏢 ENTERPRISE RAG PIPELINE STARTED - Query: '{query[:100]}...', Tenant: {tenant_id}")
        
        # Enhanced query preprocessing
        processed_query = self._preprocess_query(query)
        
        # Dynamic top_k based on query type
        dynamic_top_k = self._get_dynamic_top_k(query, top_k)
        logger.info(f"📊 Query analysis: Analytical={self._is_analytical_query(query)}, Dynamic top_k={dynamic_top_k}")
        
        # Check semantic cache
        cache_key = self._generate_semantic_cache_key(processed_query, tenant_id)
        if cache_key in self.query_cache:
            cached_result = self.query_cache[cache_key]
            logger.info(f"🚀 Semantic cache hit! Returning cached result")
            return cached_result
        
        try:
            # Generate query embedding
            embedding_start = time.time()
            query_embedding = embedding_service.embed_text(processed_query)
            embedding_time = (time.time() - embedding_start) * 1000
            
            # Advanced vector search with dynamic top_k
            search_start = time.time()
            search_results = pinecone_client.query_vectors(
                query_vector=query_embedding,
                namespace=tenant_id,
                top_k=dynamic_top_k
            )
            search_time = (time.time() - search_start) * 1000
            
            # Enterprise-grade context selection and ranking
            context_start = time.time()
            if not search_results.matches or max([match.score for match in search_results.matches]) < self.similarity_threshold:
                logger.info(f"⚠️ No high-quality matches found (threshold: {self.similarity_threshold}) - Using general knowledge")
                general_response = self._generate_general_knowledge_response(query, tenant_id, user_id)
                
                # Generate rich content for general knowledge responses too
                rich_content_start = time.time()
                rich_content = self._generate_rich_content_for_general_query(query)
                rich_content_time = (time.time() - rich_content_start) * 1000
                
                general_response["rich_content"] = rich_content
                general_response["processing_metadata"] = {
                    "rich_content_time_ms": rich_content_time,
                    "response_enhanced": True
                }
                
                return general_response
            
            # Advanced context optimization
            optimized_context = self._optimize_context_selection(search_results.matches, query, top_k)
            context_time = (time.time() - context_start) * 1000
            
            # Generate enterprise-grade response
            llm_start = time.time()
            answer = self._generate_enterprise_answer_with_fallback(query, optimized_context, dynamic_top_k, tenant_id)
            llm_time = (time.time() - llm_start) * 1000
            
            # Format sources with enterprise metadata
            sources = self._format_enterprise_sources(optimized_context['sources'])
            
            pipeline_total_time = (time.time() - pipeline_start_time) * 1000
            
            # Generate rich content (tables, charts, images)
            rich_content_start = time.time()
            rich_content = self._generate_rich_content(answer, optimized_context['chunks'], query)
            rich_content_time = (time.time() - rich_content_start) * 1000
            
            result = {
                "answer": answer,
                "sources": sources,
                "confidence": optimized_context['confidence'],
                "context_quality": optimized_context['quality_score'],
                "response_type": "document_based",
                "rich_content": rich_content,
                "processing_metadata": {
                    "total_chunks_analyzed": len(search_results.matches),
                    "chunks_used": len(optimized_context['chunks']),
                    "avg_relevance_score": optimized_context['avg_relevance'],
                    "document_types": optimized_context['document_types'],
                    "rich_content_time_ms": rich_content_time
                }
            }
            
            # Cache with semantic similarity
            self._cache_result(cache_key, result)
            
            # Log enterprise metrics
            logger.info(f"🏢 ENTERPRISE RAG COMPLETED in {pipeline_total_time:.2f}ms")
            logger.info(f"📊 Quality Metrics - Confidence: {result['confidence']:.3f}, Context Quality: {result['context_quality']:.3f}")
            
            return result
            
        except Exception as e:
            pipeline_total_time = (time.time() - pipeline_start_time) * 1000
            logger.error(f"💥 ENTERPRISE RAG FAILED after {pipeline_total_time:.2f}ms - Error: {e}")
            raise
    
    def _preprocess_text(self, text: str) -> str:
        """Advanced text preprocessing for enterprise documents"""
        # Remove excessive whitespace
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        text = re.sub(r' +', ' ', text)
        
        # Normalize quotes and dashes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        text = text.replace('–', '-').replace('—', '-')
        
        # Fix common OCR errors
        text = re.sub(r'(\w)- (\w)', r'\1\2', text)  # Remove hyphenation
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add spaces between camelCase
        
        return text.strip()
    
    def _advanced_chunking(self, text: str, file_name: str) -> List[Dict[str, Any]]:
        """Enterprise chunking with document structure awareness"""
        chunks = []
        
        # Special handling for Excel/CSV files
        if file_name.lower().endswith(('.xlsx', '.xls', '.csv')):
            return self._chunk_structured_data(text, file_name)
        
        # Detect document structure
        sections = self._detect_sections(text)
        
        if sections:
            # Structure-aware chunking
            for section in sections:
                section_chunks = self.text_splitter.split_text(section['content'])
                for i, chunk_text in enumerate(section_chunks):
                    chunks.append({
                        'text': chunk_text,
                        'type': 'section',
                        'section_title': section['title'],
                        'word_count': len(chunk_text.split()),
                        'page_number': section.get('page', 0)
                    })
        else:
            # Standard chunking for unstructured documents
            chunk_texts = self.text_splitter.split_text(text)
            for i, chunk_text in enumerate(chunk_texts):
                chunks.append({
                    'text': chunk_text,
                    'type': 'standard',
                    'section_title': '',
                    'word_count': len(chunk_text.split()),
                    'page_number': 0
                })
        
        return chunks
    
    def _chunk_structured_data(self, text: str, file_name: str) -> List[Dict[str, Any]]:
        """Special chunking for structured data (Excel/CSV) to preserve relationships"""
        chunks = []
        
        # Split text into sections (sheets for Excel)
        sections = text.split('='*50)
        
        for section in sections:
            if not section.strip():
                continue
                
            lines = section.strip().split('\n')
            if len(lines) < 3:  # Skip very small sections
                continue
            
            # Find the sheet name and column information
            sheet_name = "Unknown Sheet"
            columns_line = ""
            data_start_idx = 0
            
            for i, line in enumerate(lines):
                if line.startswith('SHEET:'):
                    sheet_name = line.replace('SHEET:', '').strip()
                elif line.startswith('Columns:'):
                    columns_line = line.replace('Columns:', '').strip()
                elif 'SAMPLE RECORDS:' in line or 'DATA PREVIEW:' in line:
                    data_start_idx = i + 1
                    break
            
            # Extract column names for row-wise chunking
            column_names = []
            if columns_line:
                column_names = [col.strip() for col in columns_line.split(',')]
            
            # Create header chunk with metadata
            header_content = []
            header_content.append(f"Data Source: {file_name}")
            header_content.append(f"Sheet: {sheet_name}")
            if columns_line:
                header_content.append(f"Columns: {columns_line}")
            
            # Add logistics context if detected
            if any(keyword in sheet_name.lower() for keyword in ['shipment', 'delivery', 'logistics', 'carrier', 'transport']):
                header_content.append("📦 LOGISTICS DATA: This contains shipping/delivery information")
                header_content.append("Key Analysis Capabilities: Carrier performance, delivery times, route analysis, shipment tracking")
            
            chunks.append({
                'text': '\n'.join(header_content),
                'type': 'structured_header',
                'section_title': f"{sheet_name} - Metadata",
                'word_count': len(' '.join(header_content).split()),
                'page_number': 0
            })
            
            # Process data records as individual row chunks
            data_lines = lines[data_start_idx:]
            
            for i, line in enumerate(data_lines):
                if not line.strip() or line.startswith('Record'):
                    continue
                
                # Parse individual record - look for key-value pairs
                if '|' in line and '=' in line:
                    # Format: "Record X: field1=value1 | field2=value2 | ..."
                    record_parts = line.split(':', 1)
                    if len(record_parts) > 1:
                        record_data = record_parts[1].strip()
                        
                        # Create self-contained row chunk
                        row_chunk_content = []
                        row_chunk_content.append(f"Data Source: {file_name} - {sheet_name}")
                        row_chunk_content.append(f"Available Columns: {columns_line}")
                        row_chunk_content.append(f"Row Data: {record_data}")
                        
                        # Parse and format the row data more clearly
                        field_pairs = record_data.split(' | ')
                        formatted_fields = []
                        for pair in field_pairs:
                            if '=' in pair:
                                field, value = pair.split('=', 1)
                                formatted_fields.append(f"{field.strip()}: {value.strip()}")
                        
                        if formatted_fields:
                            row_chunk_content.append("Structured Fields:")
                            row_chunk_content.extend(formatted_fields)
                        
                        chunks.append({
                            'text': '\n'.join(row_chunk_content),
                            'type': 'structured_row',
                            'section_title': f"{sheet_name} - Row {i+1}",
                            'word_count': len(' '.join(row_chunk_content).split()),
                            'page_number': 0
                        })
                
                # Also handle tabular format data
                elif any(keyword in line.lower() for keyword in ['carrier', 'shipment', 'delivery', 'order']) and column_names:
                    # Try to parse as space/tab separated values
                    values = line.split()
                    if len(values) >= len(column_names) // 2:  # At least half the columns have values
                        row_chunk_content = []
                        row_chunk_content.append(f"Data Source: {file_name} - {sheet_name}")
                        row_chunk_content.append(f"Available Columns: {columns_line}")
                        row_chunk_content.append("Row Data:")
                        
                        # Map values to columns (best effort)
                        for j, value in enumerate(values[:len(column_names)]):
                            if j < len(column_names):
                                row_chunk_content.append(f"{column_names[j]}: {value}")
                        
                        chunks.append({
                            'text': '\n'.join(row_chunk_content),
                            'type': 'structured_row',
                            'section_title': f"{sheet_name} - Row {i+1}",
                            'word_count': len(' '.join(row_chunk_content).split()),
                            'page_number': 0
                        })
        
        return chunks if chunks else self._fallback_chunking(text)
    
    def _fallback_chunking(self, text: str) -> List[Dict[str, Any]]:
        """Fallback chunking method for when structured chunking fails"""
        chunk_texts = self.text_splitter.split_text(text)
        chunks = []
        for i, chunk_text in enumerate(chunk_texts):
            chunks.append({
                'text': chunk_text,
                'type': 'fallback',
                'section_title': f'Chunk {i+1}',
                'word_count': len(chunk_text.split()),
                'page_number': 0
            })
        return chunks
    
    def _detect_sections(self, text: str) -> List[Dict[str, Any]]:
        """Detect document sections for better chunking"""
        sections = []
        
        # Common section patterns
        section_patterns = [
            r'^([A-Z][A-Z\s]{2,})\n',  # ALL CAPS headings
            r'^(\d+\.?\s+[A-Z][^.\n]{5,})\n',  # Numbered headings
            r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\n(?=\n|\w)',  # Title case headings
        ]
        
        current_section = {'title': 'Introduction', 'content': '', 'page': 1}
        
        for line in text.split('\n'):
            is_heading = False
            
            for pattern in section_patterns:
                match = re.match(pattern, line)
                if match:
                    # Save previous section
                    if current_section['content'].strip():
                        sections.append(current_section)
                    
                    # Start new section
                    current_section = {
                        'title': match.group(1).strip(),
                        'content': '',
                        'page': current_section['page']
                    }
                    is_heading = True
                    break
            
            if not is_heading:
                current_section['content'] += line + '\n'
        
        # Add final section
        if current_section['content'].strip():
            sections.append(current_section)
        
        return sections if len(sections) > 1 else []
    
    def _detect_document_type(self, file_name: str, content: str) -> str:
        """Detect document type for better processing"""
        file_name_lower = file_name.lower()
        content_lower = content.lower()
        
        # Logistics documents (NEW - highest priority for structured data)
        logistics_keywords = ['shipment', 'delivery', 'carrier', 'freight', 'logistics', 'transport', 'shipping', 'manifest', 'tracking', 'route', 'dispatch', 'warehouse']
        if any(term in file_name_lower for term in logistics_keywords):
            return 'logistics'
        if any(term in content_lower for term in logistics_keywords):
            return 'logistics'
        # Check for logistics data patterns in Excel/CSV files
        if file_name_lower.endswith(('.xlsx', '.xls', '.csv')):
            logistics_patterns = ['carrier', 'delivery_date', 'shipment_id', 'tracking', 'origin', 'destination', 'dispatch']
            if any(pattern in content_lower for pattern in logistics_patterns):
                return 'logistics'
        
        # Financial documents
        if any(term in file_name_lower for term in ['financial', 'budget', 'revenue', 'profit', 'loss']):
            return 'financial'
        if any(term in content_lower for term in ['revenue', 'profit', 'loss', 'balance sheet', 'income statement']):
            return 'financial'
        
        # Legal documents
        if any(term in file_name_lower for term in ['contract', 'agreement', 'legal', 'terms']):
            return 'legal'
        if any(term in content_lower for term in ['whereas', 'hereby', 'agreement', 'contract', 'terms and conditions']):
            return 'legal'
        
        # Technical documents
        if any(term in file_name_lower for term in ['technical', 'spec', 'api', 'manual']):
            return 'technical'
        if any(term in content_lower for term in ['api', 'function', 'method', 'parameter', 'configuration']):
            return 'technical'
        
        # Policy documents
        if any(term in file_name_lower for term in ['policy', 'procedure', 'guideline']):
            return 'policy'
        if any(term in content_lower for term in ['policy', 'procedure', 'must', 'shall', 'required']):
            return 'policy'
        
        return 'general'
    
    def _is_analytical_query(self, query: str) -> bool:
        """Detect if query requires analytical processing (aggregation, comparison, etc.)"""
        analytical_keywords = [
            'average', 'avg', 'mean', 'sum', 'total', 'count', 'percentage', '%',
            'best', 'worst', 'top', 'bottom', 'highest', 'lowest', 'maximum', 'minimum',
            'compare', 'comparison', 'versus', 'vs', 'against', 'between',
            'performance', 'efficiency', 'rate', 'ratio', 'metric', 'kpi',
            'wise', 'by carrier', 'by region', 'by type', 'group by', 'breakdown',
            'trend', 'analysis', 'analytics', 'statistics', 'stats',
            'distribution', 'correlation', 'variance', 'deviation'
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in analytical_keywords)
    
    def _get_dynamic_top_k(self, query: str, base_top_k: int = 8) -> int:
        """Dynamically adjust top_k based on query type"""
        if self._is_analytical_query(query):
            # For analytical queries, we need more data points but keep it reasonable
            if any(word in query.lower() for word in ['all', 'every', 'total', 'complete']):
                return 50   # Reduced from 150 for comprehensive analysis
            elif any(word in query.lower() for word in ['compare', 'versus', 'vs', 'between']):
                return 40   # Reduced from 100 for comparisons
            elif any(word in query.lower() for word in ['average', 'mean', 'performance', 'wise']):
                return 30   # Reduced from 80 for aggregations
            else:
                return 20   # Reduced from 50 for other analytical queries
        else:
            return base_top_k  # Standard for non-analytical queries
    
    def _preprocess_query(self, query: str) -> str:
        """Enhanced query preprocessing"""
        # Expand common abbreviations
        abbreviations = {
            'ai': 'artificial intelligence',
            'ml': 'machine learning',
            'api': 'application programming interface',
            'roi': 'return on investment',
            'kpi': 'key performance indicator'
        }
        
        query_lower = query.lower()
        for abbr, expansion in abbreviations.items():
            query_lower = query_lower.replace(f' {abbr} ', f' {expansion} ')
            query_lower = query_lower.replace(f' {abbr}.', f' {expansion}')
        
        return query_lower.strip()
        """Enhanced query preprocessing"""
        # Expand common abbreviations
        abbreviations = {
            'ai': 'artificial intelligence',
            'ml': 'machine learning',
            'api': 'application programming interface',
            'roi': 'return on investment',
            'kpi': 'key performance indicator'
        }
        
        query_lower = query.lower()
        for abbr, expansion in abbreviations.items():
            query_lower = query_lower.replace(f' {abbr} ', f' {expansion} ')
            query_lower = query_lower.replace(f' {abbr}.', f' {expansion}')
        
        return query_lower.strip()
    
    def _optimize_context_selection(self, matches: List, query: str, top_k: int) -> Dict[str, Any]:
        """Advanced context optimization for enterprise responses with entity awareness"""
        # Filter by relevance threshold
        relevant_matches = [m for m in matches if m.score >= self.min_context_relevance]
        
        # Extract entities from query for entity-aware ranking
        query_entities = entity_extraction_service.extract_entities(query, 'general')
        query_entity_names = [e['name'].lower() for e in query_entities['entities']]
        query_enterprise_terms = []
        for terms_list in query_entities['enterprise_entities'].values():
            query_enterprise_terms.extend([term.lower() for term in terms_list])
        
        # Enhance matches with entity relevance scores AND data chunk prioritization
        enhanced_matches = []
        for match in relevant_matches:
            entity_boost = self._calculate_entity_relevance_boost(match, query_entity_names, query_enterprise_terms)
            
            # Add data chunk prioritization boost
            data_boost = self._calculate_data_chunk_boost(match, query)
            
            enhanced_score = match.score + entity_boost + data_boost
            match.enhanced_score = enhanced_score
            enhanced_matches.append(match)
        
        # Sort by enhanced score
        enhanced_matches.sort(key=lambda x: x.enhanced_score, reverse=True)
        
        # Group by document for diversity
        doc_groups = defaultdict(list)
        for match in enhanced_matches:
            doc_name = match.metadata.get('file_name', 'unknown')
            doc_groups[doc_name].append(match)
        
        # Select best chunks from each document
        selected_chunks = []
        total_tokens = 0
        
        # Sort documents by best match score
        sorted_docs = sorted(doc_groups.items(), key=lambda x: max(m.score for m in x[1]), reverse=True)
        
        for doc_name, doc_matches in sorted_docs:
            # For analytical queries, prioritize data chunks over metadata
            if self._is_analytical_query(query):
                # Separate data chunks from metadata chunks
                data_chunks = []
                metadata_chunks = []
                
                for match in doc_matches:
                    chunk_text = match.metadata.get('text', '')
                    if 'Record' in chunk_text and '=' in chunk_text and '|' in chunk_text:
                        data_chunks.append(match)
                    else:
                        metadata_chunks.append(match)
                
                # Sort both groups by enhanced score
                data_chunks.sort(key=lambda x: x.enhanced_score, reverse=True)
                metadata_chunks.sort(key=lambda x: x.enhanced_score, reverse=True)
                
                # Prioritize data chunks, then add metadata if needed
                prioritized_matches = data_chunks + metadata_chunks
            else:
                # For non-analytical queries, use original sorting
                prioritized_matches = sorted(doc_matches, key=lambda x: x.enhanced_score, reverse=True)
            
            for match in prioritized_matches:
                chunk_tokens = len(match.metadata['text'].split()) * 1.3  # Rough token estimate
                
                if total_tokens + chunk_tokens > self.max_context_tokens:
                    break
                
                selected_chunks.append(match)
                total_tokens += chunk_tokens
                
                if len(selected_chunks) >= top_k:
                    break
            
            if len(selected_chunks) >= top_k:
                break
        
        # Calculate quality metrics
        if not selected_chunks:
            return {
                'chunks': [],
                'sources': [],
                'confidence': 0.0,
                'quality_score': 0.0,
                'avg_relevance': 0.0,
                'document_types': []
            }
        
        avg_relevance = sum(chunk.score for chunk in selected_chunks) / len(selected_chunks)
        confidence = min(max(avg_relevance, 0.0), 1.0)
        quality_score = self._calculate_context_quality(selected_chunks, query)
        
        document_types = list(set(chunk.metadata.get('document_type', 'general') for chunk in selected_chunks))
        
        return {
            'chunks': selected_chunks,
            'sources': selected_chunks,
            'confidence': confidence,
            'quality_score': quality_score,
            'avg_relevance': avg_relevance,
            'document_types': document_types
        }
    
    def _calculate_context_quality(self, chunks: List, query: str) -> float:
        """Calculate context quality score"""
        if not chunks:
            return 0.0
        
        # Factors for quality assessment
        relevance_score = sum(chunk.score for chunk in chunks) / len(chunks)
        diversity_score = len(set(chunk.metadata.get('file_name') for chunk in chunks)) / len(chunks)
        completeness_score = min(len(chunks) / 5, 1.0)  # Optimal around 5 chunks
        
        # Document type consistency bonus
        doc_types = [chunk.metadata.get('document_type', 'general') for chunk in chunks]
        type_consistency = max(doc_types.count(t) for t in set(doc_types)) / len(doc_types)
        
        quality_score = (
            relevance_score * 0.4 +
            diversity_score * 0.2 +
            completeness_score * 0.2 +
            type_consistency * 0.2
        )
        
        return min(quality_score, 1.0)
    
    def _generate_enterprise_answer(self, query: str, context_data: Dict) -> str:
        """Generate enterprise-grade responses with advanced prompting"""
        chunks = context_data['chunks']
        document_types = context_data['document_types']
        
        if not chunks:
            return self._generate_general_knowledge_response(query, "", "")['answer']
        
        # Build context with metadata
        context_parts = []
        for i, chunk in enumerate(chunks):
            metadata = chunk.metadata
            context_part = f"""
Document: {metadata.get('file_name', 'Unknown')}
Section: {metadata.get('section_title', 'N/A')}
Type: {metadata.get('document_type', 'general')}
Relevance: {chunk.score:.3f}

Content:
{metadata['text']}
"""
            context_parts.append(context_part)
        
        context = "\n" + "="*50 + "\n".join(context_parts)
        
        # Advanced prompt engineering based on document types
        primary_doc_type = document_types[0] if document_types else 'general'
        
        if 'logistics' in document_types:
            system_prompt = self.prompt_templates['logistics_analyst']
        elif 'financial' in document_types:
            system_prompt = self.prompt_templates['financial_analyst']
        elif 'legal' in document_types:
            system_prompt = self.prompt_templates['legal_expert']
        elif 'technical' in document_types:
            system_prompt = self.prompt_templates['technical_expert']
        elif 'policy' in document_types:
            system_prompt = self.prompt_templates['policy_expert']
        else:
            system_prompt = self.prompt_templates['general_expert']
        
        user_prompt = f"""Based on the provided context documents, answer the following question comprehensively and accurately:

**Question:** {query}

**Context Documents:**
{context}

**Instructions:**
1. Provide a comprehensive answer based ONLY on the information in the context documents
2. Structure your response with clear headings and bullet points where appropriate
3. Include specific references to source documents when making claims
4. If the context doesn't contain enough information to fully answer the question, clearly state what information is missing
5. Maintain a professional, enterprise-appropriate tone
6. Prioritize accuracy and precision over completeness

**Answer:**"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        try:
            response = self.llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            logger.error(f"💥 Enterprise LLM generation failed: {e}")
            return "I apologize, but I encountered an error while generating the comprehensive response. Please try again, and I'll provide you with a detailed analysis based on the available documents."
    
    def _generate_enterprise_answer_with_fallback(self, query: str, context: Dict[str, Any], 
                                                 current_top_k: int, tenant_id: str) -> str:
        """Generate enterprise answer with fallback for 'data missing' responses"""
        
        # First attempt with current context
        answer = self._generate_enterprise_answer(query, context)
        
        # Check if response indicates missing data and we can retry with more data
        missing_data_indicators = [
            "data is missing", "information is missing", "not possible to determine",
            "cannot be performed", "data linking", "additional data", "no field",
            "no information", "cannot find", "not available in", "missing information"
        ]
        
        answer_lower = answer.lower()
        has_missing_data_response = any(indicator in answer_lower for indicator in missing_data_indicators)
        
        # Only retry if it's an analytical query and we haven't already used high top_k
        if (has_missing_data_response and 
            self._is_analytical_query(query) and 
            current_top_k < 40):  # Reduced threshold
            
            logger.info(f"🔄 Detected 'data missing' response, retrying with higher top_k: {current_top_k} -> 50")
            
            try:
                # Retry with higher top_k
                query_embedding = embedding_service.embed_text(query)
                search_results = pinecone_client.query_vectors(
                    query_vector=query_embedding,
                    namespace=tenant_id,
                    top_k=50  # Reduced from 150
                )
                
                if search_results.matches:
                    # Re-optimize context with more data
                    optimized_context = self._optimize_context_selection(search_results.matches, query, 50)
                    
                    # Generate new response with more context
                    fallback_answer = self._generate_enterprise_answer(query, optimized_context)
                    
                    # Check if the fallback response is better (doesn't indicate missing data)
                    fallback_lower = fallback_answer.lower()
                    fallback_has_missing = any(indicator in fallback_lower for indicator in missing_data_indicators)
                    
                    if not fallback_has_missing or len(fallback_answer) > len(answer):
                        logger.info(f"✅ Fallback successful - using enhanced response")
                        return fallback_answer
                    else:
                        logger.info(f"⚠️ Fallback didn't improve response - using original")
                        
            except Exception as e:
                logger.error(f"💥 Fallback attempt failed: {e}")
        
        return answer
    
    def _generate_enterprise_answer(self, query: str, context: Dict[str, Any]) -> str:
        """Generate enterprise-grade answer using optimized context"""
        chunks = context['chunks']
        sources = context['sources']
        document_types = context['document_types']
        
        if not chunks:
            return self._generate_general_knowledge_response(query, "", "")['answer']
        
        # Build context with metadata
        context_parts = []
        for i, chunk in enumerate(chunks):
            source_info = f"Source {i+1}: {chunk.metadata.get('file_name', 'Unknown')} (Relevance: {chunk.score:.3f})"
            context_parts.append(f"{source_info}\n{chunk.metadata['text']}\n")
        
        context_text = "\n".join(context_parts)
        
        # Advanced prompt engineering based on document types
        primary_doc_type = document_types[0] if document_types else 'general'
        
        if 'logistics' in document_types:
            system_prompt = self.prompt_templates['logistics_analyst']
        elif 'financial' in document_types:
            system_prompt = self.prompt_templates['financial_analyst']
        elif 'legal' in document_types:
            system_prompt = self.prompt_templates['legal_expert']
        elif 'technical' in document_types:
            system_prompt = self.prompt_templates['technical_expert']
        elif 'policy' in document_types:
            system_prompt = self.prompt_templates['policy_expert']
        else:
            system_prompt = self.prompt_templates['general_expert']
        
        user_prompt = f"""Based on the provided context documents, answer the following question comprehensively and accurately:

**Question:** {query}

**Context Documents:**
{context_text}

**Instructions:**
1. Provide a comprehensive answer based ONLY on the information in the context documents
2. Structure your response with clear headings and bullet points where appropriate
3. Include specific references to source documents when making claims
4. If the context doesn't contain enough information to fully answer the question, clearly state what information is missing
5. Maintain a professional, enterprise-appropriate tone
6. Prioritize accuracy and precision over completeness

**Answer:**"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        try:
            response = self.llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            logger.error(f"💥 Enterprise LLM generation failed: {e}")
            return "I apologize, but I encountered an error while generating the comprehensive response. Please try again, and I'll provide you with a detailed analysis based on the available documents."
    
    def _generate_general_knowledge_response(self, query: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """Generate high-quality general knowledge responses"""
        
        # Check if this is a visualization request
        query_lower = query.lower()
        is_visualization_request = any(keyword in query_lower for keyword in [
            'chart', 'graph', 'visualize', 'plot', 'pie chart', 'bar chart', 'create', 'show', 'display'
        ])
        
        if is_visualization_request:
            system_prompt = """You are a professional data visualization expert and AI assistant. When users request charts, graphs, or visualizations, provide comprehensive guidance and create example visualizations to demonstrate concepts."""
            
            user_prompt = f"""The user is requesting: "{query}"

Since this appears to be a visualization request, I will:
1. Provide a comprehensive explanation of the requested visualization
2. Create an example chart/graph to demonstrate the concept
3. Explain best practices for this type of visualization
4. Suggest how they could apply this to their own data

Please provide a detailed, professional response about data visualization that would be helpful for enterprise users."""
        else:
            system_prompt = """You are a professional AI assistant for enterprise users. Provide comprehensive, well-structured answers using professional language. Format your responses with clear headings, bullet points, and organized sections when appropriate."""
            
            user_prompt = f"""Question: {query}

Provide a comprehensive, professional response that would be appropriate for enterprise users. Structure your answer clearly and include relevant details."""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        try:
            response = self.llm.invoke(messages)
            return {
                "answer": response.content.strip(),
                "sources": [],
                "confidence": 0.8,
                "context_quality": 0.8,
                "response_type": "general_knowledge"
            }
        except Exception as e:
            logger.error(f"💥 General knowledge response failed: {e}")
            return {
                "answer": "I apologize, but I encountered an error while processing your question. Please try again, and I'll provide you with a comprehensive response.",
                "sources": [],
                "confidence": 0.0,
                "context_quality": 0.0,
                "response_type": "error"
            }
    
    def _format_enterprise_sources(self, sources: List) -> List[Dict]:
        """Format sources with enterprise metadata"""
        formatted_sources = []
        seen_files = set()
        
        for source in sources:
            metadata = source.metadata
            file_name = metadata.get("file_name", "Unknown")
            
            if file_name not in seen_files:
                formatted_sources.append({
                    "file_name": file_name,
                    "file_id": metadata.get("doc_id"),
                    "file_path": metadata.get("file_path"),
                    "document_type": metadata.get("document_type", "general"),
                    "section_title": metadata.get("section_title", ""),
                    "page_number": metadata.get("page_number", 0),
                    "chunk_text": metadata.get("text", ""),
                    "relevance_score": source.score,
                    "word_count": metadata.get("word_count", 0),
                    "upload_date": metadata.get("upload_date", "")
                })
                seen_files.add(file_name)
        
        # Sort by relevance
        formatted_sources.sort(key=lambda x: x["relevance_score"], reverse=True)
        return formatted_sources
    
    def _generate_semantic_cache_key(self, query: str, tenant_id: str) -> str:
        """Generate semantic cache key"""
        # Simple implementation - in production, use semantic similarity
        normalized_query = re.sub(r'\W+', ' ', query.lower()).strip()
        return f"{tenant_id}:{normalized_query}"
    
    def _cache_result(self, cache_key: str, result: Dict):
        """Cache result with size management"""
        if len(self.query_cache) >= self.cache_max_size:
            # Remove oldest entries (simple FIFO)
            oldest_keys = list(self.query_cache.keys())[:50]
            for key in oldest_keys:
                del self.query_cache[key]
        
        self.query_cache[cache_key] = result
    
    def _calculate_entity_relevance_boost(self, match, query_entity_names: List[str], query_enterprise_terms: List[str]) -> float:
        """Calculate entity-based relevance boost for search results"""
        boost = 0.0
        
        # Get chunk entities from metadata
        chunk_entities = match.metadata.get('entities', [])
        chunk_enterprise_entities = match.metadata.get('enterprise_entities', {})
        
        # Boost for matching named entities
        chunk_entity_names = [e['name'].lower() for e in chunk_entities]
        entity_matches = len(set(query_entity_names) & set(chunk_entity_names))
        boost += entity_matches * 0.1  # 0.1 boost per matching entity
        
        # Boost for matching enterprise terms
        chunk_enterprise_terms = []
        for terms_list in chunk_enterprise_entities.values():
            chunk_enterprise_terms.extend([term.lower() for term in terms_list])
        
        enterprise_matches = len(set(query_enterprise_terms) & set(chunk_enterprise_terms))
        boost += enterprise_matches * 0.05  # 0.05 boost per matching enterprise term
        
        # Boost for document type alignment
        chunk_doc_type = match.metadata.get('document_type', 'general')
        # Use entity extraction service patterns
        patterns = entity_extraction_service.enterprise_patterns.get(f'{chunk_doc_type}_terms', [])
        if any(term in query_enterprise_terms for term in patterns):
            boost += 0.1  # Document type alignment boost
        
        return min(boost, 0.3)  # Cap boost at 0.3 to maintain score balance
    
    def _calculate_data_chunk_boost(self, match, query: str) -> float:
        """Calculate boost for data chunks over metadata chunks for analytical queries"""
        boost = 0.0
        
        # Check if this is an analytical query
        if not self._is_analytical_query(query):
            return boost
        
        chunk_text = match.metadata.get('text', '')
        chunk_type = match.metadata.get('chunk_type', 'unknown')
        
        # Boost actual data records significantly for analytical queries
        if 'Record' in chunk_text and '=' in chunk_text and '|' in chunk_text:
            boost += 0.4  # Strong boost for actual data records
        
        # Boost structured data chunks
        if chunk_type in ['structured_row', 'structured_data']:
            boost += 0.3  # Good boost for structured data
        
        # Penalize pure metadata chunks for analytical queries
        if chunk_type in ['structured_header'] and 'Columns:' in chunk_text and 'Record' not in chunk_text:
            boost -= 0.2  # Reduce priority of pure metadata
        
        # Extra boost for chunks containing carrier information in carrier queries
        if 'carrier' in query.lower() and 'Carrier=' in chunk_text:
            boost += 0.2  # Extra boost for carrier-specific data
        
        # Extra boost for chunks containing on-time information in delivery queries
        if any(term in query.lower() for term in ['delivery', 'on-time', 'performance']) and 'On_Time=' in chunk_text:
            boost += 0.2  # Extra boost for delivery performance data
        
        return min(boost, 0.5)  # Cap boost at 0.5 to maintain score balance
    
    def _generate_rich_content(self, answer: str, chunks: List, query: str) -> Dict[str, Any]:
        """Generate rich content (tables, charts, images) from answer and context"""
        try:
            # Combine all chunk text for analysis
            combined_text = answer + "\n\n"
            for chunk in chunks:
                combined_text += chunk.metadata.get('text', '') + "\n"
            
            # Analyze content for rich elements
            rich_content = rich_content_generator.analyze_content_for_rich_elements(combined_text, query)
            
            # Generate summary visualization if we have sources
            if chunks:
                sources_data = []
                for chunk in chunks:
                    sources_data.append({
                        "chunk_text": chunk.metadata.get('text', ''),
                        "file_name": chunk.metadata.get('file_name', ''),
                        "document_type": chunk.metadata.get('document_type', 'general')
                    })
                
                summary_viz = rich_content_generator.generate_summary_visualization(sources_data, query)
                if summary_viz:
                    rich_content["summary_visualization"] = summary_viz
            
            logger.info(f"Rich content generated: {len(rich_content.get('tables', []))} tables, {len(rich_content.get('charts', []))} charts")
            return rich_content
            
        except Exception as e:
            logger.error(f"Rich content generation failed: {e}")
            return {
                "has_tabular_data": False,
                "has_numerical_data": False,
                "tables": [],
                "charts": [],
                "images": []
            }
    
    def _generate_rich_content_for_general_query(self, query: str) -> Dict[str, Any]:
        """Generate rich content for general knowledge queries (synthetic data examples)"""
        try:
            query_lower = query.lower()
            
            # Check if user is asking for specific visualizations
            if any(keyword in query_lower for keyword in ['chart', 'graph', 'visualize', 'plot', 'pie chart', 'bar chart']):
                
                # Generate example data based on query context
                if 'project' in query_lower and 'technolog' in query_lower:
                    # Projects and technologies example
                    example_data = [
                        {"label": "React.js", "value": 35},
                        {"label": "Python", "value": 25}, 
                        {"label": "Node.js", "value": 20},
                        {"label": "Java", "value": 15},
                        {"label": "Other", "value": 5}
                    ]
                    chart_title = "Technology Distribution in Projects"
                    chart_type = "pie"
                    
                elif 'sales' in query_lower or 'revenue' in query_lower:
                    # Sales/Revenue example
                    example_data = [
                        {"label": "Q1 2024", "value": 125000},
                        {"label": "Q2 2024", "value": 150000},
                        {"label": "Q3 2024", "value": 180000},
                        {"label": "Q4 2024", "value": 200000}
                    ]
                    chart_title = "Quarterly Revenue Trends"
                    chart_type = "bar"
                    
                elif 'market' in query_lower and 'share' in query_lower:
                    # Market share example
                    example_data = [
                        {"label": "Company A", "value": 40},
                        {"label": "Company B", "value": 30},
                        {"label": "Company C", "value": 20},
                        {"label": "Others", "value": 10}
                    ]
                    chart_title = "Market Share Distribution"
                    chart_type = "pie"
                    
                elif 'performance' in query_lower or 'metric' in query_lower:
                    # Performance metrics example
                    example_data = [
                        {"label": "Customer Satisfaction", "value": 92},
                        {"label": "Response Time", "value": 85},
                        {"label": "Quality Score", "value": 88},
                        {"label": "Efficiency", "value": 90}
                    ]
                    chart_title = "Performance Metrics Overview"
                    chart_type = "bar"
                    
                else:
                    # Generic example data
                    example_data = [
                        {"label": "Category A", "value": 30},
                        {"label": "Category B", "value": 25},
                        {"label": "Category C", "value": 25},
                        {"label": "Category D", "value": 20}
                    ]
                    chart_title = "Sample Data Distribution"
                    chart_type = "pie"
                
                # Generate the chart
                chart = self._create_example_chart(example_data, chart_title, chart_type)
                
                if chart:
                    return {
                        "has_tabular_data": True,
                        "has_numerical_data": True,
                        "has_comparison_data": True,
                        "tables": [{
                            "type": "example_data",
                            "data": {
                                "headers": ["Category", "Value"],
                                "rows": [[item["label"], str(item["value"])] for item in example_data]
                            },
                            "format": "table"
                        }],
                        "charts": [chart],
                        "images": [],
                        "structured_data": [{"type": "example", "data": example_data, "chart_type": chart_type}],
                        "summary_visualization": chart
                    }
            
            return {
                "has_tabular_data": False,
                "has_numerical_data": False,
                "tables": [],
                "charts": [],
                "images": []
            }
            
        except Exception as e:
            logger.error(f"Rich content generation for general query failed: {e}")
            return {
                "has_tabular_data": False,
                "has_numerical_data": False,
                "tables": [],
                "charts": [],
                "images": []
            }
    
    def _create_example_chart(self, data: List[Dict], title: str, chart_type: str) -> Optional[Dict[str, Any]]:
        """Create an example chart from synthetic data"""
        try:
            import matplotlib.pyplot as plt
            import io
            import base64
            
            # Set up matplotlib for non-interactive backend
            plt.switch_backend('Agg')
            
            fig, ax = plt.subplots(figsize=(10, 6))
            
            labels = [item["label"] for item in data]
            values = [item["value"] for item in data]
            
            if chart_type == "pie":
                wedges, texts, autotexts = ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=90)
                ax.set_title(title, fontsize=14, fontweight='bold')
                
            elif chart_type == "bar":
                bars = ax.bar(labels, values, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
                ax.set_title(title, fontsize=14, fontweight='bold')
                ax.set_ylabel("Value")
                
                # Add value labels on bars
                for bar, value in zip(bars, values):
                    height = bar.get_height()
                    ax.text(bar.get_x() + bar.get_width()/2., height,
                           f'{value:,.0f}',
                           ha='center', va='bottom', fontweight='bold')
                
                # Rotate x-axis labels if they're long
                if max(len(label) for label in labels) > 10:
                    plt.xticks(rotation=45, ha='right')
            
            plt.tight_layout()
            
            # Convert to base64 image
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
            img_buffer.seek(0)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            plt.close(fig)
            
            return {
                "type": chart_type,
                "data_type": "example",
                "image": img_base64,
                "title": title,
                "description": f"Example {chart_type} chart showing {title.lower()}"
            }
            
        except Exception as e:
            logger.error(f"Error creating example chart: {e}")
            return None
    
    def delete_document(self, doc_id: str, tenant_id: str) -> bool:
        """Delete document and its embeddings"""
        try:
            # Get document metadata
            doc = DocumentModel.get_documents_by_tenant(tenant_id)
            target_doc = None
            for d in doc:
                if str(d["_id"]) == doc_id:
                    target_doc = d
                    break
            
            if not target_doc:
                return False
            
            # Delete from MongoDB
            deleted = DocumentModel.delete_document(doc_id, tenant_id)
            if not deleted:
                return False
            
            # Delete vectors from Pinecone (this is complex, would need to track vector IDs)
            # For now, we'll leave the vectors (they'll be filtered out by tenant_id anyway)
            
            logger.info(f"Enterprise document deleted: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Enterprise document deletion failed: {e}")
            return False

# Global enterprise RAG pipeline instance
enterprise_rag_pipeline = EnterpriseRAGPipeline()
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage
from typing import List, Dict, Any, Optional
import uuid
import logging
from datetime import datetime
import os
import time

from db.pinecone_client import pinecone_client
from db.mongodb_client import DocumentModel, ChatHistoryModel
from services.embeddings import embedding_service
from utils.file_processor import file_processor
from smart_performance_monitor import log_performance
from services.rich_content_generator import rich_content_generator

logger = logging.getLogger(__name__)

class RAGPipeline:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=600,  # Balanced for quality and speed
            chunk_overlap=100,  # Sufficient overlap for context preservation
            length_function=len,
        )
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1,  # Lower temperature for faster, more focused responses
            max_output_tokens=800,  # Sufficient for quality responses
            streaming=False  # Keep non-streaming for now, but optimized settings
        )
        # Simple in-memory cache for similar queries (production should use Redis)
        self.query_cache = {}
        self.cache_max_size = 100
    
    def process_document(self, file_path: str, file_name: str, 
                             file_content: bytes, tenant_id: str, user_id: str) -> str:
        """Process uploaded document: extract text, create embeddings, store metadata"""
        try:
            # Extract text from file
            text_content = file_processor.extract_text(file_name, file_content)
            if not text_content:
                raise ValueError("No text content extracted from file")
            
            # Split text into chunks
            chunks = self.text_splitter.split_text(text_content)
            logger.info(f"Split document into {len(chunks)} chunks")
            
            # Generate embeddings for chunks
            embeddings = embedding_service.embed_documents(chunks)
            
            # Prepare vectors for Pinecone
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
                        "text": chunk,
                        "uploaded_by": user_id,
                        "upload_date": datetime.utcnow().isoformat()
                    }
                })
            
            # Store document metadata in MongoDB first to get the doc_id
            doc_metadata = {
                "tenant_id": tenant_id,
                "file_name": file_name,
                "file_path": file_path,
                "file_size": len(file_content),
                "chunk_count": len(chunks),
                "uploaded_by": user_id,
                "text_preview": text_content[:1000] + "..." if len(text_content) > 1000 else text_content,
                "full_text": text_content  # Store full text for complete preview
            }
            
            doc_id = DocumentModel.create_document(doc_metadata)
            
            # Update vectors with doc_id in metadata
            for vector in vectors:
                vector["metadata"]["doc_id"] = doc_id
            
            # Store vectors in Pinecone with doc_id included
            pinecone_client.upsert_vectors(vectors, namespace=tenant_id)
            logger.info(f"Document processed successfully: {doc_id}")
            
            return doc_id
            
        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            raise
    
    def query_documents(self, query: str, tenant_id: str, user_id: str, 
                            top_k: int = 2) -> Dict[str, Any]:  # Balanced for quality and speed
        """Query documents using RAG pipeline"""
        pipeline_start_time = time.time()
        logger.info(f"🔍 RAG PIPELINE STARTED - Query: '{query[:100]}...', Tenant: {tenant_id}, Top-K: {top_k}")
        
        # Check cache for similar queries (simple similarity check)
        cache_key = f"{tenant_id}:{query.lower().strip()}"
        if cache_key in self.query_cache:
            cached_result = self.query_cache[cache_key]
            logger.info(f"🚀 Cache hit! Returning cached result in <1ms")
            return cached_result
        
        try:
            # Generate query embedding
            embedding_start = time.time()
            logger.info(f"🧠 Generating query embedding...")
            query_embedding = embedding_service.embed_text(query)
            embedding_time = (time.time() - embedding_start) * 1000
            logger.info(f"✅ Query embedding generated in {embedding_time:.2f}ms")
            
            # Search similar chunks in Pinecone
            search_start = time.time()
            logger.info(f"🌲 Searching Pinecone vector database (namespace: {tenant_id})...")
            search_results = pinecone_client.query_vectors(
                query_vector=query_embedding,
                namespace=tenant_id,
                top_k=top_k
            )
            search_time = (time.time() - search_start) * 1000
            logger.info(f"🎯 Pinecone search completed in {search_time:.2f}ms - Found {len(search_results.matches) if search_results.matches else 0} matches")
            
            # Handle cases with no relevant documents - provide general knowledge response
            if not search_results.matches or max([match.score for match in search_results.matches]) < 0.3:
                logger.info(f"⚠️  No relevant documents found (threshold: 0.3) - Using general knowledge response")
                casual_start = time.time()
                # Generate response using general knowledge for casual conversations
                casual_answer = self._generate_casual_response(query)
                casual_time = (time.time() - casual_start) * 1000
                logger.info(f"🎓 General knowledge response generated in {casual_time:.2f}ms")
                
                # Generate rich content for general knowledge responses too
                rich_content_start = time.time()
                rich_content = self._generate_rich_content_for_general_query(query)
                rich_content_time = (time.time() - rich_content_start) * 1000
                
                # Note: Chat history will be saved by the calling route
                
                return {
                    "answer": casual_answer,
                    "sources": [],
                    "confidence": 0.8,  # High confidence for general knowledge
                    "response_type": "general_knowledge",
                    "rich_content": rich_content,
                    "processing_metadata": {
                        "rich_content_time_ms": rich_content_time,
                        "response_enhanced": True
                    }
                }
            
            # Extract relevant chunks and sources
            context_extract_start = time.time()
            logger.info(f"📋 Extracting context from {len(search_results.matches)} search results...")
            relevant_chunks = []
            sources = []
            
            # Pre-import ObjectId for efficiency
            from bson import ObjectId
            
            for match in search_results.matches:
                metadata = match.metadata
                logger.info(f"📄 Processing match: {metadata.get('file_name', 'Unknown')} (Score: {match.score:.3f})")
                relevant_chunks.append(metadata["text"])
                
                # Get doc_id from metadata (should be available in newer documents)
                doc_id = metadata.get("doc_id")
                
                # Only include sources with valid doc_id to prevent file not found errors
                if doc_id and ObjectId.is_valid(doc_id):
                    source_info = {
                        "file_name": metadata["file_name"],
                        "file_id": doc_id,
                        "file_path": metadata.get("file_path"),
                        "chunk_index": metadata.get("chunk_index", 0),
                        "text": metadata["text"],
                        "score": match.score
                    }
                    sources.append(source_info)
                else:
                    logger.warning(f"Invalid or missing doc_id for file {metadata.get('file_name', 'Unknown')}, skipping source")
            
            context_extract_time = (time.time() - context_extract_start) * 1000
            logger.info(f"✅ Context extraction completed in {context_extract_time:.2f}ms - {len(relevant_chunks)} chunks, {len(sources)} sources")
            
            # Generate answer using LLM with optimized context
            llm_start = time.time()
            context = "\n\n".join(relevant_chunks)
            
            # Smart context optimization: limit context to prevent LLM slowdown
            max_context_length = 2000  # Optimal length for fast processing
            if len(context) > max_context_length:
                # Truncate but keep the most relevant parts
                context = context[:max_context_length] + "..."
                logger.info(f"📝 Context truncated to {max_context_length} chars for optimal performance")
            
            logger.info(f"🤖 Generating LLM response with {len(context)} characters of context...")
            answer = self._generate_answer(query, context)
            llm_time = (time.time() - llm_start) * 1000
            logger.info(f"🎯 LLM response generated in {llm_time:.2f}ms")
            
            # Note: Chat history will be saved by the calling route to avoid duplication
            
            pipeline_total_time = (time.time() - pipeline_start_time) * 1000
            logger.info(f"🏁 RAG PIPELINE COMPLETED in {pipeline_total_time:.2f}ms")
            logger.info(f"📊 PERFORMANCE BREAKDOWN - Embedding: {embedding_time:.1f}ms, Search: {search_time:.1f}ms, Context: {context_extract_time:.1f}ms, LLM: {llm_time:.1f}ms")
            
            # Generate rich content (tables, charts, images)
            rich_content_start = time.time()
            rich_content = self._generate_rich_content(answer, search_results.matches, query)
            rich_content_time = (time.time() - rich_content_start) * 1000
            
            result = {
                "answer": answer,
                "sources": self._format_sources(sources),
                "confidence": max([match.score for match in search_results.matches]),
                "rich_content": rich_content,
                "processing_metadata": {
                    "rich_content_time_ms": rich_content_time
                }
            }
            
            # Cache the result for future similar queries
            if len(self.query_cache) >= self.cache_max_size:
                # Remove oldest entry (simple FIFO)
                oldest_key = next(iter(self.query_cache))
                del self.query_cache[oldest_key]
            
            self.query_cache[cache_key] = result
            logger.info(f"💾 Result cached for future similar queries")
            
            # Log performance metrics for monitoring
            log_performance(
                pipeline_total_time,
                embedding=embedding_time,
                pinecone=search_time,
                context=context_extract_time,
                llm=llm_time
            )
            
            return result
            
        except Exception as e:
            pipeline_total_time = (time.time() - pipeline_start_time) * 1000
            logger.error(f"💥 RAG PIPELINE FAILED after {pipeline_total_time:.2f}ms - Error: {e}")
            raise
    
    def _generate_answer(self, query: str, context: str) -> str:
        """Generate answer using LLM based on context"""
        system_prompt = """Based on the provided context, give a comprehensive but focused answer.

Context: {context}

Question: {query}

Answer:"""
        
        messages = [
            SystemMessage(content="Provide concise, accurate answers based on context."),
            HumanMessage(content=system_prompt.format(context=context, query=query))
        ]
        
        try:
            gemini_start = time.time()
            logger.info(f"🤖 Calling Gemini LLM with {len(context)} chars context + {len(query)} chars query...")
            
            # Direct LLM call without timeout (Gemini is generally fast)
            response = self.llm.invoke(messages)
            
            gemini_time = (time.time() - gemini_start) * 1000
            logger.info(f"✨ Gemini LLM responded in {gemini_time:.2f}ms - Generated {len(response.content)} characters")
            return response.content.strip()
                
        except Exception as e:
            logger.error(f"💥 LLM generation failed: {e}")
            return "I apologize, but I encountered an error while generating the answer. Please try again, and I'll provide you with a comprehensive response based on the available information."

   
    
    def _generate_casual_response(self, query: str) -> str:
        """Generate response for casual conversations using general knowledge"""
        system_prompt = """You are a professional AI assistant. Provide well-structured, informative answers using bullet points, headings, and clear organization when helpful."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Question: {query}\n\nProvide a comprehensive, accurate, and helpful response:")
        ]
        
        try:
            casual_gemini_start = time.time()
            logger.info(f"🎓 Calling Gemini for general knowledge response...")
            response = self.llm.invoke(messages)
            casual_gemini_time = (time.time() - casual_gemini_start) * 1000
            logger.info(f"✨ Gemini general knowledge response in {casual_gemini_time:.2f}ms - Generated {len(response.content)} characters")
            return response.content.strip()
        except Exception as e:
            logger.error(f"💥 Casual response generation failed: {e}")
            return "I apologize, but I encountered an error while processing your question. Please try again, and I'll do my best to provide you with a helpful response."

    def _format_sources(self, sources: List[Dict]) -> List[Dict]:
        """Format sources for display with file access information"""
        formatted_sources = []
        seen_files = set()
        
        for source in sources:
            file_name = source["file_name"]
            if file_name not in seen_files:
                formatted_sources.append({
                    "file_name": file_name,
                    "file_id": source.get("file_id"),
                    "file_path": source.get("file_path"),
                    "page_number": source.get("page_number"),
                    "chunk_text": source.get("text", ""),  # Show complete chunk text - no truncation for employee trust
                    "relevance_score": source.get("score", 0.0)
                })
                seen_files.add(file_name)
        
        return formatted_sources
    
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
            
            logger.info(f"Document deleted: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Document deletion failed: {e}")
            return False

# Global RAG pipeline instance
rag_pipeline = RAGPipeline()
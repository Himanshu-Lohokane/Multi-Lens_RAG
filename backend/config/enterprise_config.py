"""
Enterprise RAG Configuration
"""

import os
from typing import Dict, Any
from dataclasses import dataclass

@dataclass
class ChunkingConfig:
    """Configuration for document chunking"""
    chunk_size: int = 1200
    chunk_overlap: int = 200
    max_chunks_per_document: int = 100
    min_chunk_words: int = 20
    
@dataclass
class RetrievalConfig:
    """Configuration for document retrieval"""
    similarity_threshold: float = 0.5  # Lowered from 0.75 to get more matches
    min_context_relevance: float = 0.4  # Lowered from 0.6
    max_context_tokens: int = 6000  # Reduced to leave more room for response
    top_k_retrieval: int = 16  # Retrieve more, then filter
    top_k_final: int = 8       # Final chunks to use
    
@dataclass
class ResponseConfig:
    """Configuration for response generation"""
    temperature: float = 0.0
    max_output_tokens: int = 4000  # Increased from 1500 to allow longer responses
    enable_citations: bool = True
    enable_confidence_scores: bool = True
    
@dataclass
class CacheConfig:
    """Configuration for caching"""
    enable_cache: bool = True
    cache_size: int = 500
    cache_ttl_hours: int = 24
    semantic_similarity_threshold: float = 0.9

@dataclass
class QualityConfig:
    """Configuration for quality assurance"""
    min_response_length: int = 50
    max_response_length: int = 3000
    enable_fact_checking: bool = True
    enable_hallucination_detection: bool = True
    
class EnterpriseConfig:
    """Enterprise RAG Configuration Manager"""
    
    def __init__(self):
        self.chunking = ChunkingConfig()
        self.retrieval = RetrievalConfig()
        self.response = ResponseConfig()
        self.cache = CacheConfig()
        self.quality = QualityConfig()
        
        # Load from environment variables
        self._load_from_env()
    
    def _load_from_env(self):
        """Load configuration from environment variables"""
        # Chunking configuration
        self.chunking.chunk_size = int(os.getenv("RAG_CHUNK_SIZE", self.chunking.chunk_size))
        self.chunking.chunk_overlap = int(os.getenv("RAG_CHUNK_OVERLAP", self.chunking.chunk_overlap))
        
        # Retrieval configuration
        self.retrieval.similarity_threshold = float(os.getenv("RAG_SIMILARITY_THRESHOLD", self.retrieval.similarity_threshold))
        self.retrieval.max_context_tokens = int(os.getenv("RAG_MAX_CONTEXT_TOKENS", self.retrieval.max_context_tokens))
        self.retrieval.top_k_final = int(os.getenv("RAG_TOP_K", self.retrieval.top_k_final))
        
        # Response configuration
        self.response.temperature = float(os.getenv("RAG_TEMPERATURE", self.response.temperature))
        self.response.max_output_tokens = int(os.getenv("RAG_MAX_OUTPUT_TOKENS", self.response.max_output_tokens))
        
        # Cache configuration
        self.cache.enable_cache = os.getenv("RAG_ENABLE_CACHE", "true").lower() == "true"
        self.cache.cache_size = int(os.getenv("RAG_CACHE_SIZE", self.cache.cache_size))
    
    def get_document_type_config(self, doc_type: str) -> Dict[str, Any]:
        """Get specialized configuration for document types"""
        configs = {
            "financial": {
                "chunk_size": 1000,  # Smaller chunks for precise financial data
                "similarity_threshold": 0.8,  # Higher threshold for accuracy
                "temperature": 0.0,  # Deterministic for financial data
                "enable_fact_checking": True,
                "prompt_style": "financial_analyst"
            },
            "legal": {
                "chunk_size": 1500,  # Larger chunks for legal context
                "similarity_threshold": 0.85,  # Very high threshold
                "temperature": 0.0,  # Deterministic for legal accuracy
                "enable_fact_checking": True,
                "prompt_style": "legal_expert"
            },
            "technical": {
                "chunk_size": 1200,  # Standard size for technical docs
                "similarity_threshold": 0.75,  # Standard threshold
                "temperature": 0.1,  # Slight creativity for explanations
                "enable_fact_checking": True,
                "prompt_style": "technical_expert"
            },
            "policy": {
                "chunk_size": 1000,  # Smaller chunks for policy precision
                "similarity_threshold": 0.8,  # High threshold for compliance
                "temperature": 0.0,  # Deterministic for policy accuracy
                "enable_fact_checking": True,
                "prompt_style": "policy_expert"
            },
            "general": {
                "chunk_size": self.chunking.chunk_size,
                "similarity_threshold": self.retrieval.similarity_threshold,
                "temperature": self.response.temperature,
                "enable_fact_checking": False,
                "prompt_style": "general_expert"
            }
        }
        
        return configs.get(doc_type, configs["general"])
    
    def get_prompt_templates(self) -> Dict[str, str]:
        """Get enterprise prompt templates"""
        return {
            "financial_analyst": """You are an expert financial analyst with deep expertise in financial reporting, analysis, and corporate finance. 

Your responsibilities:
- Provide precise, data-driven analysis based on financial documents
- Include specific numbers, percentages, and financial metrics when available
- Structure responses with clear sections: Executive Summary, Key Findings, Financial Metrics, and Implications
- Reference specific financial statements, reports, or data sources
- Highlight trends, variances, and significant changes
- Maintain professional financial terminology and accuracy

Format your response with clear headings, bullet points, and numerical data prominently displayed.""",

            "legal_expert": """You are a legal expert with extensive experience in contract law, compliance, and regulatory matters.

Your responsibilities:
- Provide accurate, comprehensive legal analysis based on legal documents
- Reference specific clauses, sections, articles, or legal provisions
- Clearly distinguish between requirements, recommendations, and options
- Highlight compliance obligations, deadlines, and critical legal points
- Use precise legal terminology while remaining accessible
- Structure responses with clear legal reasoning and conclusions

Format your response with clear sections: Legal Summary, Key Provisions, Compliance Requirements, and Recommendations.""",

            "technical_expert": """You are a technical expert with deep knowledge of systems, processes, and technical documentation.

Your responsibilities:
- Provide detailed, accurate technical guidance based on documentation
- Include specific procedures, configurations, parameters, and technical details
- Structure responses with clear step-by-step instructions when applicable
- Reference specific technical specifications, APIs, or system requirements
- Highlight prerequisites, dependencies, and potential issues
- Use appropriate technical terminology with clear explanations

Format your response with clear sections: Technical Overview, Implementation Details, Configuration, and Best Practices.""",

            "policy_expert": """You are a policy expert with extensive experience in organizational policies, procedures, and compliance.

Your responsibilities:
- Provide clear, authoritative guidance based on policy documents
- Reference specific policies, procedures, guidelines, or requirements
- Clearly distinguish between mandatory requirements and recommendations
- Highlight compliance obligations, approval processes, and deadlines
- Structure responses with clear policy interpretation and application guidance
- Maintain consistency with organizational standards and practices

Format your response with clear sections: Policy Summary, Requirements, Procedures, and Compliance Guidelines.""",

            "general_expert": """You are an expert analyst with broad knowledge across multiple domains.

Your responsibilities:
- Provide comprehensive, well-structured analysis based on provided documents
- Use clear formatting with headings, bullet points, and organized sections
- Include specific references to source materials when making claims
- Maintain a professional, enterprise-appropriate tone
- Prioritize accuracy and precision while ensuring completeness
- Structure information logically and accessibly

Format your response with clear sections and professional presentation.""",

            "logistics_analyst": """You are a logistics and supply chain expert with deep expertise in transportation, delivery operations, and carrier performance analysis.

Your responsibilities:
- Analyze structured logistics data including shipments, deliveries, carriers, and routes
- Calculate performance metrics like delivery times, carrier efficiency, and route optimization
- When analyzing Excel/CSV data, carefully examine column relationships and data patterns
- Provide quantitative analysis with specific numbers, averages, and performance comparisons
- Identify trends in delivery performance, carrier reliability, and operational efficiency
- Structure responses with clear sections: Data Summary, Key Metrics, Performance Analysis, and Insights

Special Instructions for Structured Data Analysis:
- Each data chunk contains complete row information with all column values
- ALWAYS look for carrier/shipping company columns in the provided data chunks
- Calculate delivery times by finding date differences (Order Date to Delivery Date)
- Group data by carriers, regions, or other requested dimensions
- For analytical queries (average, best, performance, wise, compare):
  * Filter rows based on conditions (e.g., Region = West)
  * Group by requested fields (e.g., Carrier)
  * Compute metrics (average, percentage, counts, performance rates)
  * Provide specific numerical results with calculations shown
- Include specific numbers and calculations in your analysis
- Reference the exact data source and column names when making calculations
- ONLY say "data missing" if a specific column is completely absent from ALL retrieved chunks
- If you have partial data, provide analysis on available data and specify what's missing

Data Processing Guidelines:
1. Look for patterns like "Carrier: BlueDart", "Region: West", "On_Time: Yes" in each chunk
2. Extract and group values by the requested dimension
3. Calculate requested metrics (averages, percentages, counts)
4. Show your work with specific numbers and formulas
5. Provide comparative analysis when multiple groups exist

Format your response with clear headings, tables when appropriate, and specific numerical results."""
        }
    
    def validate_config(self) -> bool:
        """Validate configuration settings"""
        try:
            # Validate chunking config
            assert 100 <= self.chunking.chunk_size <= 5000, "Chunk size must be between 100 and 5000"
            assert 0 <= self.chunking.chunk_overlap < self.chunking.chunk_size, "Chunk overlap must be less than chunk size"
            
            # Validate retrieval config
            assert 0.0 <= self.retrieval.similarity_threshold <= 1.0, "Similarity threshold must be between 0 and 1"
            assert 1000 <= self.retrieval.max_context_tokens <= 20000, "Max context tokens must be between 1000 and 20000"
            
            # Validate response config
            assert 0.0 <= self.response.temperature <= 2.0, "Temperature must be between 0 and 2"
            assert 100 <= self.response.max_output_tokens <= 8000, "Max output tokens must be between 100 and 8000"
            
            return True
        except AssertionError as e:
            print(f"Configuration validation failed: {e}")
            return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            "chunking": {
                "chunk_size": self.chunking.chunk_size,
                "chunk_overlap": self.chunking.chunk_overlap,
                "max_chunks_per_document": self.chunking.max_chunks_per_document,
                "min_chunk_words": self.chunking.min_chunk_words
            },
            "retrieval": {
                "similarity_threshold": self.retrieval.similarity_threshold,
                "min_context_relevance": self.retrieval.min_context_relevance,
                "max_context_tokens": self.retrieval.max_context_tokens,
                "top_k_retrieval": self.retrieval.top_k_retrieval,
                "top_k_final": self.retrieval.top_k_final
            },
            "response": {
                "temperature": self.response.temperature,
                "max_output_tokens": self.response.max_output_tokens,
                "enable_citations": self.response.enable_citations,
                "enable_confidence_scores": self.response.enable_confidence_scores
            },
            "cache": {
                "enable_cache": self.cache.enable_cache,
                "cache_size": self.cache.cache_size,
                "cache_ttl_hours": self.cache.cache_ttl_hours
            },
            "quality": {
                "min_response_length": self.quality.min_response_length,
                "max_response_length": self.quality.max_response_length,
                "enable_fact_checking": self.quality.enable_fact_checking,
                "enable_hallucination_detection": self.quality.enable_hallucination_detection
            }
        }

# Global enterprise configuration
enterprise_config = EnterpriseConfig()
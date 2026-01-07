"""
Enterprise Entity Extraction Service using Google Cloud NLP API
"""

import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from collections import defaultdict, Counter
import re

logger = logging.getLogger(__name__)

class EntityExtractionService:
    """Enterprise-grade entity extraction using Google Cloud NLP API"""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
        
        # Entity type mappings for enterprise use
        self.entity_type_mapping = {
            'PERSON': 'people',
            'ORGANIZATION': 'organizations', 
            'LOCATION': 'locations',
            'EVENT': 'events',
            'WORK_OF_ART': 'works_of_art',
            'CONSUMER_GOOD': 'products',
            'OTHER': 'other',
            'UNKNOWN': 'unknown',
            'PHONE_NUMBER': 'contact_info',
            'ADDRESS': 'addresses',
            'DATE': 'dates',
            'NUMBER': 'numbers',
            'PRICE': 'financial_data'
        }
        
        # Enterprise-specific entity patterns
        self.enterprise_patterns = {
            'financial_metrics': [
                'revenue', 'profit', 'loss', 'margin', 'roi', 'ebitda', 'cash flow',
                'quarterly', 'annual', 'budget', 'forecast', 'earnings'
            ],
            'business_terms': [
                'strategy', 'initiative', 'project', 'milestone', 'deadline',
                'stakeholder', 'customer', 'client', 'vendor', 'supplier'
            ],
            'technical_terms': [
                'api', 'database', 'server', 'application', 'system', 'platform',
                'integration', 'deployment', 'configuration', 'architecture'
            ],
            'legal_terms': [
                'contract', 'agreement', 'clause', 'compliance', 'regulation',
                'policy', 'procedure', 'requirement', 'obligation', 'liability'
            ]
        }
    
    def _initialize_client(self):
        """Initialize Google Cloud NLP client"""
        try:
            from google.cloud import language_v1
            from google.oauth2 import service_account
            
            # Use service account file if available
            service_account_path = os.getenv("GCS_SERVICE_ACCOUNT_FILE")
            if service_account_path and os.path.exists(service_account_path):
                credentials = service_account.Credentials.from_service_account_file(
                    service_account_path,
                    scopes=['https://www.googleapis.com/auth/cloud-platform']
                )
                self.client = language_v1.LanguageServiceClient(credentials=credentials)
                logger.info("✅ Google Cloud NLP client initialized with service account")
            else:
                # Fallback to default credentials
                self.client = language_v1.LanguageServiceClient()
                logger.info("✅ Google Cloud NLP client initialized with default credentials")
                
        except ImportError:
            logger.warning("Google Cloud NLP library not available, using fallback extraction")
            self.client = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize Google Cloud NLP client: {e}")
            self.client = None
    
    def extract_entities(self, text: str, document_type: str = 'general') -> Dict[str, Any]:
        """Extract entities from text using Google Cloud NLP API"""
        if not self.client:
            logger.warning("NLP client not available, using fallback entity extraction")
            return self._fallback_entity_extraction(text, document_type)
        
        try:
            from google.cloud import language_v1
            
            # Prepare the document
            document = language_v1.Document(
                content=text,
                type_=language_v1.Document.Type.PLAIN_TEXT
            )
            
            # Extract entities
            entities_response = self.client.analyze_entities(
                request={'document': document, 'encoding_type': language_v1.EncodingType.UTF8}
            )
            
            # Extract sentiment for context
            sentiment_response = self.client.analyze_sentiment(
                request={'document': document, 'encoding_type': language_v1.EncodingType.UTF8}
            )
            
            # Process entities
            processed_entities = self._process_entities(entities_response.entities, document_type)
            
            # Add enterprise-specific entities
            enterprise_entities = self._extract_enterprise_entities(text, document_type)
            
            # Combine results
            result = {
                'entities': processed_entities,
                'enterprise_entities': enterprise_entities,
                'sentiment': {
                    'score': sentiment_response.document_sentiment.score,
                    'magnitude': sentiment_response.document_sentiment.magnitude
                },
                'entity_summary': self._create_entity_summary(processed_entities, enterprise_entities),
                'extraction_metadata': {
                    'text_length': len(text),
                    'entity_count': len(processed_entities),
                    'enterprise_entity_count': sum(len(v) for v in enterprise_entities.values()),
                    'document_type': document_type,
                    'extraction_timestamp': datetime.utcnow().isoformat()
                }
            }
            
            logger.info(f"✅ Extracted {len(processed_entities)} entities and {sum(len(v) for v in enterprise_entities.values())} enterprise entities")
            return result
            
        except Exception as e:
            logger.error(f"❌ Entity extraction failed: {e}")
            return self._fallback_entity_extraction(text, document_type)
    
    def _process_entities(self, entities: List, document_type: str) -> List[Dict[str, Any]]:
        """Process Google Cloud NLP entities"""
        processed = []
        
        for entity in entities:
            entity_type = self.entity_type_mapping.get(entity.type_.name, 'other')
            
            processed_entity = {
                'name': entity.name,
                'type': entity_type,
                'original_type': entity.type_.name,
                'salience': entity.salience,
                'mentions': [],
                'metadata': dict(entity.metadata) if entity.metadata else {}
            }
            
            # Process mentions
            for mention in entity.mentions:
                processed_entity['mentions'].append({
                    'text': mention.text.content,
                    'type': mention.type_.name,
                    'begin_offset': mention.text.begin_offset
                })
            
            # Add document type specific processing
            if document_type == 'financial' and entity_type in ['numbers', 'financial_data']:
                processed_entity['financial_relevance'] = True
            elif document_type == 'legal' and entity_type in ['organizations', 'people']:
                processed_entity['legal_relevance'] = True
            elif document_type == 'technical' and entity_type in ['other']:
                processed_entity['technical_relevance'] = True
            
            processed.append(processed_entity)
        
        return processed
    
    def _extract_enterprise_entities(self, text: str, document_type: str) -> Dict[str, List[str]]:
        """Extract enterprise-specific entities using pattern matching"""
        text_lower = text.lower()
        enterprise_entities = defaultdict(list)
        
        # Extract based on document type
        if document_type == 'financial':
            patterns = self.enterprise_patterns['financial_metrics']
        elif document_type == 'technical':
            patterns = self.enterprise_patterns['technical_terms']
        elif document_type == 'legal':
            patterns = self.enterprise_patterns['legal_terms']
        else:
            patterns = self.enterprise_patterns['business_terms']
        
        # Find pattern matches
        for pattern in patterns:
            if pattern in text_lower:
                enterprise_entities[f'{document_type}_terms'].append(pattern)
        
        # Extract financial numbers and percentages
        money_pattern = r'\$[\d,]+(?:\.\d{2})?'
        percentage_pattern = r'\d+(?:\.\d+)?%'
        number_pattern = r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b'
        
        money_matches = re.findall(money_pattern, text)
        percentage_matches = re.findall(percentage_pattern, text)
        number_matches = re.findall(number_pattern, text)
        
        if money_matches:
            enterprise_entities['financial_amounts'] = money_matches
        if percentage_matches:
            enterprise_entities['percentages'] = percentage_matches
        if number_matches and document_type == 'financial':
            enterprise_entities['key_numbers'] = number_matches[:10]  # Limit to top 10
        
        # Extract dates
        date_pattern = r'\b(?:Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}/\d{1,2}/\d{4}|\d{4})\b'
        date_matches = re.findall(date_pattern, text, re.IGNORECASE)
        if date_matches:
            enterprise_entities['time_periods'] = list(set(date_matches))
        
        return dict(enterprise_entities)
    
    def _create_entity_summary(self, entities: List[Dict], enterprise_entities: Dict) -> Dict[str, Any]:
        """Create a summary of extracted entities"""
        entity_counts = Counter(entity['type'] for entity in entities)
        
        # Find most salient entities
        top_entities = sorted(entities, key=lambda x: x['salience'], reverse=True)[:10]
        
        summary = {
            'entity_type_counts': dict(entity_counts),
            'top_entities': [
                {
                    'name': entity['name'],
                    'type': entity['type'],
                    'salience': entity['salience']
                }
                for entity in top_entities
            ],
            'enterprise_entity_counts': {k: len(v) for k, v in enterprise_entities.items()},
            'key_insights': self._generate_key_insights(entities, enterprise_entities)
        }
        
        return summary
    
    def _generate_key_insights(self, entities: List[Dict], enterprise_entities: Dict) -> List[str]:
        """Generate key insights from extracted entities"""
        insights = []
        
        # People insights
        people = [e for e in entities if e['type'] == 'people']
        if len(people) > 3:
            insights.append(f"Document mentions {len(people)} key individuals")
        
        # Organization insights
        orgs = [e for e in entities if e['type'] == 'organizations']
        if len(orgs) > 2:
            insights.append(f"References {len(orgs)} organizations or companies")
        
        # Financial insights
        if 'financial_amounts' in enterprise_entities:
            insights.append(f"Contains {len(enterprise_entities['financial_amounts'])} financial amounts")
        
        if 'percentages' in enterprise_entities:
            insights.append(f"Includes {len(enterprise_entities['percentages'])} percentage values")
        
        # Time period insights
        if 'time_periods' in enterprise_entities:
            insights.append(f"References {len(enterprise_entities['time_periods'])} time periods")
        
        return insights
    
    def _fallback_entity_extraction(self, text: str, document_type: str) -> Dict[str, Any]:
        """Fallback entity extraction when Google Cloud NLP is not available"""
        logger.info("Using fallback entity extraction")
        
        # Simple pattern-based extraction
        enterprise_entities = self._extract_enterprise_entities(text, document_type)
        
        return {
            'entities': [],
            'enterprise_entities': enterprise_entities,
            'sentiment': {'score': 0.0, 'magnitude': 0.0},
            'entity_summary': {
                'entity_type_counts': {},
                'top_entities': [],
                'enterprise_entity_counts': {k: len(v) for k, v in enterprise_entities.items()},
                'key_insights': ['Using fallback entity extraction']
            },
            'extraction_metadata': {
                'text_length': len(text),
                'entity_count': 0,
                'enterprise_entity_count': sum(len(v) for v in enterprise_entities.values()),
                'document_type': document_type,
                'extraction_timestamp': datetime.utcnow().isoformat(),
                'fallback_mode': True
            }
        }
    
    def extract_entities_from_chunks(self, chunks: List[Dict[str, Any]], document_type: str = 'general') -> Dict[str, Any]:
        """Extract entities from multiple document chunks"""
        all_entities = []
        all_enterprise_entities = defaultdict(list)
        total_sentiment_score = 0
        total_sentiment_magnitude = 0
        
        for i, chunk in enumerate(chunks):
            chunk_text = chunk.get('text', '')
            if not chunk_text.strip():
                continue
            
            # Extract entities from chunk
            chunk_entities = self.extract_entities(chunk_text, document_type)
            
            # Aggregate entities
            all_entities.extend(chunk_entities['entities'])
            
            # Aggregate enterprise entities
            for key, values in chunk_entities['enterprise_entities'].items():
                all_enterprise_entities[key].extend(values)
            
            # Aggregate sentiment
            total_sentiment_score += chunk_entities['sentiment']['score']
            total_sentiment_magnitude += chunk_entities['sentiment']['magnitude']
            
            # Add chunk index to entities
            for entity in chunk_entities['entities']:
                entity['chunk_index'] = i
        
        # Remove duplicates from enterprise entities
        for key in all_enterprise_entities:
            all_enterprise_entities[key] = list(set(all_enterprise_entities[key]))
        
        # Calculate average sentiment
        chunk_count = len([c for c in chunks if c.get('text', '').strip()])
        avg_sentiment_score = total_sentiment_score / chunk_count if chunk_count > 0 else 0
        avg_sentiment_magnitude = total_sentiment_magnitude / chunk_count if chunk_count > 0 else 0
        
        # Create comprehensive summary
        result = {
            'entities': all_entities,
            'enterprise_entities': dict(all_enterprise_entities),
            'sentiment': {
                'score': avg_sentiment_score,
                'magnitude': avg_sentiment_magnitude
            },
            'entity_summary': self._create_entity_summary(all_entities, all_enterprise_entities),
            'extraction_metadata': {
                'total_chunks': len(chunks),
                'processed_chunks': chunk_count,
                'total_entities': len(all_entities),
                'total_enterprise_entities': sum(len(v) for v in all_enterprise_entities.values()),
                'document_type': document_type,
                'extraction_timestamp': datetime.utcnow().isoformat()
            }
        }
        
        logger.info(f"✅ Extracted entities from {chunk_count} chunks: {len(all_entities)} entities, {sum(len(v) for v in all_enterprise_entities.values())} enterprise entities")
        return result

# Global entity extraction service
entity_extraction_service = EntityExtractionService()
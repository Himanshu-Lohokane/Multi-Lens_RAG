import re
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

class RichContentGenerator:
    """Generate rich content (tables, charts, images) from text and data"""
    
    def __init__(self):
        # Set up matplotlib for non-interactive backend
        plt.switch_backend('Agg')
        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (10, 6)
        plt.rcParams['font.size'] = 10
        
    def analyze_content_for_rich_elements(self, text: str, query: str) -> Dict[str, Any]:
        """Analyze text content to identify opportunities for rich content generation"""
        rich_content = {
            "has_tabular_data": False,
            "has_numerical_data": False,
            "has_comparison_data": False,
            "has_time_series": False,
            "tables": [],
            "charts": [],
            "images": [],
            "structured_data": []
        }
        
        # Detect tabular data patterns
        tables = self._extract_tables_from_text(text)
        if tables:
            rich_content["has_tabular_data"] = True
            rich_content["tables"] = tables
            
        # Detect numerical data for charts
        numerical_data = self._extract_numerical_data(text)
        if numerical_data:
            rich_content["has_numerical_data"] = True
            rich_content["structured_data"] = numerical_data
            
            # Generate appropriate charts
            charts = self._generate_charts_from_data(numerical_data, query)
            rich_content["charts"] = charts
            
        # Detect comparison opportunities
        if self._has_comparison_keywords(query):
            rich_content["has_comparison_data"] = True
            
        # Detect time series data
        if self._has_time_series_data(text):
            rich_content["has_time_series"] = True
            
        return rich_content
    
    def _extract_tables_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Extract tabular data from text"""
        tables = []
        
        # Pattern 1: Pipe-separated tables (Markdown style)
        markdown_table_pattern = r'\|[^\n]+\|\n\|[-\s\|]+\|\n(\|[^\n]+\|\n)+'
        markdown_matches = re.findall(markdown_table_pattern, text, re.MULTILINE)
        
        for match in markdown_matches:
            table_data = self._parse_markdown_table(match)
            if table_data:
                tables.append({
                    "type": "markdown_table",
                    "data": table_data,
                    "format": "table"
                })
        
        # Pattern 2: Structured data with consistent formatting
        structured_patterns = [
            r'(\w+):\s*([0-9,.$%]+)',  # Key: Value pairs with numbers
            r'(\w+)\s+([0-9,.$%]+)',   # Word followed by number
        ]
        
        for pattern in structured_patterns:
            matches = re.findall(pattern, text)
            if len(matches) >= 3:  # At least 3 data points
                table_data = {
                    "headers": ["Item", "Value"],
                    "rows": [[item.strip(), value.strip()] for item, value in matches]
                }
                tables.append({
                    "type": "key_value_table",
                    "data": table_data,
                    "format": "table"
                })
                break  # Only take the first pattern match
        
        return tables
    
    def _parse_markdown_table(self, table_text: str) -> Optional[Dict[str, Any]]:
        """Parse markdown table format"""
        try:
            lines = table_text.strip().split('\n')
            if len(lines) < 3:
                return None
                
            # Extract headers
            header_line = lines[0].strip('|').strip()
            headers = [h.strip() for h in header_line.split('|')]
            
            # Extract rows (skip separator line)
            rows = []
            for line in lines[2:]:
                if line.strip():
                    row_data = line.strip('|').strip()
                    row = [cell.strip() for cell in row_data.split('|')]
                    if len(row) == len(headers):
                        rows.append(row)
            
            if rows:
                return {
                    "headers": headers,
                    "rows": rows
                }
        except Exception as e:
            logger.error(f"Error parsing markdown table: {e}")
        
        return None
    
    def _extract_numerical_data(self, text: str) -> List[Dict[str, Any]]:
        """Extract numerical data that could be visualized"""
        numerical_data = []
        
        # Pattern 1: Percentages with labels
        percentage_pattern = r'(\w+(?:\s+\w+)*)\s*:?\s*([0-9.]+)%'
        percentage_matches = re.findall(percentage_pattern, text)
        
        if len(percentage_matches) >= 2:
            numerical_data.append({
                "type": "percentage",
                "data": [{"label": label.strip(), "value": float(value)} for label, value in percentage_matches],
                "chart_type": "pie"
            })
        
        # Pattern 2: Currency amounts
        currency_pattern = r'(\w+(?:\s+\w+)*)\s*:?\s*\$([0-9,]+(?:\.[0-9]{2})?)'
        currency_matches = re.findall(currency_pattern, text)
        
        if len(currency_matches) >= 2:
            numerical_data.append({
                "type": "currency",
                "data": [{"label": label.strip(), "value": float(value.replace(',', ''))} for label, value in currency_matches],
                "chart_type": "bar"
            })
        
        # Pattern 3: Year-based data (time series)
        year_pattern = r'(20\d{2})\s*:?\s*([0-9,]+(?:\.[0-9]+)?)'
        year_matches = re.findall(year_pattern, text)
        
        if len(year_matches) >= 2:
            numerical_data.append({
                "type": "time_series",
                "data": [{"label": year, "value": float(value.replace(',', ''))} for year, value in year_matches],
                "chart_type": "line"
            })
        
        # Pattern 4: Generic number data
        number_pattern = r'(\w+(?:\s+\w+)*)\s*:?\s*([0-9,]+(?:\.[0-9]+)?)'
        number_matches = re.findall(number_pattern, text)
        
        if len(number_matches) >= 3 and not any(d["type"] in ["percentage", "currency", "time_series"] for d in numerical_data):
            numerical_data.append({
                "type": "generic",
                "data": [{"label": label.strip(), "value": float(value.replace(',', ''))} for label, value in number_matches],
                "chart_type": "bar"
            })
        
        return numerical_data
    
    def _generate_charts_from_data(self, numerical_data: List[Dict], query: str) -> List[Dict[str, Any]]:
        """Generate chart images from numerical data"""
        charts = []
        
        for data_set in numerical_data:
            try:
                chart_data = data_set["data"]
                chart_type = data_set["chart_type"]
                data_type = data_set["type"]
                
                if len(chart_data) < 2:
                    continue
                
                # Create the chart
                fig, ax = plt.subplots(figsize=(10, 6))
                
                labels = [item["label"] for item in chart_data]
                values = [item["value"] for item in chart_data]
                
                if chart_type == "pie":
                    wedges, texts, autotexts = ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=90)
                    ax.set_title(f"{data_type.title()} Distribution")
                    
                elif chart_type == "bar":
                    bars = ax.bar(labels, values)
                    ax.set_title(f"{data_type.title()} Comparison")
                    ax.set_ylabel("Value")
                    
                    # Add value labels on bars
                    for bar, value in zip(bars, values):
                        height = bar.get_height()
                        ax.text(bar.get_x() + bar.get_width()/2., height,
                               f'{value:,.0f}' if data_type == "currency" else f'{value}',
                               ha='center', va='bottom')
                    
                    # Rotate x-axis labels if they're long
                    if max(len(label) for label in labels) > 10:
                        plt.xticks(rotation=45, ha='right')
                        
                elif chart_type == "line":
                    ax.plot(labels, values, marker='o', linewidth=2, markersize=6)
                    ax.set_title(f"{data_type.title()} Trend")
                    ax.set_ylabel("Value")
                    ax.grid(True, alpha=0.3)
                
                plt.tight_layout()
                
                # Convert to base64 image
                img_buffer = io.BytesIO()
                plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
                img_buffer.seek(0)
                img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
                plt.close(fig)
                
                charts.append({
                    "type": chart_type,
                    "data_type": data_type,
                    "image": img_base64,
                    "title": f"{data_type.title()} {'Distribution' if chart_type == 'pie' else 'Comparison' if chart_type == 'bar' else 'Trend'}",
                    "description": f"Visual representation of {data_type} data from the document"
                })
                
            except Exception as e:
                logger.error(f"Error generating chart: {e}")
                continue
        
        return charts
    
    def _has_comparison_keywords(self, query: str) -> bool:
        """Check if query suggests comparison visualization"""
        comparison_keywords = [
            "compare", "comparison", "versus", "vs", "difference", "between",
            "higher", "lower", "more", "less", "better", "worse", "rank"
        ]
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in comparison_keywords)
    
    def _has_time_series_data(self, text: str) -> bool:
        """Check if text contains time series data"""
        time_patterns = [
            r'20\d{2}',  # Years
            r'(January|February|March|April|May|June|July|August|September|October|November|December)',  # Months
            r'Q[1-4]',   # Quarters
        ]
        
        for pattern in time_patterns:
            if len(re.findall(pattern, text)) >= 2:
                return True
        return False
    
    def generate_summary_visualization(self, sources: List[Dict], query: str) -> Optional[Dict[str, Any]]:
        """Generate a summary visualization from multiple sources"""
        try:
            # Collect all numerical data from sources
            all_data = []
            
            for source in sources:
                text = source.get("chunk_text", "")
                numerical_data = self._extract_numerical_data(text)
                all_data.extend(numerical_data)
            
            if not all_data:
                return None
            
            # Create a summary chart if we have enough data
            if len(all_data) >= 1:
                # Take the first dataset for summary
                data_set = all_data[0]
                chart_data = data_set["data"]
                
                if len(chart_data) >= 2:
                    fig, ax = plt.subplots(figsize=(12, 8))
                    
                    labels = [item["label"] for item in chart_data]
                    values = [item["value"] for item in chart_data]
                    
                    # Create a horizontal bar chart for better readability
                    bars = ax.barh(labels, values)
                    ax.set_title(f"Summary: {query}", fontsize=14, fontweight='bold')
                    ax.set_xlabel("Value")
                    
                    # Add value labels
                    for bar, value in zip(bars, values):
                        width = bar.get_width()
                        ax.text(width, bar.get_y() + bar.get_height()/2.,
                               f'{value:,.0f}',
                               ha='left', va='center', fontweight='bold')
                    
                    plt.tight_layout()
                    
                    # Convert to base64
                    img_buffer = io.BytesIO()
                    plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
                    img_buffer.seek(0)
                    img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
                    plt.close(fig)
                    
                    return {
                        "type": "summary_chart",
                        "image": img_base64,
                        "title": f"Data Summary: {query}",
                        "description": "Summary visualization based on your query and document data"
                    }
                    
        except Exception as e:
            logger.error(f"Error generating summary visualization: {e}")
        
        return None

# Global instance
rich_content_generator = RichContentGenerator()
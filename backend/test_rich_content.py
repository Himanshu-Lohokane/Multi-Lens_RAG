#!/usr/bin/env python3
"""
Test script for rich content generation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.rich_content_generator import rich_content_generator

def test_table_extraction():
    """Test table extraction from text"""
    print("🧪 Testing table extraction...")
    
    sample_text = """
    Here are the quarterly results:
    
    Revenue: $1,200,000
    Expenses: $800,000
    Profit: $400,000
    Growth: 15%
    
    The data shows strong performance across all metrics.
    """
    
    query = "Show me the financial performance"
    result = rich_content_generator.analyze_content_for_rich_elements(sample_text, query)
    
    print(f"✅ Tables found: {len(result.get('tables', []))}")
    print(f"✅ Charts generated: {len(result.get('charts', []))}")
    print(f"✅ Has numerical data: {result.get('has_numerical_data', False)}")
    
    if result.get('tables'):
        print("📊 Table data:")
        for i, table in enumerate(result['tables']):
            print(f"  Table {i+1}: {table['type']}")
            print(f"  Headers: {table['data'].get('headers', [])}")
            print(f"  Rows: {len(table['data'].get('rows', []))}")

def test_chart_generation():
    """Test chart generation from numerical data"""
    print("\n🧪 Testing chart generation...")
    
    sample_text = """
    Sales performance by quarter:
    Q1 2024: $500,000
    Q2 2024: $650,000
    Q3 2024: $720,000
    Q4 2024: $800,000
    
    Market share breakdown:
    Product A: 45%
    Product B: 30%
    Product C: 25%
    """
    
    query = "Show me sales trends and market share"
    result = rich_content_generator.analyze_content_for_rich_elements(sample_text, query)
    
    print(f"✅ Charts generated: {len(result.get('charts', []))}")
    print(f"✅ Has time series: {result.get('has_time_series', False)}")
    
    if result.get('charts'):
        print("📈 Chart data:")
        for i, chart in enumerate(result['charts']):
            print(f"  Chart {i+1}: {chart['type']} - {chart['data_type']}")
            print(f"  Title: {chart['title']}")
            print(f"  Has image: {'Yes' if chart.get('image') else 'No'}")

def test_summary_visualization():
    """Test summary visualization generation"""
    print("\n🧪 Testing summary visualization...")
    
    sources_data = [
        {
            "chunk_text": "Revenue increased by 25% to $2.5M in Q3",
            "file_name": "financial_report.pdf",
            "document_type": "financial"
        },
        {
            "chunk_text": "Customer satisfaction: 92%, up from 87%",
            "file_name": "customer_survey.pdf", 
            "document_type": "survey"
        }
    ]
    
    query = "What are the key performance metrics?"
    result = rich_content_generator.generate_summary_visualization(sources_data, query)
    
    if result:
        print(f"✅ Summary visualization generated: {result['type']}")
        print(f"✅ Title: {result['title']}")
        print(f"✅ Has image: {'Yes' if result.get('image') else 'No'}")
    else:
        print("❌ No summary visualization generated")

if __name__ == "__main__":
    print("🚀 Starting Rich Content Generation Tests\n")
    
    try:
        test_table_extraction()
        test_chart_generation()
        test_summary_visualization()
        
        print("\n✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
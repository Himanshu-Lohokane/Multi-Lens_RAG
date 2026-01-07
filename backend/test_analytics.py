#!/usr/bin/env python3
"""
Test script for analytics service
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.analytics_service import analytics_service

def test_analytics_service():
    """Test analytics service functionality"""
    print("🧪 Testing Analytics Service...")
    
    # Test with a sample tenant ID
    test_tenant_id = "test_tenant_123"
    
    try:
        # Test dashboard analytics
        print("📊 Testing dashboard analytics...")
        dashboard_data = analytics_service.get_dashboard_analytics(test_tenant_id, days=30)
        print(f"✅ Dashboard analytics: {type(dashboard_data)} returned")
        
        # Test document analytics
        print("📄 Testing document analytics...")
        document_data = analytics_service.get_document_analytics(test_tenant_id, days=30)
        print(f"✅ Document analytics: {type(document_data)} returned")
        
        # Test query analytics
        print("🔍 Testing query analytics...")
        query_data = analytics_service.get_query_analytics(test_tenant_id, days=30)
        print(f"✅ Query analytics: {type(query_data)} returned")
        
        # Test entity analytics
        print("🏷️ Testing entity analytics...")
        entity_data = analytics_service.get_entity_analytics(test_tenant_id, days=30)
        print(f"✅ Entity analytics: {type(entity_data)} returned")
        
        print("\n✅ All analytics service tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Analytics service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting Analytics Service Tests\n")
    
    success = test_analytics_service()
    
    if success:
        print("\n🎉 Analytics service is working correctly!")
    else:
        print("\n💥 Analytics service tests failed!")
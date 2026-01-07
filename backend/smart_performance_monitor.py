#!/usr/bin/env python3
"""
Smart Performance Monitor - Tracks response times and identifies bottlenecks
without compromising response quality.
"""

import time
import statistics
from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)

class SmartPerformanceMonitor:
    def __init__(self):
        self.response_times = deque(maxlen=100)  # Keep last 100 responses
        self.component_times = defaultdict(lambda: deque(maxlen=50))
        self.slow_queries = deque(maxlen=20)  # Track slow queries for analysis
        
    def log_response_time(self, total_time_ms, components=None):
        """Log response time and component breakdown"""
        self.response_times.append(total_time_ms)
        
        if components:
            for component, time_ms in components.items():
                self.component_times[component].append(time_ms)
        
        # Track slow queries (>5 seconds)
        if total_time_ms > 5000:
            self.slow_queries.append({
                'time': time.time(),
                'response_time': total_time_ms,
                'components': components or {}
            })
    
    def get_performance_stats(self):
        """Get current performance statistics"""
        if not self.response_times:
            return {"status": "No data available"}
        
        response_times_list = list(self.response_times)
        
        stats = {
            "total_queries": len(response_times_list),
            "avg_response_time_ms": statistics.mean(response_times_list),
            "median_response_time_ms": statistics.median(response_times_list),
            "min_response_time_ms": min(response_times_list),
            "max_response_time_ms": max(response_times_list),
            "slow_queries_count": len([t for t in response_times_list if t > 5000]),
            "fast_queries_count": len([t for t in response_times_list if t < 2000]),
        }
        
        # Component breakdown
        component_stats = {}
        for component, times in self.component_times.items():
            if times:
                times_list = list(times)
                component_stats[component] = {
                    "avg_ms": statistics.mean(times_list),
                    "max_ms": max(times_list),
                    "percentage_of_total": (statistics.mean(times_list) / stats["avg_response_time_ms"]) * 100
                }
        
        stats["component_breakdown"] = component_stats
        
        return stats
    
    def get_optimization_recommendations(self):
        """Analyze performance and suggest optimizations"""
        stats = self.get_performance_stats()
        recommendations = []
        
        if stats.get("avg_response_time_ms", 0) > 3000:
            recommendations.append("🚨 Average response time is >3s - needs optimization")
        
        if stats.get("slow_queries_count", 0) > 5:
            recommendations.append("⚠️ Multiple slow queries detected - check LLM performance")
        
        # Component-specific recommendations
        component_stats = stats.get("component_breakdown", {})
        
        if "llm" in component_stats and component_stats["llm"]["avg_ms"] > 4000:
            recommendations.append("🤖 LLM responses are slow - consider reducing context or token limit")
        
        if "pinecone" in component_stats and component_stats["pinecone"]["avg_ms"] > 1000:
            recommendations.append("🌲 Pinecone queries are slow - check index performance")
        
        if "embedding" in component_stats and component_stats["embedding"]["avg_ms"] > 800:
            recommendations.append("🧠 Embedding generation is slow - check API performance")
        
        if not recommendations:
            recommendations.append("✅ Performance looks good!")
        
        return recommendations
    
    def print_performance_report(self):
        """Print a comprehensive performance report"""
        stats = self.get_performance_stats()
        recommendations = self.get_optimization_recommendations()
        
        print("\n" + "="*60)
        print("📊 SMART PERFORMANCE REPORT")
        print("="*60)
        
        if stats.get("status"):
            print(f"Status: {stats['status']}")
            return
        
        print(f"📈 Total Queries: {stats['total_queries']}")
        print(f"⏱️  Average Response Time: {stats['avg_response_time_ms']:.0f}ms")
        print(f"📊 Median Response Time: {stats['median_response_time_ms']:.0f}ms")
        print(f"🚀 Fastest Response: {stats['min_response_time_ms']:.0f}ms")
        print(f"🐌 Slowest Response: {stats['max_response_time_ms']:.0f}ms")
        print(f"✅ Fast Queries (<2s): {stats['fast_queries_count']}")
        print(f"🚨 Slow Queries (>5s): {stats['slow_queries_count']}")
        
        print("\n📊 Component Breakdown:")
        for component, data in stats.get("component_breakdown", {}).items():
            print(f"   {component.title()}: {data['avg_ms']:.0f}ms avg ({data['percentage_of_total']:.1f}% of total)")
        
        print("\n💡 Optimization Recommendations:")
        for rec in recommendations:
            print(f"   {rec}")
        
        print("\n🎯 Performance Targets:")
        print("   • Target Response Time: <2000ms")
        print("   • Acceptable Range: 2000-3000ms") 
        print("   • Needs Optimization: >3000ms")
        
        print("="*60)

# Global performance monitor instance
performance_monitor = SmartPerformanceMonitor()

def log_performance(total_time_ms, **components):
    """Helper function to log performance from anywhere in the code"""
    performance_monitor.log_response_time(total_time_ms, components)

def get_performance_report():
    """Helper function to get performance report"""
    return performance_monitor.get_performance_stats()

def print_performance_report():
    """Helper function to print performance report"""
    performance_monitor.print_performance_report()

if __name__ == "__main__":
    # Example usage
    print("Smart Performance Monitor initialized")
    print("Use log_performance(total_time_ms, embedding=500, pinecone=300, llm=1200) to log performance")
    print("Use print_performance_report() to see current stats")
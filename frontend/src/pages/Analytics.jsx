import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Tabs, 
  Tab, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress,
  Alert,
  LinearProgress,
  Avatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  LineChart,
  PieChart
} from '@mui/x-charts';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  CheckCircle,
  Package,
  Truck,
  Globe,
  Clock,
  FileText,
  Users,
  MapPin,
  AlertTriangle,
  Search,
  BarChart2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Box as BoxIcon,
  Plane,
  Ship,
  Building2,
  Languages,
  Target,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// LOGISTICS INTELLIGENCE MOCK DATA
// ============================================
const MOCK_DATA = {
  // Real-time metrics
  realTimeMetrics: {
    documentsProcessedToday: 12847,
    avgQueryResponseTime: 1.2,
    queryResolutionRate: 98.3,
    activeUsers: 847,
    documentsPending: 234,
    systemUptime: 99.97
  },

  // KPI Overview
  kpiMetrics: {
    totalDocuments: 458926,
    totalQueries: 2847563,
    avgResponseTime: 1180,
    resolutionRate: 98.7,
    documentsGrowth: 12.4,
    queriesGrowth: 23.8,
    responseTimeImprovement: -15.2,
    resolutionImprovement: 2.1
  },

  // Document Types Distribution (Logistics focused)
  documentTypes: [
    { id: 'awb', label: 'Air Waybills', value: 145000, color: '#3b82f6' },
    { id: 'commercial', label: 'Commercial Invoices', value: 98000, color: '#8b5cf6' },
    { id: 'customs', label: 'Customs Declarations', value: 76000, color: '#10b981' },
    { id: 'pod', label: 'Proof of Delivery', value: 89000, color: '#f97316' },
    { id: 'shipping', label: 'Shipping Manifests', value: 35000, color: '#ec4899' },
    { id: 'compliance', label: 'Compliance Documents', value: 15926, color: '#14b8a6' }
  ],

  // Query Categories
  queryCategories: [
    { category: 'Tracking Status', count: 892456, percentage: 31.4 },
    { category: 'Customs Clearance', count: 456789, percentage: 16.0 },
    { category: 'Delivery Time', count: 398234, percentage: 14.0 },
    { category: 'Rate Inquiry', count: 312456, percentage: 11.0 },
    { category: 'Address Issues', count: 267890, percentage: 9.4 },
    { category: 'Package Damage', count: 198234, percentage: 7.0 },
    { category: 'Regulations', count: 156789, percentage: 5.5 },
    { category: 'Other', count: 164715, percentage: 5.7 }
  ],

  // Regional Performance
  regionalData: [
    { region: 'UAE', queries: 524890, documents: 98456, avgResponse: 980, satisfaction: 98.9 },
    { region: 'Saudi Arabia', queries: 412567, documents: 78234, avgResponse: 1120, satisfaction: 97.8 },
    { region: 'Egypt', queries: 298456, documents: 54678, avgResponse: 1340, satisfaction: 96.5 },
    { region: 'Jordan', queries: 234567, documents: 43210, avgResponse: 1050, satisfaction: 98.2 },
    { region: 'USA', queries: 198456, documents: 38765, avgResponse: 890, satisfaction: 99.1 },
    { region: 'UK', queries: 176543, documents: 34567, avgResponse: 920, satisfaction: 98.7 },
    { region: 'India', queries: 312890, documents: 56789, avgResponse: 1180, satisfaction: 97.4 },
    { region: 'Germany', queries: 145678, documents: 28901, avgResponse: 950, satisfaction: 98.5 }
  ],

  // Daily Query Trends (Last 30 days)
  dailyTrends: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    queries: Math.floor(85000 + Math.random() * 25000 + (i * 500)),
    documents: Math.floor(12000 + Math.random() * 4000 + (i * 150)),
    responseTime: Math.floor(1000 + Math.random() * 400 - (i * 8))
  })),

  // Hourly Distribution
  hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    queries: i >= 8 && i <= 18 
      ? Math.floor(8000 + Math.random() * 4000) 
      : Math.floor(2000 + Math.random() * 2000)
  })),

  // Language Distribution
  languageData: [
    { language: 'English', percentage: 45, count: 1281403 },
    { language: 'Arabic', percentage: 32, count: 911220 },
    { language: 'French', percentage: 8, count: 227805 },
    { language: 'German', percentage: 5, count: 142378 },
    { language: 'Hindi', percentage: 4, count: 113902 },
    { language: 'Others', percentage: 6, count: 170855 }
  ],

  // Delivery Exception Analytics
  exceptionTypes: [
    { type: 'Customs Hold', count: 12456, trend: -5.2, severity: 'high' },
    { type: 'Address Incorrect', count: 8934, trend: -12.4, severity: 'medium' },
    { type: 'Weather Delay', count: 6789, trend: 23.1, severity: 'low' },
    { type: 'Recipient Unavailable', count: 15678, trend: -8.7, severity: 'medium' },
    { type: 'Documentation Missing', count: 4567, trend: -18.9, severity: 'high' },
    { type: 'Package Damaged', count: 2345, trend: -22.4, severity: 'critical' }
  ],

  // Compliance Document Types
  complianceDocuments: [
    { type: 'IATA Regulations', queries: 45678, lastUpdated: '2025-12-20' },
    { type: 'Customs Tariffs - UAE', queries: 34567, lastUpdated: '2025-12-19' },
    { type: 'Restricted Goods List', queries: 28901, lastUpdated: '2025-12-18' },
    { type: 'Dangerous Goods (DG)', queries: 23456, lastUpdated: '2025-12-21' },
    { type: 'Export Controls - USA', queries: 18765, lastUpdated: '2025-12-15' },
    { type: 'Import Duties - EU', queries: 16543, lastUpdated: '2025-12-17' }
  ],

  // Entity Extraction Stats
  extractedEntities: [
    { entity: 'Tracking Numbers', count: 2456789, accuracy: 99.8 },
    { entity: 'Destinations (Cities)', count: 1876543, accuracy: 98.9 },
    { entity: 'Customer References', count: 987654, accuracy: 99.2 },
    { entity: 'HS Codes', count: 654321, accuracy: 97.8 },
    { entity: 'Weight/Dimensions', count: 543210, accuracy: 98.5 },
    { entity: 'Declared Values', count: 432109, accuracy: 99.1 }
  ],

  // Top Customer Queries (AI Resolution)
  topQueries: [
    { query: 'Where is my package?', count: 456789, aiResolved: 99.2 },
    { query: 'Customs clearance process UAE', count: 123456, aiResolved: 97.8 },
    { query: 'Delivery time Dubai to New York', count: 98765, aiResolved: 98.9 },
    { query: 'Shipping rates international', count: 87654, aiResolved: 96.5 },
    { query: 'Track AWB number', count: 76543, aiResolved: 99.5 },
    { query: 'Package stuck in customs', count: 65432, aiResolved: 94.2 },
    { query: 'Required documents for import', count: 54321, aiResolved: 97.1 },
    { query: 'Delivery address change', count: 43210, aiResolved: 95.8 }
  ],

  // Shipment Method Distribution
  shipmentMethods: [
    { method: 'Express Air', value: 42, color: '#3b82f6' },
    { method: 'Economy Air', value: 28, color: '#10b981' },
    { method: 'Ground/Road', value: 18, color: '#f97316' },
    { method: 'Sea Freight', value: 8, color: '#14b8a6' },
    { method: 'Same Day', value: 4, color: '#8b5cf6' }
  ],

  // Performance by Service Type
  servicePerformance: [
    { service: 'Express', sla: 99.2, volume: 1234567, avgTime: 1.8 },
    { service: 'Economy', sla: 97.8, volume: 876543, avgTime: 4.2 },
    { service: 'Freight', sla: 96.5, volume: 234567, avgTime: 12.5 },
    { service: 'Same Day', sla: 99.8, volume: 123456, avgTime: 0.4 },
    { service: 'Warehousing', sla: 98.9, volume: 87654, avgTime: 2.1 }
  ],

  // Knowledge Gap Analysis
  knowledgeGaps: [
    { topic: 'New tariff regulations 2026', queries: 8765, coverage: 45 },
    { topic: 'Lithium battery shipping', queries: 6543, coverage: 62 },
    { topic: 'Brexit customs changes', queries: 5432, coverage: 78 },
    { topic: 'E-commerce returns process', queries: 4321, coverage: 55 },
    { topic: 'Temperature-controlled shipping', queries: 3210, coverage: 40 }
  ],

  // Predictive Insights
  predictiveInsights: [
    { insight: 'Expected 18% increase in customs queries next week (holiday season)', type: 'warning', confidence: 87 },
    { insight: 'Potential delay pattern detected: Dubai-London route', type: 'alert', confidence: 92 },
    { insight: 'Document processing efficiency improved 12% this month', type: 'success', confidence: 95 },
    { insight: 'New shipping regulation (IMO 2025) generating 340% more queries', type: 'info', confidence: 89 }
  ]
};

// ============================================
// COMPONENTS
// ============================================

// Live Status Indicator
const LiveIndicator = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box 
      sx={{ 
        width: 10, 
        height: 10, 
        borderRadius: '50%', 
        backgroundColor: '#4caf50',
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' }
        }
      }} 
    />
    <Typography variant="caption" color="success.main" fontWeight="medium">
      LIVE
    </Typography>
  </Box>
);

// Trend Indicator
const TrendIndicator = ({ value, suffix = '%' }) => {
  const isPositive = value >= 0;
  const color = isPositive ? 'success.main' : 'error.main';
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Icon size={16} color={isPositive ? '#4caf50' : '#f44336'} />
      <Typography variant="body2" sx={{ color, fontWeight: 'medium' }}>
        {isPositive ? '+' : ''}{value}{suffix}
      </Typography>
    </Box>
  );
};

// Colorful Pastel Palette (from reference images)
const PREMIUM_COLORS = {
  primary: '#3b82f6',      // Bright blue
  secondary: '#8b5cf6',    // Purple
  accent: '#10b981',       // Emerald green  
  gold: '#f59e0b',         // Amber
  success: '#10b981',      // Emerald
  warning: '#f97316',      // Orange
  info: '#14b8a6',         // Teal/Cyan
  muted: '#6b7280',        // Gray
  light: '#f9fafb',        // Very light gray
  border: '#e5e7eb',       // Light border
  pink: '#ec4899',         // Pink
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
  <Card 
    sx={{ 
      height: '100%', 
      position: 'relative', 
      overflow: 'hidden',
      background: color === 'blue' ? '#eff6ff' : 
                  color === 'purple' ? '#f3e8ff' : 
                  color === 'green' ? '#ecfdf5' : 
                  color === 'orange' ? '#fff7ed' : 
                  color === 'pink' ? '#fdf2f8' :
                  color === 'cyan' ? '#ecfeff' : '#f9fafb',
      border: `1px solid ${color === 'blue' ? '#bfdbfe' : 
                            color === 'purple' ? '#ddd6fe' : 
                            color === 'green' ? '#a7f3d0' : 
                            color === 'orange' ? '#fed7aa' : 
                            color === 'pink' ? '#fbcfe8' :
                            color === 'cyan' ? '#a5f3fc' : '#e5e7eb'}`,
      borderRadius: 3,
      transition: 'all 0.3s ease-in-out',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        borderColor: color === 'blue' ? '#93c5fd' : 
                     color === 'purple' ? '#c4b5fd' : 
                     color === 'green' ? '#6ee7b7' : 
                     color === 'orange' ? '#fdba74' : 
                     color === 'pink' ? '#f9a8d4' :
                     color === 'cyan' ? '#67e8f9' : '#d1d5db',
      }
    }}
  >
    <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography 
            variant="body2" 
            gutterBottom 
            sx={{ 
              fontWeight: 500, 
              color: '#6b7280',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              color: color === 'blue' ? '#1e40af' : 
                      color === 'purple' ? '#7c3aed' : 
                      color === 'green' ? '#059669' : 
                      color === 'orange' ? '#ea580c' : 
                      color === 'pink' ? '#db2777' :
                      color === 'cyan' ? '#0891b2' : '#111827',
              fontWeight: 700, 
              letterSpacing: '-0.5px',
              fontSize: '1.75rem'
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Box sx={{ mt: 1 }}>
              <TrendIndicator value={trend} />
            </Box>
          )}
        </Box>
        <Box 
          sx={{ 
            p: 1.5,
            borderRadius: 2,
            bgcolor: color === 'blue' ? '#dbeafe' : 
                     color === 'purple' ? '#ede9fe' : 
                     color === 'green' ? '#d1fae5' : 
                     color === 'orange' ? '#ffedd5' : 
                     color === 'pink' ? '#fce7f3' :
                     color === 'cyan' ? '#cffafe' : '#f3f4f6',
            border: 'none',
            display: 'flex',
            color: color === 'blue' ? '#2563eb' : 
                   color === 'purple' ? '#8b5cf6' : 
                   color === 'green' ? '#10b981' : 
                   color === 'orange' ? '#f97316' : 
                   color === 'pink' ? '#ec4899' :
                   color === 'cyan' ? '#14b8a6' : '#6b7280'
          }}
        >
          <Icon size={22} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Chart Card Component with consistent styling
const ChartCard = ({ title, icon: Icon, color = '#3b82f6', children, height = '100%' }) => (
  <Card 
    sx={{ 
      height,
      borderRadius: 4,
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
      '&:hover': { 
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
        borderColor: '#cbd5e1',
        transform: 'translateY(-2px)'
      }
    }}
  >
    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          fontWeight: 700, 
          color: '#1f2937',
          mb: { xs: 2.5, md: 3.5 },
          fontSize: { xs: '1rem', md: '1.2rem' }
        }}
      >
        <Box 
          sx={{ 
            p: 1.2, 
            borderRadius: 3, 
            bgcolor: '#dbeafe',
            border: '1px solid #bfdbfe',
            display: 'flex',
            color: '#1d4ed8',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
          }}
        >
          <Icon size={20} />
        </Box>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

// ============================================
// MAIN ANALYTICS COMPONENT
// ============================================
const Analytics = () => {
  const [timeRange, setTimeRange] = useState(30);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setLastRefresh(new Date());
    setTimeout(() => {
      setLoading(false);
      toast.success('Analytics data refreshed');
    }, 500);
  };

  // Real-Time Dashboard Section
  const RealTimeDashboard = () => (
    <Card sx={{ 
      mb: 3, 
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
      color: 'white',
      border: 'none',
      borderRadius: 3
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 2, letterSpacing: '-0.3px' }}>
              <Activity size={26} />
              Real-Time Operations Center
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, fontWeight: 400 }}>
              Live document intelligence metrics • Updated {lastRefresh.toLocaleTimeString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LiveIndicator />
            <IconButton onClick={handleRefresh} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
              <RefreshCw size={20} />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="600" sx={{ letterSpacing: '-0.5px' }}>
                {MOCK_DATA.realTimeMetrics.documentsProcessedToday.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 400 }}>Documents Today</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="600" sx={{ letterSpacing: '-0.5px' }}>
                {MOCK_DATA.realTimeMetrics.avgQueryResponseTime}s
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 400 }}>Avg Response</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="600" sx={{ letterSpacing: '-0.5px' }}>
                {MOCK_DATA.realTimeMetrics.queryResolutionRate}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 400 }}>AI Resolution</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="600" sx={{ letterSpacing: '-0.5px' }}>
                {MOCK_DATA.realTimeMetrics.activeUsers}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 400 }}>Active Users</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="600" sx={{ letterSpacing: '-0.5px' }}>
                {MOCK_DATA.realTimeMetrics.documentsPending}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 400 }}>Pending</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="600" sx={{ letterSpacing: '-0.5px' }}>
                {MOCK_DATA.realTimeMetrics.systemUptime}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 400 }}>Uptime</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // KPI Cards Section
  const KPISection = () => (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Documents Indexed"
          value={MOCK_DATA.kpiMetrics.totalDocuments.toLocaleString()}
          icon={FileText}
          color="blue"
          trend={MOCK_DATA.kpiMetrics.documentsGrowth}
          subtitle="Across all regions"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Queries Processed"
          value={(MOCK_DATA.kpiMetrics.totalQueries / 1000000).toFixed(2) + 'M'}
          icon={Search}
          color="purple"
          trend={MOCK_DATA.kpiMetrics.queriesGrowth}
          subtitle="Last 30 days"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Avg Response Time"
          value={MOCK_DATA.kpiMetrics.avgResponseTime + 'ms'}
          icon={Zap}
          color="orange"
          trend={MOCK_DATA.kpiMetrics.responseTimeImprovement}
          subtitle="Target: <1500ms"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="AI Resolution Rate"
          value={MOCK_DATA.kpiMetrics.resolutionRate + '%'}
          icon={CheckCircle}
          color="green"
          trend={MOCK_DATA.kpiMetrics.resolutionImprovement}
          subtitle="Without human intervention"
        />
      </Grid>
    </Grid>
  );

  // Overview Tab
  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Document Types Distribution */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Document Types Distribution" icon={FileText}>
          <Box sx={{ 
            bgcolor: '#fafbfc', 
            borderRadius: 2, 
            p: 1.5, 
            border: '1px solid #f1f5f9' 
          }}>
            <PieChart
              series={[{
                data: MOCK_DATA.documentTypes,
                highlightScope: { faded: 'global', highlighted: 'item' },
                innerRadius: 40,
                outerRadius: 85,
                paddingAngle: 3,
                cornerRadius: 6,
              }]}
              height={350}
              slotProps={{
                legend: {
                  direction: 'column',
                  position: { vertical: 'middle', horizontal: 'right' },
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                  markGap: 5,
                  itemGap: 12,
                  labelStyle: {
                    fontSize: 11,
                    fontWeight: 500,
                    fill: '#374151'
                  }
                }
              }}
              margin={{ left: 10, right: 120, top: 20, bottom: 20 }}
            />
          </Box>
        </ChartCard>
      </Grid>

      {/* Query Categories */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Top Query Categories" icon={Search}>
          <Box sx={{ 
            bgcolor: '#fafbfc', 
            borderRadius: 2, 
            p: 1.5, 
            border: '1px solid #f1f5f9' 
          }}>
            <BarChart
              xAxis={[{ 
                scaleType: 'band', 
                data: MOCK_DATA.queryCategories.slice(0, 6).map(d => d.category),
                tickLabelStyle: { 
                  angle: -45, 
                  textAnchor: 'end',
                  fontSize: 11,
                  fontWeight: 500,
                  fill: '#374151'
                }
              }]}
              yAxis={[{
                tickLabelStyle: {
                  fontSize: 11,
                  fontWeight: 500,
                  fill: '#374151'
                }
              }]}
              series={[{ 
                data: MOCK_DATA.queryCategories.slice(0, 6).map(d => d.count),
                color: '#8b5cf6'
              }]}
              height={350}
              margin={{ left: 70, right: 20, top: 20, bottom: 80 }}
            />
          </Box>
        </ChartCard>
      </Grid>

      {/* Query Trends Line Chart */}
      <Grid item xs={12}>
        <ChartCard title="Query Volume Trends (Last 30 Days)" icon={TrendingUp}>
          <LineChart
            xAxis={[{ 
              data: MOCK_DATA.dailyTrends.map(d => d.day),
              label: 'Day',
              tickLabelStyle: {
                fontSize: 12,
                fontWeight: 500
              }
            }]}
            yAxis={[{
              tickLabelStyle: {
                fontSize: 12,
                fontWeight: 500
              }
            }]}
            series={[
              { 
                data: MOCK_DATA.dailyTrends.map(d => d.queries),
                label: 'Queries',
                color: '#14b8a6',
                area: true,
                curve: 'linear'
              },
              { 
                data: MOCK_DATA.dailyTrends.map(d => d.documents * 7),
                label: 'Documents (×7)',
                color: '#3b82f6',
                curve: 'linear'
              }
            ]}
            height={420}
            margin={{ left: 80, right: 40, top: 40, bottom: 60 }}
            slotProps={{
              legend: {
                direction: 'row',
                position: { vertical: 'top', horizontal: 'right' },
                itemMarkWidth: 12,
                itemMarkHeight: 12,
                markGap: 8,
                itemGap: 20,
                labelStyle: {
                  fontSize: 14,
                  fontWeight: 500,
                }
              }
            }}
          />
        </ChartCard>
      </Grid>

      {/* Regional Performance */}
      <Grid item xs={12}>
        <ChartCard title="Regional Performance" icon={Globe}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: '#ecfdf5',
                  '& th': { fontWeight: 600, color: '#059669', borderBottom: '2px solid #a7f3d0' }
                }}>
                  <TableCell>Region</TableCell>
                  <TableCell align="right">Queries</TableCell>
                  <TableCell align="right">Documents</TableCell>
                  <TableCell align="right">Avg Response</TableCell>
                  <TableCell align="right">Satisfaction</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MOCK_DATA.regionalData.map((row, index) => (
                  <TableRow 
                    key={index} 
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#f8fafc' },
                      transition: 'background-color 0.2s ease',
                      '& td': { borderBottom: '1px solid #f1f5f9' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.5, 
                          borderRadius: 1, 
                          bgcolor: '#ecfdf5',
                          display: 'flex'
                        }}>
                          <MapPin size={14} color="#10b981" />
                        </Box>
                        <Typography fontWeight={500} color="#111827">{row.region}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="#10b981">{row.queries.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#6b7280' }}>{row.documents.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${row.avgResponse}ms`}
                        size="small"
                        sx={{
                          bgcolor: row.avgResponse < 1000 ? '#f0fdf4' : row.avgResponse < 1200 ? '#fefce8' : '#fef2f2',
                          color: row.avgResponse < 1000 ? '#166534' : row.avgResponse < 1200 ? '#854d0e' : '#991b1b',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={row.satisfaction} 
                          sx={{ 
                            width: 50, 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor: row.satisfaction >= 98 ? '#10b981' : '#8b5cf6'
                            }
                          }}
                        />
                        <Typography variant="body2" fontWeight={500} color="#111827">{row.satisfaction}%</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ChartCard>
      </Grid>
    </Grid>
  );

  // Documents Tab
  const DocumentsTab = () => (
    <Grid container spacing={2.5}>
      {/* Document Processing Overview */}
      <Grid item xs={12} md={4}>
        <ChartCard title="Document Processing" icon={BoxIcon}>
          <Box sx={{ mt: 2 }}>
            {MOCK_DATA.documentTypes.map((doc, idx) => (
              <Box key={idx} sx={{ mb: 2.5 }}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" fontWeight={500} color="#6b7280">{doc.label}</Typography>
                  <Typography variant="body2" fontWeight={600} color="#111827">
                    {doc.value.toLocaleString()}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(doc.value / 145000) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': { 
                      backgroundColor: doc.color,
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        </ChartCard>
      </Grid>

      {/* Entity Extraction Stats */}
      <Grid item xs={12} md={8}>
        <ChartCard title="Entity Extraction Performance" icon={Target}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: '#eff6ff',
                  '& th': { fontWeight: 600, color: '#2563eb', borderBottom: '2px solid #bfdbfe' }
                }}>
                  <TableCell>Entity Type</TableCell>
                  <TableCell align="right">Extracted Count</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MOCK_DATA.extractedEntities.map((entity, idx) => (
                  <TableRow 
                    key={idx} 
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#eff6ff' },
                      transition: 'background-color 0.2s ease',
                      '& td': { borderBottom: '1px solid #e5e7eb' }
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={500} color="#111827">{entity.entity}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="#3b82f6">{entity.count.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${entity.accuracy}%`}
                        size="small"
                        sx={{
                          bgcolor: entity.accuracy >= 99 ? '#ecfdf5' : entity.accuracy >= 98 ? '#eff6ff' : '#fef3c7',
                          color: entity.accuracy >= 99 ? '#059669' : entity.accuracy >= 98 ? '#2563eb' : '#d97706',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={entity.accuracy >= 99 ? 'Excellent' : entity.accuracy >= 98 ? 'Good' : 'Monitor'}
                        size="small"
                        sx={{
                          bgcolor: entity.accuracy >= 99 ? '#10b981' : entity.accuracy >= 98 ? '#3b82f6' : '#f59e0b',
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ChartCard>
      </Grid>

      {/* Language Distribution */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Multi-Language Processing" icon={Languages}>
          <PieChart
            series={[{
              data: MOCK_DATA.languageData.map(l => ({
                id: l.language,
                label: `${l.language} (${l.percentage}%)`,
                value: l.count
              })),
              innerRadius: 70,
              outerRadius: 120,
              paddingAngle: 3,
              cornerRadius: 6,
            }]}
            height={360}
            margin={{ left: 20, right: 100, top: 20, bottom: 20 }}
            slotProps={{
              legend: {
                direction: 'column',
                position: { vertical: 'middle', horizontal: 'right' },
                itemMarkWidth: 12,
                itemMarkHeight: 12,
                markGap: 8,
                itemGap: 10,
                labelStyle: {
                  fontSize: 13,
                  fontWeight: 500,
                }
              }
            }}
          />
        </ChartCard>
      </Grid>

      {/* Compliance Documents */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Compliance Document Usage" icon={Shield}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: '#fdf2f8',
                  '& th': { fontWeight: 600, color: '#db2777', borderBottom: '2px solid #fbcfe8' }
                }}>
                  <TableCell>Document Type</TableCell>
                  <TableCell align="right">Queries</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MOCK_DATA.complianceDocuments.map((doc, idx) => (
                  <TableRow 
                    key={idx} 
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#fdf2f8' },
                      transition: 'background-color 0.2s ease',
                      '& td': { borderBottom: '1px solid #fce7f3' }
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={500} color="#111827">{doc.type}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="#ec4899">{doc.queries.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={doc.lastUpdated} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#fce7f3',
                          color: '#db2777',
                          fontWeight: 500,
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ChartCard>
      </Grid>
    </Grid>
  );

  // Queries Tab
  const QueriesTab = () => (
    <Grid container spacing={2.5}>
      {/* AI Resolution Performance */}
      <Grid item xs={12} md={6}>
        <ChartCard title="AI Query Resolution" icon={Zap}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 3 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={98.3}
                size={160}
                thickness={6}
                sx={{ 
                  color: '#166534',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h3" component="div" fontWeight="600" color="#8b5cf6">
                  98.3%
                </Typography>
                <Typography variant="caption" color="#6b7280">Resolution Rate</Typography>
              </Box>
            </Box>
          </Box>
          <Typography variant="body2" color="#6b7280" textAlign="center" sx={{ mt: 1 }}>
            Queries resolved without human intervention
          </Typography>
        </ChartCard>
      </Grid>

      {/* Top Queries */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Top Customer Queries" icon={Search}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: '#fff7ed',
                  '& th': { fontWeight: 600, color: '#ea580c', borderBottom: '2px solid #fed7aa' }
                }}>
                  <TableCell>Query</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">AI %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MOCK_DATA.topQueries.slice(0, 6).map((q, idx) => (
                  <TableRow 
                    key={idx} 
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#fff7ed' },
                      transition: 'background-color 0.2s ease',
                      '& td': { borderBottom: '1px solid #ffedd5' }
                    }}
                  >
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Typography fontWeight={500} noWrap color="#111827">{q.query}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="#f97316">{q.count.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${q.aiResolved}%`}
                        size="small"
                        sx={{
                          bgcolor: q.aiResolved >= 98 ? '#ecfdf5' : q.aiResolved >= 95 ? '#eff6ff' : '#fef3c7',
                          color: q.aiResolved >= 98 ? '#059669' : q.aiResolved >= 95 ? '#2563eb' : '#d97706',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ChartCard>
      </Grid>

      {/* Hourly Distribution */}
      <Grid item xs={12}>
        <ChartCard title="Query Volume by Hour (24h)" icon={Clock}>
          <BarChart
            xAxis={[{ 
              scaleType: 'band', 
              data: MOCK_DATA.hourlyDistribution.map(d => `${d.hour}:00`),
              tickLabelStyle: {
                fontSize: 12,
                fontWeight: 500
              }
            }]}
            yAxis={[{
              tickLabelStyle: {
                fontSize: 12,
                fontWeight: 500
              }
            }]}
            series={[{ 
              data: MOCK_DATA.hourlyDistribution.map(d => d.queries),
              color: '#14b8a6',
              label: 'Queries per Hour'
            }]}
            height={380}
            margin={{ left: 80, right: 40, top: 40, bottom: 60 }}
          />
        </ChartCard>
      </Grid>

      {/* Shipment Methods */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Queries by Shipment Method" icon={Truck}>
          <PieChart
            series={[{
              data: MOCK_DATA.shipmentMethods.map(s => ({
                id: s.method,
                label: s.method,
                value: s.value,
                color: s.color
              })),
              innerRadius: 60,
              outerRadius: 110,
              paddingAngle: 3,
              cornerRadius: 6,
            }]}
            height={340}
            margin={{ left: 20, right: 100, top: 20, bottom: 20 }}
            slotProps={{
              legend: {
                direction: 'column',
                position: { vertical: 'middle', horizontal: 'right' },
                itemMarkWidth: 12,
                itemMarkHeight: 12,
                markGap: 8,
                itemGap: 10,
                labelStyle: {
                  fontSize: 13,
                  fontWeight: 500,
                }
              }
            }}
          />
        </ChartCard>
      </Grid>

      {/* Service Performance */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Service Type Performance" icon={Activity}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: '#f3e8ff',
                  '& th': { fontWeight: 600, color: '#7c3aed', borderBottom: '2px solid #ddd6fe' }
                }}>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">SLA %</TableCell>
                  <TableCell align="right">Volume</TableCell>
                  <TableCell align="right">Avg Days</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MOCK_DATA.servicePerformance.map((s, idx) => (
                  <TableRow 
                    key={idx} 
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#f3e8ff' },
                      transition: 'background-color 0.2s ease',
                      '& td': { borderBottom: '1px solid #ede9fe' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.5, 
                          borderRadius: 1, 
                          bgcolor: '#ede9fe',
                          display: 'flex'
                        }}>
                          {s.service === 'Express' && <Plane size={14} color="#8b5cf6" />}
                          {s.service === 'Economy' && <Truck size={14} color="#8b5cf6" />}
                          {s.service === 'Freight' && <Ship size={14} color="#8b5cf6" />}
                          {s.service === 'Same Day' && <Zap size={14} color="#8b5cf6" />}
                          {s.service === 'Warehousing' && <Building2 size={14} color="#8b5cf6" />}
                        </Box>
                        <Typography fontWeight={500} color="#111827">{s.service}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${s.sla}%`}
                        size="small"
                        sx={{
                          bgcolor: s.sla >= 99 ? '#ecfdf5' : s.sla >= 97 ? '#eff6ff' : '#fef3c7',
                          color: s.sla >= 99 ? '#059669' : s.sla >= 97 ? '#2563eb' : '#d97706',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="#8b5cf6">{s.volume.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#6b7280' }}>{s.avgTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ChartCard>
      </Grid>
    </Grid>
  );

  // Insights Tab
  const InsightsTab = () => (
    <Grid container spacing={2.5}>
      {/* Predictive Insights */}
      <Grid item xs={12}>
        <ChartCard title="Predictive Insights & Alerts" icon={TrendingUp}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {MOCK_DATA.predictiveInsights.map((insight, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Box 
                  sx={{ 
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: insight.type === 'warning' ? '#fef3c7' : 
                                insight.type === 'alert' ? '#fee2e2' : 
                                insight.type === 'success' ? '#dcfce7' : '#e0f2fe',
                    bgcolor: insight.type === 'warning' ? '#fffbeb' : 
                            insight.type === 'alert' ? '#fef2f2' : 
                            insight.type === 'success' ? '#f0fdf4' : '#f0f9ff',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="body2" fontWeight={500} color="#111827">{insight.insight}</Typography>
                    <Chip 
                      label={`${insight.confidence}%`} 
                      size="small" 
                      sx={{ 
                        ml: 1, 
                        minWidth: 50,
                        bgcolor: '#eff6ff',
                        color: '#2563eb',
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }} 
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </ChartCard>
      </Grid>

      {/* Exception Analytics */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Delivery Exception Analysis" icon={AlertTriangle}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: '#fef2f2',
                  '& th': { fontWeight: 600, color: '#dc2626', borderBottom: '2px solid #fecaca' }
                }}>
                  <TableCell>Exception Type</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Trend</TableCell>
                  <TableCell>Severity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MOCK_DATA.exceptionTypes.map((exc, idx) => (
                  <TableRow 
                    key={idx} 
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#fef2f2' },
                      transition: 'background-color 0.2s ease',
                      '& td': { borderBottom: '1px solid #fee2e2' }
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={500} color="#111827">{exc.type}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="#ef4444">{exc.count.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TrendIndicator value={exc.trend} />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={exc.severity}
                        size="small"
                        sx={{
                          bgcolor: exc.severity === 'critical' ? '#fef2f2' :
                                  exc.severity === 'high' ? '#fef3c7' :
                                  exc.severity === 'medium' ? '#eff6ff' : '#ecfdf5',
                          color: exc.severity === 'critical' ? '#dc2626' :
                                exc.severity === 'high' ? '#d97706' :
                                exc.severity === 'medium' ? '#2563eb' : '#059669',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ChartCard>
      </Grid>

      {/* Knowledge Gaps */}
      <Grid item xs={12} md={6}>
        <ChartCard title="Knowledge Gap Analysis" icon={Target}>
          <Typography variant="body2" color="#6b7280" gutterBottom sx={{ mt: -1 }}>
            Topics needing more documentation coverage
          </Typography>
          <Box sx={{ mt: 2 }}>
            {MOCK_DATA.knowledgeGaps.map((gap, idx) => (
              <Box key={idx} sx={{ mb: 2.5 }}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" fontWeight={500} color="#111827">{gap.topic}</Typography>
                  <Typography variant="body2" color="#6b7280" fontWeight={500}>
                    {gap.queries.toLocaleString()} queries
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={gap.coverage}
                    sx={{ 
                      flex: 1,
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#e5e7eb',
                      '& .MuiLinearProgress-bar': { 
                        borderRadius: 4,
                        bgcolor: gap.coverage >= 70 ? '#10b981' : gap.coverage >= 50 ? '#f59e0b' : '#ef4444'
                      }
                    }}
                  />
                  <Typography variant="body2" fontWeight={600} sx={{ 
                    minWidth: 40,
                    color: gap.coverage >= 70 ? '#059669' : gap.coverage >= 50 ? '#d97706' : '#dc2626'
                  }}>
                    {gap.coverage}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </ChartCard>
      </Grid>

      {/* Response Time Trends */}
      <Grid item xs={12}>
        <ChartCard title="Response Time Improvement Trend" icon={Zap}>
          <LineChart
            xAxis={[{ 
              data: MOCK_DATA.dailyTrends.map(d => d.day),
              label: 'Day',
              tickLabelStyle: {
                fontSize: 12,
                fontWeight: 500
              }
            }]}
            yAxis={[{
              tickLabelStyle: {
                fontSize: 12,
                fontWeight: 500
              }
            }]}
            series={[
              { 
                data: MOCK_DATA.dailyTrends.map(d => d.responseTime),
                label: 'Response Time (ms)',
                color: '#f97316',
                area: true,
                curve: 'linear'
              }
            ]}
            height={380}
            margin={{ left: 80, right: 40, top: 40, bottom: 60 }}
            slotProps={{
              legend: {
                direction: 'row',
                position: { vertical: 'top', horizontal: 'right' },
                itemMarkWidth: 12,
                itemMarkHeight: 12,
                markGap: 8,
                itemGap: 20,
                labelStyle: {
                  fontSize: 14,
                  fontWeight: 500,
                }
              }
            }}
          />
        </ChartCard>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  // Tab configuration - premium muted colors
  const tabConfig = [
    { icon: BarChart2, label: 'Overview' },
    { icon: FileText, label: 'Documents' },
    { icon: Search, label: 'Queries' },
    { icon: TrendingUp, label: 'Insights' }
  ];

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: '#f9fafb',
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              fontWeight="600" 
              gutterBottom
              sx={{ 
                color: '#111827',
                letterSpacing: '-0.5px'
              }}
            >
              LogiSearch Document Intelligence Analytics
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280', fontWeight: 400 }}>
              Real-time insights into logistics document processing and customer query resolution
            </Typography>
          </Box>
          
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: '#6b7280' }}>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ 
                  borderRadius: 2, 
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' }
                }}
              >
                <MenuItem value={1}>Last 24 hours</MenuItem>
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={90}>Last 3 months</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<Download size={16} />}
              onClick={() => toast.success('Exporting PDF report...')}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 500,
                borderColor: '#e5e7eb',
                color: '#6b7280',
                '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' }
              }}
            >
              Export PDF
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Download size={16} />}
              onClick={() => toast.success('Exporting Excel data...')}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 500,
                bgcolor: '#3b82f6',
                boxShadow: '0 1px 3px rgba(59,130,246,0.3)',
                '&:hover': {
                  bgcolor: '#2563eb',
                }
              }}
            >
              Export Excel
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Real-Time Dashboard */}
      <RealTimeDashboard />

      {/* KPI Cards */}
      <KPISection />

      {/* Tabs Section */}
      <Card 
        sx={{ 
          borderRadius: 3,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Tab Header */}
        <Box 
          sx={{ 
            bgcolor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            px: 2,
            pt: 1.5
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {tabConfig.map((tab, index) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === index;
              return (
                <Box
                  key={index}
                  onClick={() => setActiveTab(index)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2.5,
                    py: 1.2,
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    bgcolor: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#2563eb' : '#6b7280',
                    fontWeight: isActive ? 600 : 400,
                    '&:hover': {
                      bgcolor: isActive ? '#eff6ff' : '#f3f4f6',
                      color: '#2563eb',
                    },
                    '&::after': isActive ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      bgcolor: '#3b82f6',
                      borderRadius: '2px 2px 0 0'
                    } : {}
                  }}
                >
                  <TabIcon size={16} />
                  <Typography variant="body2" sx={{ fontWeight: 'inherit', fontSize: '0.875rem' }}>
                    {tab.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
        
        {/* Tab Content */}
        <CardContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          {activeTab === 0 && <OverviewTab />}
          {activeTab === 1 && <DocumentsTab />}
          {activeTab === 2 && <QueriesTab />}
          {activeTab === 3 && <InsightsTab />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material'
import { 
  Activity, 
  Clock, 
  Users, 
  FileText,
  TrendingUp,
  Zap
} from 'lucide-react'
import { enterpriseAPI } from '../utils/api'

const RealTimeMetrics = ({ refreshInterval = 30000 }) => {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchMetrics = async () => {
    try {
      const response = await enterpriseAPI.getDashboard(1) // Last 24 hours
      setMetrics(response.data.dashboard)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('Failed to fetch real-time metrics:', err)
      setError('Failed to load real-time metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    const interval = setInterval(fetchMetrics, refreshInterval)
    
    return () => clearInterval(interval)
  }, [refreshInterval])

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={4}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    )
  }

  const overview = metrics?.overview || {}
  
  const realTimeMetrics = [
    {
      title: 'Active Sessions',
      value: overview.active_users || 0,
      icon: <Users size={20} />,
      color: '#2e7d32',
      status: 'online'
    },
    {
      title: 'Queries Today',
      value: overview.total_queries || 0,
      icon: <Activity size={20} />,
      color: '#1976d2',
      status: 'active'
    },
    {
      title: 'Avg Response',
      value: `${Math.round(overview.avg_response_time || 0)}ms`,
      icon: <Zap size={20} />,
      color: overview.avg_response_time < 2000 ? '#2e7d32' : overview.avg_response_time < 5000 ? '#ed6c02' : '#d32f2f',
      status: overview.avg_response_time < 2000 ? 'excellent' : overview.avg_response_time < 5000 ? 'good' : 'slow'
    },
    {
      title: 'Documents',
      value: overview.total_documents || 0,
      icon: <FileText size={20} />,
      color: '#9c27b0',
      status: 'stable'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'excellent':
        return 'success'
      case 'good':
      case 'stable':
        return 'primary'
      case 'slow':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            Real-Time Metrics
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#4caf50',
                animation: 'pulse 2s infinite'
              }} 
            />
            <Typography variant="caption" color="textSecondary">
              Live • Updated {lastUpdate?.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {realTimeMetrics.map((metric, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box 
                sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: metric.color,
                    boxShadow: 1
                  }
                }}
              >
                <Box display="flex" justifyContent="center" mb={1}>
                  <Box sx={{ color: metric.color }}>
                    {metric.icon}
                  </Box>
                </Box>
                
                <Typography variant="h6" component="div" sx={{ color: metric.color, fontWeight: 'bold' }}>
                  {metric.value}
                </Typography>
                
                <Typography variant="caption" color="textSecondary" display="block">
                  {metric.title}
                </Typography>
                
                <Chip 
                  label={metric.status} 
                  size="small" 
                  color={getStatusColor(metric.status)}
                  sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Performance Indicator */}
        <Box mt={2}>
          <Typography variant="caption" color="textSecondary" gutterBottom>
            System Performance
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={overview.avg_response_time < 2000 ? 90 : overview.avg_response_time < 5000 ? 70 : 40}
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: overview.avg_response_time < 2000 ? '#4caf50' : overview.avg_response_time < 5000 ? '#ff9800' : '#f44336'
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default RealTimeMetrics
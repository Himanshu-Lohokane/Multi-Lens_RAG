import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
}

export const uploadAPI = {
  uploadDocument: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadMultiple: (files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return api.post('/upload/documents/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getDocuments: () => api.get('/upload/documents'),
  deleteDocument: (docId) => api.delete(`/upload/documents/${docId}`),
  downloadDocument: (docId) => api.get(`/upload/documents/${docId}/download`, {
    responseType: 'blob'
  }),
  getDocumentPreview: (docId) => api.get(`/upload/documents/${docId}/preview`),
  viewDocument: (docId) => api.get(`/upload/documents/${docId}/view`, {
    responseType: 'blob'
  }),
  getDocumentUrl: (docId) => api.get(`/upload/documents/${docId}/url`),
  getDocumentEntities: (docId) => api.get(`/upload/documents/${docId}/entities`),
}

export const chatAPI = {
  query: (queryData) => api.post('/chat/query', queryData),
  getHistory: (limit = 50, sessionId = null) => {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (sessionId) params.append('session_id', sessionId)
    return api.get(`/chat/history?${params}`)
  },
  getSessions: () => api.get('/chat/sessions'),
  getSuggestions: () => api.get('/chat/suggestions'),
  submitFeedback: (chatId, rating, feedback) =>
    api.post('/chat/feedback', { chat_id: chatId, rating, feedback }),
}

export const enterpriseAPI = {
  getConfig: () => api.get('/enterprise/config'),
  updateConfig: (configData) => api.post('/enterprise/config/update', configData),
  resetConfig: () => api.post('/enterprise/config/reset'),
  getMetrics: () => api.get('/enterprise/metrics'),
  getDocumentTypes: () => api.get('/enterprise/document-types'),
  
  // Analytics endpoints - Updated to use new analytics service
  getDashboard: (days = 30) => api.get(`/analytics/dashboard?days=${days}`),
  getDocumentAnalytics: (days = 30) => api.get(`/analytics/documents?days=${days}`),
  getQueryAnalytics: (days = 30) => api.get(`/analytics/queries?days=${days}`),
  getEntityAnalytics: (days = 30) => api.get(`/analytics/entities?days=${days}`),
  
  // Export functions
  exportPDF: (days = 30) => api.get(`/analytics/export/pdf?days=${days}`),
  exportExcel: (days = 30) => api.get(`/analytics/export/excel?days=${days}`),
  
  // Health check
  analyticsHealth: () => api.get('/analytics/health')
}
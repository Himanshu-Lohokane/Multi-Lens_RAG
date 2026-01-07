import { useState, useEffect } from 'react'
import { Users, FileText, MessageSquare, TrendingUp } from 'lucide-react'
import { authAPI, uploadAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: [],
    documents: [],
    totalUsers: 0,
    totalDocuments: 0,
    totalChats: 0
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [usersResponse, documentsResponse] = await Promise.all([
        authAPI.getUsers(),
        uploadAPI.getDocuments()
      ])

      setStats({
        users: usersResponse.data,
        documents: documentsResponse.data.documents,
        totalUsers: usersResponse.data.length,
        totalDocuments: documentsResponse.data.documents.length,
        totalChats: 0 // This would come from chat history API
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'employee':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage your organization&apos;s users, documents, and system overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Storage</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(stats.documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processed Chunks</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
          </div>
          <div className="p-6">
            {stats.users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No users found</p>
            ) : (
              <div className="space-y-4">
                {stats.users.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Documents</h2>
          </div>
          <div className="p-6">
            {stats.documents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
            ) : (
              <div className="space-y-4">
                {stats.documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size)} • {doc.chunk_count} chunks
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
                {stats.documents.length > 5 && (
                  <div className="text-center pt-2">
                    <a
                      href="/documents"
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      View all {stats.documents.length} documents →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">System Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Tenant Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Tenant ID: {user?.tenant_id}</p>
                <p>Your Role: <span className="capitalize">{user?.role}</span></p>
                <p>Total Users: {stats.totalUsers}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Storage Usage</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Total Documents: {stats.totalDocuments}</p>
                <p>Total Size: {formatFileSize(stats.documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0))}</p>
                <p>Processed Chunks: {stats.documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
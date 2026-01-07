import { useState, useEffect } from 'react'
import { FileText, Trash2, Calendar, User, Download, Eye, Search, Filter, Image, FileVideo, FileAudio, File } from 'lucide-react'
import { uploadAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const DocumentPreview = ({ doc, getDocumentViewUrl }) => {
  const [viewUrl, setViewUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadViewUrl = async () => {
      try {
        setLoading(true)
        const url = await getDocumentViewUrl(doc.id)
        setViewUrl(url)
      } catch (err) {
        setError('Failed to load document')
        console.error('Failed to load document URL:', err)
      } finally {
        setLoading(false)
      }
    }

    loadViewUrl()
  }, [doc.id, getDocumentViewUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2">Loading document...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <File className="h-12 w-12 text-gray-400 mx-auto" />
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">{doc.file_name}</h4>
        <p className="text-red-600 mb-4">{error}</p>
        {doc.text_preview && (
          <div className="bg-gray-50 p-4 rounded-lg text-left">
            <h5 className="font-medium text-gray-900 mb-2">Extracted Content:</h5>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{doc.text_preview}</p>
          </div>
        )}
      </div>
    )
  }

  if (doc.file_name.toLowerCase().endsWith('.pdf')) {
    return (
      <iframe
        src={viewUrl}
        className="w-full h-96 border rounded"
        title={doc.file_name}
      />
    )
  } else if (doc.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
    return (
      <img
        src={viewUrl}
        alt={doc.file_name}
        className="max-w-full h-auto mx-auto"
      />
    )
  } else {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <File className="h-12 w-12 text-gray-400 mx-auto" />
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">{doc.file_name}</h4>
        <p className="text-gray-600 mb-4">Preview not available for this file type</p>
        {doc.text_preview && (
          <div className="bg-gray-50 p-4 rounded-lg text-left">
            <h5 className="font-medium text-gray-900 mb-2">Extracted Content:</h5>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{doc.text_preview}</p>
          </div>
        )}
        <a
          href={viewUrl}
          download={doc.file_name}
          className="btn-primary mt-4 inline-flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download File
        </a>
      </div>
    )
  }
}

const Documents = () => {
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showEntities, setShowEntities] = useState(false)
  const [documentEntities, setDocumentEntities] = useState(null)
  const [entitiesLoading, setEntitiesLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, filterType])

  const loadDocuments = async () => {
    try {
      const response = await uploadAPI.getDocuments()
      setDocuments(response.data.documents)
      setFilteredDocuments(response.data.documents)
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.text_preview && doc.text_preview.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by file type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => {
        const extension = doc.file_name.split('.').pop().toLowerCase()
        switch (filterType) {
          case 'documents':
            return ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'xls'].includes(extension)
          case 'images':
            return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)
          case 'videos':
            return ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'].includes(extension)
          case 'audio':
            return ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'].includes(extension)
          default:
            return true
        }
      })
    }

    setFilteredDocuments(filtered)
  }

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return
    }

    setDeleting(docId)
    try {
      await uploadAPI.deleteDocument(docId)
      setDocuments(prev => prev.filter(doc => doc.id !== docId))
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return <Image className="h-5 w-5 text-green-500" />
    } else if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'].includes(extension)) {
      return <FileVideo className="h-5 w-5 text-purple-500" />
    } else if (['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'].includes(extension)) {
      return <FileAudio className="h-5 w-5 text-orange-500" />
    } else if (['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'xls'].includes(extension)) {
      return <FileText className="h-5 w-5 text-blue-500" />
    } else {
      return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const handleDownload = async (docId, filename) => {
    try {
      const response = await uploadAPI.downloadDocument(docId)
      
      // Create blob and download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Failed to download file:', error)
      toast.error('Failed to download file')
    }
  }

  const handlePreview = async (doc) => {
    setSelectedDoc(doc)
    setShowPreview(true)
  }

  const handleShowEntities = async (doc) => {
    setSelectedDoc(doc)
    setEntitiesLoading(true)
    setShowEntities(true)
    
    try {
      const response = await uploadAPI.getDocumentEntities(doc.id)
      setDocumentEntities(response.data)
    } catch (error) {
      console.error('Failed to load entities:', error)
      toast.error('Failed to load document entities')
      setDocumentEntities(null)
    } finally {
      setEntitiesLoading(false)
    }
  }

  const getDocumentViewUrl = async (docId) => {
    try {
      const response = await uploadAPI.getDocumentUrl(docId)
      return response.data.url
    } catch (error) {
      console.error('Failed to get document URL:', error)
      // Fallback to direct API endpoint
      return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/upload/documents/${docId}/view`
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
        <p className="text-gray-600">
          Manage your uploaded documents and their processing status.
        </p>
      </div>

      {/* Search and Filter */}
      {documents.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Files</option>
              <option value="documents">Documents</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
              <option value="audio">Audio</option>
            </select>
          </div>
        </div>
      )}

      {filteredDocuments.length === 0 && documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-6">
            Upload your first document to get started with AI-powered search.
          </p>
          <a
            href="/upload"
            className="btn-primary inline-flex items-center"
          >
            Upload Documents
          </a>
        </div>
      ) : filteredDocuments.length === 0 && documents.length > 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search terms or filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterType('all')
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                {filteredDocuments.length} of {documents.length} Document{documents.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
                {filterType !== 'all' && ` (${filterType})`}
              </h2>
              <a
                href="/upload"
                className="btn-primary text-sm"
              >
                Upload More
              </a>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.file_name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {doc.file_name}
                        </h3>
                      </div>

                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                        </div>

                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Uploaded by you
                        </div>

                        <span>{formatFileSize(doc.file_size)}</span>

                        {doc.chunk_count && (
                          <span>{doc.chunk_count} chunks processed</span>
                        )}
                      </div>

                      {doc.text_preview && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {doc.text_preview}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Preview document"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleShowEntities(doc)}
                      className="p-2 text-gray-400 hover:text-purple-500 transition-colors"
                      title="View extracted entities"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                      className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <button
                        onClick={() => handleDelete(doc.id, doc.file_name)}
                        disabled={deleting === doc.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete document"
                      >
                        {deleting === doc.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">{selectedDoc.file_name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
              <DocumentPreview doc={selectedDoc} getDocumentViewUrl={getDocumentViewUrl} />
            </div>

          </div>
        </div>
      )}

      {/* Entities Modal */}
      {showEntities && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Extracted Entities - {selectedDoc.file_name}
              </h3>
              <button
                onClick={() => setShowEntities(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
              {entitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-2">Loading entities...</span>
                </div>
              ) : documentEntities ? (
                <div className="space-y-6">
                  {/* Document Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Document Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Document Type:</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {documentEntities.document_type || 'General'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Entities:</span>
                        <span className="ml-2 font-medium">{documentEntities.entities?.entities?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Analysis */}
                  {documentEntities.entities?.sentiment && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Sentiment Analysis</h4>
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="text-gray-500">Score:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            documentEntities.entities.sentiment.score > 0.1 
                              ? 'bg-green-100 text-green-800' 
                              : documentEntities.entities.sentiment.score < -0.1 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {documentEntities.entities.sentiment.score?.toFixed(3) || '0.000'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Magnitude:</span>
                          <span className="ml-2 font-medium">
                            {documentEntities.entities.sentiment.magnitude?.toFixed(3) || '0.000'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Named Entities */}
                  {documentEntities.entities?.entities?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Named Entities</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Salience</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mentions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {documentEntities.entities.entities.slice(0, 20).map((entity, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{entity.name}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    {entity.type}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {entity.salience?.toFixed(3) || '0.000'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {entity.mentions?.length || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Enterprise Entities */}
                  {documentEntities.entities?.enterprise_entities && Object.keys(documentEntities.entities.enterprise_entities).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Enterprise Entities</h4>
                      <div className="space-y-4">
                        {Object.entries(documentEntities.entities.enterprise_entities).map(([category, terms]) => (
                          <div key={category} className="bg-gray-50 p-3 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2 capitalize">
                              {category.replace('_', ' ')}
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {terms.slice(0, 20).map((term, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                                >
                                  {term}
                                </span>
                              ))}
                              {terms.length > 20 && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                                  +{terms.length - 20} more
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  {documentEntities.entities?.entity_summary?.key_insights?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
                      <div className="space-y-2">
                        {documentEntities.entities.entity_summary.key_insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                            <p className="text-sm text-blue-800">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No entities data available for this document.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {documents.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-lg font-semibold text-gray-900">{documents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-5 w-5 bg-green-500 rounded mr-2"></div>
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatFileSize(documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-5 w-5 bg-purple-500 rounded mr-2"></div>
              <div>
                <p className="text-sm text-gray-600">Processed Chunks</p>
                <p className="text-lg font-semibold text-gray-900">
                  {documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Documents
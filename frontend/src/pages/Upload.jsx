import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadAPI } from '../utils/api'
import toast from 'react-hot-toast'

const Upload = () => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState([])

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name} is too large. Maximum size is 200MB.`)
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name} is not a supported file type.`)
          }
        })
      })    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Documents
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      // Images
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/webp': ['.webp'],
      // Videos
      'video/mp4': ['.mp4'],
      'video/avi': ['.avi'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/x-matroska': ['.mkv'],
      'video/webm': ['.webm'],
      'video/x-flv': ['.flv'],
      // Audio
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/mp4': ['.m4a'],
      'audio/flac': ['.flac'],
      'audio/aac': ['.aac'],
      'audio/ogg': ['.ogg']
    },
    maxSize: 200 * 1024 * 1024, // 200MB to accommodate video/audio files
    multiple: true
  })

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadResults([])

    try {
      if (files.length === 1) {
        // Single file upload
        const fileItem = files[0]
        try {
          await uploadAPI.uploadDocument(fileItem.file)
          setUploadResults([{
            filename: fileItem.file.name,
            status: 'success',
            message: 'Upload successful'
          }])
          toast.success('Document uploaded successfully!')
        } catch (error) {
          const message = error.response?.data?.detail || 'Upload failed'
          setUploadResults([{
            filename: fileItem.file.name,
            status: 'error',
            message
          }])
          toast.error(message)
        }
      } else {
        // Multiple file upload
        const fileList = files.map(f => f.file)
        try {
          const response = await uploadAPI.uploadMultiple(fileList)
          setUploadResults(response.data.results.map(result => ({
            ...result,
            status: result.status === 'success' ? 'success' : 'error'
          })))
          
          if (response.data.errors.length > 0) {
            response.data.errors.forEach(error => toast.error(error))
          }
          
          if (response.data.results.length > 0) {
            toast.success(`${response.data.results.length} documents uploaded successfully!`)
          }
        } catch (error) {
          const message = error.response?.data?.detail || 'Bulk upload failed'
          toast.error(message)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const clearAll = () => {
    setFiles([])
    setUploadResults([])
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-gray-600">
          Upload documents, images, videos, and audio files to add them to your knowledge base. AI will extract text, transcriptions, and summaries automatically.
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg text-primary-600">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-600 mb-2">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                Supports: Documents (PDF, DOCX, TXT, CSV, Excel), Images (PNG, JPG, GIF, BMP, WebP), Videos (MP4, AVI, MOV, MKV, WebM, FLV), Audio (MP3, WAV, M4A, FLAC, AAC, OGG) - Max 200MB each
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Files ({files.length})
            </h3>
            <div className="space-x-2">
              <button
                onClick={clearAll}
                className="btn-secondary"
                disabled={uploading}
              >
                Clear All
              </button>
              <button
                onClick={uploadFiles}
                className="btn-primary"
                disabled={uploading || files.length === 0}
              >
                {uploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </div>
                ) : (
                  `Upload ${files.length} File${files.length > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(fileItem.id)}
                  className="text-gray-400 hover:text-red-500"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Results</h3>
          <div className="space-y-2">
            {uploadResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {result.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {result.filename}
                    </p>
                    <p className={`text-xs ${
                      result.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.message || (result.status === 'success' ? 'Upload successful' : 'Upload failed')}
                    </p>
                    
                    {/* Entity Summary */}
                    {result.status === 'success' && result.processing_metadata && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.processing_metadata.entity_insights && result.processing_metadata.entity_insights.length > 0 && (
                          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            📊 {result.processing_metadata.total_entities || 0} entities extracted
                          </div>
                        )}
                        {result.document_type && result.document_type !== 'general' && (
                          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded capitalize">
                            📄 {result.document_type} document
                          </div>
                        )}
                        {result.processing_metadata.total_words && (
                          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            📝 {result.processing_metadata.total_words.toLocaleString()} words
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Supported File Types</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Documents:</strong> PDF, DOCX, TXT files</li>
          <li><strong>Data:</strong> CSV and Excel (XLSX/XLS) files with automatic sheet processing</li>
          <li><strong>Images:</strong> PNG, JPG, GIF, BMP, WebP (AI-powered OCR and visual analysis)</li>
          <li><strong>Videos:</strong> MP4, AVI, MOV, MKV, WebM, FLV (AI transcription and content analysis)</li>
          <li><strong>Audio:</strong> MP3, WAV, M4A, FLAC, AAC, OGG (AI transcription and content analysis)</li>
          <li><strong>Logistics:</strong> Excel files with shipment, inventory, and route data are automatically recognized</li>
        </ul>
        <p className="text-sm text-blue-800 mt-3">
          <strong>Note:</strong> All files are processed automatically using AI to extract text, transcriptions, and summaries. 
          Video and audio files may take longer to process due to AI analysis. Large files may take a few moments to complete.
        </p>
      </div>
    </div>
  )
}

export default Upload
import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, FileText, Lightbulb, Download, Plus, MessageSquare } from 'lucide-react'
import { chatAPI, uploadAPI } from '../utils/api'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import RichContentRenderer from '../components/RichContent'

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [filePreview, setFilePreview] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [chatSessions, setChatSessions] = useState([])
  const [showSessions, setShowSessions] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadSuggestions()
    loadChatSessions()
    // Don't load any chat history on initial mount - start fresh
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSuggestions = async () => {
    try {
      const response = await chatAPI.getSuggestions()
      setSuggestions(response.data.suggestions)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  const loadChatHistory = async (sessionId = null) => {
    try {
      // Only load history if we have a specific session ID
      if (!sessionId) {
        setMessages([])
        return
      }
      
      const response = await chatAPI.getHistory(20, sessionId)
      const history = response.data.history.reverse()
      const formattedHistory = history.map(chat => [
        { type: 'user', content: chat.query, timestamp: chat.created_at },
        {
          type: 'assistant',
          content: chat.answer,
          sources: chat.sources,
          confidence: chat.confidence,
          processing_time_ms: chat.response_time_ms || chat.processing_time_ms,
          timestamp: chat.created_at
        }
      ]).flat()
      setMessages(formattedHistory)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const loadChatSessions = async () => {
    try {
      const response = await chatAPI.getSessions()
      setChatSessions(response.data.sessions)
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentSessionId(null)
    setShowSessions(false)
    // Clear any existing query
    setQuery('')
    toast.success('Started new chat session')
  }

  const loadSession = async (sessionId) => {
    setCurrentSessionId(sessionId)
    await loadChatHistory(sessionId)
    setShowSessions(false)
    toast.success('Loaded chat session')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    const userMessage = { type: 'user', content: query, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setLoading(true)

    try {
      const response = await chatAPI.query({
        query,
        top_k: 2,  // Aggressively optimized for speed
        session_id: currentSessionId
      })
      const { 
        answer, 
        sources, 
        confidence, 
        session_id, 
        processing_time_ms,
        context_quality,
        response_type,
        processing_metadata,
        rich_content
      } = response.data

      // Update session ID if this is a new session
      if (!currentSessionId) {
        setCurrentSessionId(session_id)
        // Refresh sessions list to include the new session
        loadChatSessions()
      }

      const assistantMessage = {
        type: 'assistant',
        content: answer,
        sources: sources,
        confidence: confidence,
        processing_time_ms: processing_time_ms,
        context_quality: context_quality,
        response_type: response_type,
        processing_metadata: processing_metadata,
        rich_content: rich_content,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat query failed:', error)
      toast.error('Failed to get response. Please try again.')

      const errorMessage = {
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
  }

  const handleFilePreview = async (source) => {
    console.log('Attempting to preview source:', source)

    if (!source.file_id) {
      console.error('No file_id in source:', source)
      toast.error(`File preview not available - missing file ID for ${source.file_name}`)
      return
    }

    try {
      console.log(`Fetching preview for file_id: ${source.file_id}`)
      const response = await uploadAPI.getDocumentPreview(source.file_id)
      console.log('Preview response:', response.data)

      // Always show preview modal with relevant section highlighted
      const relevantText = source.chunk_text || source.text || ''
      const previewData = {
        ...response.data,
        highlightText: relevantText, // Text to highlight from the source
        relevantSection: relevantText // The specific relevant section (now much longer)
      }

      setFilePreview(previewData)
      setShowPreviewModal(true)
    } catch (error) {
      console.error('Failed to load file preview:', error)
      console.error('Error details:', error.response?.data)
      
      // Better error handling - show the content we have even if file is missing
      if (error.response?.status === 404) {
        // Document not found - show what we can from the source
        const relevantText = source.chunk_text || source.text || ''
        if (relevantText) {
          const fallbackPreview = {
            file_name: source.file_name,
            file_type: source.file_name?.split('.').pop()?.toUpperCase() || 'Unknown',
            file_size: 0,
            chunk_count: 1,
            text_preview: relevantText,
            full_text_available: false,
            uploaded_by: 'Unknown',
            created_at: new Date().toISOString(),
            id: source.file_id,
            highlightText: relevantText,
            relevantSection: relevantText
          }
          
          setFilePreview(fallbackPreview)
          setShowPreviewModal(true)
          toast.warning(`Original file not found, but showing available content from ${source.file_name}`)
        } else {
          toast.error(`File "${source.file_name}" is no longer available and no content cached`)
        }
      } else {
        toast.error(`Failed to load file preview: ${error.response?.data?.detail || error.message}`)
      }
    }
  }

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const response = await uploadAPI.downloadDocument(fileId)

      // Create blob and download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
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

  const handleImageDownload = (base64Image, fileName) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Image)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Chart downloaded successfully')
    } catch (error) {
      console.error('Failed to download chart:', error)
      toast.error('Failed to download chart')
    }
  }

  const closePreviewModal = () => {
    setShowPreviewModal(false)
    setFilePreview(null)
  }

  const highlightText = (text, highlight) => {
    if (!highlight || highlight.length < 10) return text

    // Clean up the highlight text (remove quotes and extra spaces)
    const cleanHighlight = highlight.replace(/['"]/g, '').trim()

    // Try to find multiple good phrases to highlight
    const words = cleanHighlight.split(' ')
    const phrasesToHighlight = []

    // Try different phrase lengths (3-8 words)
    for (let length = 8; length >= 3; length--) {
      for (let i = 0; i <= words.length - length; i++) {
        const phrase = words.slice(i, i + length).join(' ')
        if (phrase.length > 15 && text.toLowerCase().includes(phrase.toLowerCase())) {
          phrasesToHighlight.push(phrase)
          if (phrasesToHighlight.length >= 3) break // Limit to 3 highlights
        }
      }
      if (phrasesToHighlight.length > 0) break
    }

    // If no good phrases found, try the first 100 characters
    if (phrasesToHighlight.length === 0 && cleanHighlight.length > 20) {
      const firstPart = cleanHighlight.substring(0, 100)
      if (text.toLowerCase().includes(firstPart.toLowerCase())) {
        phrasesToHighlight.push(firstPart)
      }
    }

    if (phrasesToHighlight.length === 0) return text

    // Create regex for all phrases
    const escapedPhrases = phrasesToHighlight.map(phrase =>
      phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    const regex = new RegExp(`(${escapedPhrases.join('|')})`, 'gi')

    return text.split(regex).map((part, index) => {
      const isMatch = phrasesToHighlight.some(phrase =>
        part.toLowerCase() === phrase.toLowerCase()
      )
      return isMatch ?
        <mark key={index} className="bg-yellow-300 px-1 rounded font-medium">{part}</mark> :
        part
    })
  }

  const formatTimestamp = (timestamp) => {
    // Create date object from timestamp (handles both ISO strings and Date objects)
    let date
    if (typeof timestamp === 'string') {
      // If it's an ISO string, parse it properly
      date = new Date(timestamp)
    } else {
      date = new Date(timestamp)
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp)
      return 'Invalid date'
    }
    
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    // Debug logging
    console.log('Formatting timestamp:', {
      original: timestamp,
      parsed: date,
      isToday,
      localTime: date.toLocaleTimeString(),
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    
    if (isToday) {
      // Show only time for today's messages in local timezone
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } else {
      // Show date and time for older messages in local timezone
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Chat Assistant</h1>
            <p className="text-gray-600">Ask questions about your documents and get AI-powered answers.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Sessions ({chatSessions.length})</span>
            </button>
            <button
              onClick={startNewChat}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
        
        {/* Current Session Indicator */}
        {currentSessionId && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
            <MessageSquare className="w-4 h-4" />
            <span>Session: {currentSessionId.slice(0, 8)}...</span>
            <button
              onClick={startNewChat}
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Start New
            </button>
          </div>
        )}
      </div>

      {/* Sessions Sidebar */}
      {showSessions && (
        <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Chat Sessions</h3>
            <button
              onClick={() => setShowSessions(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {chatSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No previous chat sessions</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chatSessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentSessionId === session.session_id
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  }`}
                  onClick={() => loadSession(session.session_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.preview}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {session.message_count} messages
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.last_message).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {currentSessionId === session.session_id && (
                      <div className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to your AI Assistant
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Start by asking a question about your documents. I&apos;ll search through your uploaded files and provide relevant answers.
            </p>

            {suggestions.length > 0 && (
              <div className="w-full max-w-2xl">
                <div className="flex items-center mb-3">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Suggested questions:</span>
                </div>
                <div className="grid gap-2">
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                      }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-lg ${message.type === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}>
                      {message.type === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <ReactMarkdown className="prose prose-sm max-w-none">
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </div>

                    {/* Rich Content Renderer */}
                    {message.type === 'assistant' && message.rich_content && (
                      <RichContentRenderer 
                        richContent={message.rich_content}
                        onImageDownload={handleImageDownload}
                      />
                    )}

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <div className="flex items-center mb-1">
                          <FileText className="w-3 h-3 mr-1" />
                          <span>Sources:</span>
                        </div>
                        <div className="space-y-1">
                          {message.sources.map((source, idx) => (
                            <div key={idx} className="text-gray-600">
                              {typeof source === 'string' ? (
                                // Legacy string format
                                <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                  📄 {source}
                                </span>
                              ) : (
                                // New object format with file access
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleFilePreview(source)}
                                    className="inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                                    title={`Click to see relevant section and full document preview | Relevance: ${(source.relevance_score * 100).toFixed(1)}%`}
                                  >
                                    {source.file_name.toLowerCase().endsWith('.pdf') ? '📕' : '📄'} {source.file_name}
                                  </button>
                                  {source.chunk_text && (
                                    <span className="text-gray-500 text-xs italic truncate max-w-xs">
                                      &quot;{source.chunk_text}&quot;
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.type === 'assistant' && (message.confidence || message.processing_time_ms || message.context_quality || message.response_type) && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {message.confidence && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400">Confidence:</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                message.confidence >= 0.8 
                                  ? 'bg-green-100 text-green-800' 
                                  : message.confidence >= 0.6 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {(message.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {message.context_quality && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400">Quality:</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                message.context_quality >= 0.8 
                                  ? 'bg-green-100 text-green-800' 
                                  : message.context_quality >= 0.6 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {(message.context_quality * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {message.response_type && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400">Type:</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                message.response_type === 'document_based' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {message.response_type === 'document_based' ? 'Document-based' : 'General Knowledge'}
                              </span>
                            </div>
                          )}
                          {message.processing_time_ms && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400">Processing:</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                message.processing_time_ms < 2000 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : message.processing_time_ms < 5000 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {message.processing_time_ms < 1000 
                                  ? `${message.processing_time_ms.toFixed(0)}ms`
                                  : `${(message.processing_time_ms / 1000).toFixed(1)}s`
                                }
                              </span>
                            </div>
                          )}
                          {message.processing_metadata && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400">Chunks:</span>
                              <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-800">
                                {message.processing_metadata.chunks_used || 0}/{message.processing_metadata.total_chunks_analyzed || 0}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex mr-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="flex-1 input-field"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* File Preview Modal */}
      {showPreviewModal && filePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{filePreview.file_name}</h3>
                  <p className="text-sm text-gray-500">
                    {filePreview.file_type} • {Math.round(filePreview.file_size / 1024)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFileDownload(filePreview.id, filePreview.file_name)}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full File</span>
                </button>
                <button
                  onClick={closePreviewModal}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {filePreview.text_preview ? (
                <div className="space-y-4">
                  {/* Relevant Section - Show First */}
                  {filePreview.relevantSection && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-l-4 border-green-500 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-green-900 flex items-center text-lg">
                          🎯 Complete Relevant Section - Full Context
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            ✓ Complete Section
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {filePreview.relevantSection.length} chars
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-lg border-2 border-green-200 shadow-inner">
                        <div className="font-semibold text-green-800 mb-3 text-sm uppercase tracking-wide">
                          📖 Complete Text Section from Document:
                        </div>
                        <div className="text-sm text-gray-900 leading-relaxed bg-yellow-50 p-4 rounded border-l-4 border-yellow-400 max-h-80 overflow-y-auto">
                          <div className="whitespace-pre-wrap">
                            &quot;{filePreview.relevantSection}&quot;
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded flex justify-between">
                          <span>📏 Complete chunk: {filePreview.relevantSection.length} characters</span>
                          <span>🔍 No truncation - full AI context shown</span>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Full Document Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        📄 Complete Document Content
                      </h4>
                      <button
                        onClick={() => handleFileDownload(filePreview.id, filePreview.file_name)}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        📥 Download Complete File
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
                      <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                        {filePreview.highlightText ? (
                          <div className="whitespace-pre-wrap">
                            {highlightText(filePreview.text_preview, filePreview.highlightText)}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {filePreview.text_preview || "No text content available for preview."}
                          </div>
                        )}
                      </div>
                    </div>

                    {!filePreview.full_text_available && (
                      <div className="mt-3 p-3 text-sm text-amber-700 bg-amber-100 border border-amber-300 rounded-lg">
                        ⚠️ <strong>Limited Preview:</strong> This shows extracted text content. Download the file to see the complete document with original formatting, images, and layout.
                      </div>
                    )}

                    {filePreview.full_text_available && (
                      <div className="mt-3 p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg">
                        ✅ <strong>Complete Content:</strong> This shows the full extracted text from your document.
                      </div>
                    )}
                  </div>

                  {/* Document Stats */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">📊 Processed:</span> {filePreview.chunk_count} searchable chunks
                      </div>
                      <div>
                        <span className="font-medium">📏 Size:</span> {Math.round(filePreview.file_size / 1024)} KB
                      </div>
                      <div>
                        <span className="font-medium">📅 Uploaded:</span> {new Date(filePreview.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">👤 By:</span> {filePreview.uploaded_by}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Preview not available for this file type.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click download to view the full file.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
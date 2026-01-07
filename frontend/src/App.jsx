import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import Upload from './pages/Upload'
import AdminDashboard from './pages/AdminDashboard'
import Documents from './pages/Documents'
import Analytics from './pages/Analytics'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={!user ? <Landing /> : <Navigate to="/chat" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/chat" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/chat" />} />
      
      {/* Protected routes */}
      {user ? (
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="/chat" />} />
          <Route path="chat" element={<Chat />} />
          <Route path="upload" element={<Upload />} />
          <Route path="documents" element={<Documents />} />
          <Route path="analytics" element={<Analytics />} />
          {(user.role === 'admin' || user.role === 'super_admin') && (
            <Route path="admin" element={<AdminDashboard />} />
          )}
        </Route>
      ) : (
        <Route path="/app/*" element={<Navigate to="/" />} />
      )}
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/app/chat" : "/"} />} />
    </Routes>
  )
}

export default App
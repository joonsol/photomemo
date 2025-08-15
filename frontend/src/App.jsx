import { useEffect, useState } from 'react'
import api from './api/client'
import AdminAuthPanel from './components/AdminAuthPanel'
import './app.css'

export default function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [me, setMe] = useState(null)
  const isAuthed = !!token

  const handleAuthed = ({ user, token }) => {
    setUser(user)
    setToken(token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }

  const logout = () => {
    setUser(null); setToken(null); setMe(null)
    localStorage.removeItem('user'); localStorage.removeItem('token')
  }

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/api/auth/me')
      setMe(data)
    } catch (e) {
      setMe({ error: e.response?.data || '실패' })
    }
  }

  useEffect(() => {}, [])

  return (
    <div className="page">
      <AdminAuthPanel
        isAuthed={isAuthed}
        user={user}
        me={me}
        onFetchMe={fetchMe}
        onLogout={logout}
        onAuthed={handleAuthed}
        requiredRole="admin"  // 관리자만 허용하려면 유지, 필요 없으면 제거
      />
    </div>
  )
}

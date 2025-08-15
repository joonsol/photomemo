// src/App.jsx
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'   // ✅ 추가
import api from './api/client'
import AdminAuthPanel from './components/AdminAuthPanel'
import Landing from './pages/Landing'
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
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<Landing />} />

        {/* 관리자 인증 패널 라우트 */}
        <Route
          path="/admin"
          element={
            <section className="container" style={{ padding: '2.4rem 0' }}>
              <AdminAuthPanel
                isAuthed={isAuthed}
                user={user}
                me={me}
                onFetchMe={fetchMe}
                onLogout={logout}
                onAuthed={handleAuthed}
                requiredRole="admin"  // 필요 없으면 지워도 됨
              />
            </section>
          }
        />

        {/* 그 외 → 홈으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

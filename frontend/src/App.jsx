// src/App.jsx
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import api from './api/client'
import AdminAuthPanel from './components/AdminAuthPanel'
import Landing from './pages/Landing'
import Header from './components/Header'
import Home from './pages/Home'
import UploadPage from './pages/UploadPage'
import RequireAuth from './routes/RequireAuth'
import RoleGuard from './routes/RoleGuard'           // ★ 추가
import './app.css'

export default function App() {
  const navigate = useNavigate();                   // ★ 추가

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

    // ★ 역할별 리다이렉트
    if (user?.role === 'admin') navigate('/admin', { replace: true });
    else navigate('/home', { replace: true });
  }

  const logout = () => {
    setUser(null); setToken(null); setMe(null)
    localStorage.removeItem('user'); localStorage.removeItem('token')
    navigate('/', { replace: true });              // ★ 로그아웃 시 랜딩으로
  }

  const fetchMe = async () => {
    try { const { data } = await api.get('/api/auth/me'); setMe(data) }
    catch (e) { setMe({ error: e.response?.data || '실패' }) }
  }

  useEffect(() => {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    else delete api.defaults.headers.common['Authorization']
  }, [token])

  return (
    <div className="page">
      <Header user={user} onLogout={logout} />
      <Routes>
        {/* 공개 */}
        <Route path="/" element={<Landing />} />

        {/* 보호(기본 유저) */}
        <Route element={<RequireAuth isAuthed={isAuthed} />}>
          <Route path="/home" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
        </Route>

        {/* 관리자: 역할 가드로 보호 */}
        <Route element={<RoleGuard user={user} allow={['admin']} />}>
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
                  requiredRole="admin"
                />
              </section>
            }
          />
        </Route>

        {/* 나머지 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

import { useState } from 'react'
import api from '../api/client'
import './AuthModal.css'

export default function AuthModal({ open, onClose, onAuthed }) {
  const [mode, setMode] = useState('register') // 'register' | 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      setLoading(true)
      const url = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'register' ? { email, password, displayName } : { email, password }
      const { data } = await api.post(url, body) // { user, token } 기대
      onAuthed?.(data)
      onClose?.()
    } catch (e) {
      const msg = e.response?.data?.message || '요청 실패'
      setErr(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="am-backdrop" onClick={onClose}>
      <div className="am-panel" onClick={(e) => e.stopPropagation()}>
        <div className="am-tabs">
          <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>로그인</button>
          <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>회원가입</button>
        </div>

        <form onSubmit={submit} className="am-form">
          {mode === 'register' && (
            <input
              placeholder="닉네임"
          
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {err && <p className="am-err">{err}</p>}
          <button className='btn primary' type="submit" disabled={loading}>
            {loading ? '처리 중…' : (mode === 'register' ? '가입하기' : '로그인')}
          </button>
        </form>

        <button className="am-close" onClick={onClose} aria-label="닫기">×</button>
      </div>
    </div>
  )
}

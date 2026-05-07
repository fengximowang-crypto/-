import { useState } from 'react'

// 用户账户配置
export const USERS = [
  { id: 'admin',    username: 'admin',    password: '123456', role: 'admin' as const,  displayName: '管理员',    label: '管理员',   labelColor: '#F7FF19' },
  { id: 'shanyang', username: 'shanyang', password: '111111', role: 'player' as const, displayName: '山阳',      label: '队员',    labelColor: '#3b82f6' },
]

export type UserRole = 'admin' | 'player'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  displayName: string
  label: string
  labelColor: string
}

interface Props {
  onLogin: (user: AuthUser) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const user = USERS.find(u => u.username === username && u.password === password)
    if (!user) {
      setError('用户名或密码错误')
      return
    }
    onLogin({ id: user.id, username: user.username, role: user.role, displayName: user.displayName, label: user.label, labelColor: user.labelColor })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 足球主题背景层 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #0a1a05 0%, #0d2a0d 40%, #0a1a05 100%)',
      }} />

      {/* 足球场线条装饰 */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.08,
        backgroundImage: `
          linear-gradient(#fff 2px, transparent 2px),
          linear-gradient(90deg, #fff 2px, transparent 2px),
          linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 25px 25px, 25px 25px',
        backgroundPosition: 'center center',
      }} />

      {/* 中圈装饰 */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 220, height: 220,
        borderRadius: '50%',
        border: '2px solid rgba(247,255,25,0.12)',
      }} />

      {/* 左侧球门装饰 */}
      <div style={{
        position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)',
        width: 80, height: 160,
        border: '3px solid rgba(247,255,25,0.15)',
        borderRight: 'none',
        borderRadius: '4px 0 0 4px',
      }} />

      {/* 右侧球门装饰 */}
      <div style={{
        position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
        width: 80, height: 160,
        border: '3px solid rgba(247,255,25,0.15)',
        borderLeft: 'none',
        borderRadius: '0 4px 4px 0',
      }} />

      {/* 足球图标 */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        fontSize: 64, opacity: 0.06,
      }}>⚽</div>
      <div style={{
        position: 'absolute', bottom: '10%', right: '8%',
        fontSize: 200, opacity: 0.04,
      }}>⚽</div>

      {/* 登录卡片 */}
      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(247,255,25,0.15)',
        borderRadius: 20,
        padding: '48px 40px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 0 80px rgba(247,255,25,0.08), 0 24px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: '#F7FF19',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 12px',
            boxShadow: '0 0 30px rgba(247,255,25,0.4)',
          }}>⚽</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#F7FF19', letterSpacing: '0.1em', textTransform: 'uppercase' }}>GOAT FC</div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>Manager</div>
        </div>

        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 16, color: '#e0e0e0', fontWeight: 700, marginBottom: 4 }}>登录系统</div>
          <div style={{ fontSize: 12, color: '#555' }}>请输入账户信息登录</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              placeholder="输入用户名"
              autoComplete="username"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px',
                background: '#1a1a1a',
                border: `1px solid ${error ? '#ef4444' : '#2a2a2a'}`,
                borderRadius: 10,
                color: '#f0f0f0', fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#F7FF19'}
              onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#2a2a2a'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="输入密码"
              autoComplete="current-password"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px',
                background: '#1a1a1a',
                border: `1px solid ${error ? '#ef4444' : '#2a2a2a'}`,
                borderRadius: 10,
                color: '#f0f0f0', fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#F7FF19'}
              onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#2a2a2a'}
            />
          </div>

          {error && (
            <div style={{
              background: '#ef444420', border: '1px solid #ef4444',
              borderRadius: 8, padding: '8px 12px',
              color: '#ef4444', fontSize: 12, marginBottom: 16,
              textAlign: 'center',
            }}>{error}</div>
          )}

          <button
            type="submit"
            style={{
              width: '100%', padding: '13px',
              background: '#F7FF19',
              color: '#000', fontSize: 13, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              border: 'none', borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 20px rgba(247,255,25,0.3)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e6ed17')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F7FF19')}
          >
            登 录
          </button>
        </form>

      </div>
    </div>
  )
}

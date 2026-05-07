import { useState, useEffect } from 'react'
import type { Player, Match, PlayerMatchStats, NavTab } from './types'
import { storage, seedDemoData, computePlayerRating } from './utils'
import type { AuthUser } from './pages/LoginPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlayersPage from './pages/PlayersPage'
import MatchesPage from './pages/MatchesPage'
import { LayoutDashboard, Users, Calendar, LogOut } from 'lucide-react'
import StorageIndicator from './components/StorageIndicator'

const AUTH_KEY = 'goat-fc-auth'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveUser(user: AuthUser | null) {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  else localStorage.removeItem(AUTH_KEY)
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(loadUser)
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<PlayerMatchStats[]>([])
  const [tab, setTab] = useState<NavTab>('dashboard')
  const [loaded, setLoaded] = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    const state = storage.getState()
    if (state.players.length === 0 && state.matches.length === 0) {
      const demo = seedDemoData()
      setPlayers(demo.players)
      setMatches(demo.matches)
      setStats(demo.playerMatchStats)
      storage.savePlayers(demo.players)
      storage.saveMatches(demo.matches)
      storage.saveStats(demo.playerMatchStats)
    } else {
      setPlayers(state.players)
      setMatches(state.matches)
      setStats(state.playerMatchStats)
    }
    setLoaded(true)
  }, [])

  const handleLogin = (user: AuthUser) => {
    saveUser(user)
    setCurrentUser(user)
  }

  const handleLogout = () => {
    saveUser(null)
    setCurrentUser(null)
  }

  const savePlayer = (p: Player) => {
    const next = players.find(x => x.id === p.id)
      ? players.map(x => x.id === p.id ? p : x)
      : [...players, p]
    setPlayers(next)
    try {
      storage.savePlayers(next)
    } catch (err) {
      console.error('Storage save failed:', err)
      alert('存储空间不足！请尝试移除部分球员头像或联系开发者。')
    }
  }

  const deletePlayer = (id: string) => {
    const next = players.filter(p => p.id !== id)
    setPlayers(next)
    storage.savePlayers(next)
    const nextStats = stats.filter(s => s.playerId !== id)
    setStats(nextStats)
    storage.saveStats(nextStats)
  }

  const saveMatch = (m: Match, newStats: PlayerMatchStats[]) => {
    const nextMatches = matches.find(x => x.id === m.id)
      ? matches.map(x => x.id === m.id ? m : x)
      : [...matches, m]
    setMatches(nextMatches)
    storage.saveMatches(nextMatches)

    const filtered = stats.filter(s => s.matchId !== m.id)
    const nextStats = [...filtered, ...newStats]
    setStats(nextStats)
    storage.saveStats(nextStats)

    const updatedPlayers = players.map(p => {
      const playerMatchStat = newStats.find(s => s.playerId === p.id)
      if (!playerMatchStat) return p
      const newAttrs = computePlayerRating(p, [...stats, ...newStats])
      return { ...p, attributes: newAttrs, updatedAt: new Date().toISOString() }
    })
    setPlayers(updatedPlayers)
    storage.savePlayers(updatedPlayers)
  }

  const deleteMatch = (id: string) => {
    const nextMatches = matches.filter(m => m.id !== id)
    setMatches(nextMatches)
    storage.saveMatches(nextMatches)
    const nextStats = stats.filter(s => s.matchId !== id)
    setStats(nextStats)
    storage.saveStats(nextStats)
  }

  if (!loaded) return (
    <div style={{ background: '#111', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚽</div>
        <div style={{ color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 14 }}>Loading...</div>
      </div>
    </div>
  )

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  const navItems: { id: NavTab; label: string; Icon: any; count?: number }[] = [
    { id: 'dashboard', label: '数据中心', Icon: LayoutDashboard },
    { id: 'players', label: '球员管理', Icon: Users, count: players.length },
    { id: 'matches', label: '比赛记录', Icon: Calendar, count: matches.length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#111111', display: 'flex', flexDirection: 'column' }}>
      {/* Top Nav */}
      <nav style={{
        background: '#0d0d0d',
        borderBottom: '1px solid #1e1e1e',
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 56 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#F7FF19', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900,
            }}>⚽</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#F7FF19', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}>GOAT FC</div>
              <div style={{ fontSize: 8, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>Manager</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flex: 1 }}>
            {navItems.map(({ id, label, Icon, count }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: active ? '#F7FF1918' : 'transparent',
                    color: active ? '#F7FF19' : '#555',
                    fontSize: 12, fontWeight: active ? 700 : 600,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    transition: 'all 0.15s',
                    borderBottom: active ? '2px solid #F7FF19' : '2px solid transparent',
                  }}
                >
                  <Icon size={14} />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 8,
                      background: active ? '#F7FF19' : '#222',
                      color: active ? '#000' : '#555',
                    }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Season badge */}
          <div style={{ fontSize: 10, color: '#444', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 16, flexShrink: 0 }}>
            赛季 2025-26
          </div>

          {/* User info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              borderRadius: 8,
              background: currentUser.labelColor + '15',
              border: `1px solid ${currentUser.labelColor}30`,
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: currentUser.labelColor }}>
                {currentUser.displayName.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#e0e0e0', lineHeight: 1 }}>{currentUser.displayName}</div>
                <div style={{ fontSize: 9, color: currentUser.labelColor, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1, marginTop: 1 }}>{currentUser.label}</div>
              </div>
            </div>
            {currentUser.role === 'player' && (
              <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: '#ef444415', border: '1px solid #ef444430' }}>
                只读
              </div>
            )}
            <button
              onClick={handleLogout}
              title="退出登录"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32,
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: 8, cursor: 'pointer', color: '#555',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#2a2a2a' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ flex: 1 }}>
        {tab === 'dashboard' && <DashboardPage players={players} matches={matches} stats={stats} />}
        {tab === 'players' && <PlayersPage players={players} stats={stats} matches={matches} onSave={savePlayer} onDelete={deletePlayer} isAdmin={isAdmin} />}
        {tab === 'matches' && <MatchesPage matches={matches} players={players} stats={stats} onSaveMatch={saveMatch} onDeleteMatch={deleteMatch} isAdmin={isAdmin} />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, color: '#2a2a2a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          GOAT FC Manager · 数据存储于本地浏览器 · 无需联网
        </div>
        <StorageIndicator />
      </footer>
    </div>
  )
}

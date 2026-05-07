import { useState, useEffect } from 'react'
import type { Player, Match, PlayerMatchStats, NavTab } from './types'
import { seedDemoData, computePlayerRating } from './utils'
import * as db from './lib/database'
import type { AuthUser } from './pages/LoginPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlayersPage from './pages/PlayersPage'
import MatchesPage from './pages/MatchesPage'
import { LayoutDashboard, Users, Calendar, LogOut, Cloud, CloudOff, Home, UserPlus, ClipboardList } from 'lucide-react'

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
  const [syncing, setSyncing] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  const isAdmin = currentUser?.role === 'admin'

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const [cloudPlayers, cloudMatches, cloudStats] = await Promise.all([
          db.fetchPlayers(),
          db.fetchMatches(),
          db.fetchPlayerMatchStats(),
        ])

        // If cloud is empty, seed demo data
        if (cloudPlayers.length === 0 && cloudMatches.length === 0) {
          const demo = seedDemoData()
          await db.syncLocalToCloud(demo.players, demo.matches, demo.playerMatchStats)
          setPlayers(demo.players)
          setMatches(demo.matches)
          setStats(demo.playerMatchStats)
        } else {
          setPlayers(cloudPlayers)
          setMatches(cloudMatches)
          setStats(cloudStats)
        }
      } catch (err) {
        console.error('Failed to load from cloud:', err)
        // Fallback to localStorage
        const state = {
          players: JSON.parse(localStorage.getItem('goat-players') || '[]'),
          matches: JSON.parse(localStorage.getItem('goat-matches') || '[]'),
          playerMatchStats: JSON.parse(localStorage.getItem('goat-player-match-stats') || '[]'),
        }
        setPlayers(state.players)
        setMatches(state.matches)
        setStats(state.playerMatchStats)
      }
      setLoaded(true)
    }
    loadData()
  }, [])

  const handleLogin = (user: AuthUser) => {
    saveUser(user)
    setCurrentUser(user)
  }

  const handleLogout = () => {
    saveUser(null)
    setCurrentUser(null)
  }

  const savePlayer = async (p: Player) => {
    setSyncing(true)
    try {
      const next = players.find(x => x.id === p.id)
        ? players.map(x => x.id === p.id ? p : x)
        : [...players, p]
      setPlayers(next)

      if (players.find(x => x.id === p.id)) {
        await db.updatePlayer(p)
      } else {
        await db.createPlayer(p)
      }
    } catch (err) {
      console.error('Save player failed:', err)
      // Fallback to localStorage
      const next = players.find(x => x.id === p.id)
        ? players.map(x => x.id === p.id ? p : x)
        : [...players, p]
      localStorage.setItem('goat-players', JSON.stringify(next))
    }
    setSyncing(false)
  }

  const deletePlayer = async (id: string) => {
    setSyncing(true)
    try {
      const next = players.filter(p => p.id !== id)
      setPlayers(next)
      await db.deletePlayer(id)
      const nextStats = stats.filter(s => s.playerId !== id)
      setStats(nextStats)
    } catch (err) {
      console.error('Delete player failed:', err)
      const next = players.filter(p => p.id !== id)
      localStorage.setItem('goat-players', JSON.stringify(next))
    }
    setSyncing(false)
  }

  const saveMatch = async (m: Match, newStats: PlayerMatchStats[]) => {
    setSyncing(true)
    try {
      const nextMatches = matches.find(x => x.id === m.id)
        ? matches.map(x => x.id === m.id ? m : x)
        : [...matches, m]
      setMatches(nextMatches)

      if (matches.find(x => x.id === m.id)) {
        await db.updateMatch(m)
      } else {
        await db.createMatch(m)
      }

      const filtered = stats.filter(s => s.matchId !== m.id)
      const nextStats = [...filtered, ...newStats]
      setStats(nextStats)

      // Save player match stats
      for (const stat of newStats) {
        await db.createPlayerMatchStats(stat)
      }

      // Update player attributes based on new stats
      const updatedPlayers = players.map(p => {
        const playerMatchStat = newStats.find(s => s.playerId === p.id)
        if (!playerMatchStat) return p
        const newAttrs = computePlayerRating(p, [...stats, ...newStats])
        return { ...p, attributes: newAttrs, updatedAt: new Date().toISOString() }
      })
      setPlayers(updatedPlayers)
      for (const p of updatedPlayers) {
        await db.updatePlayer(p)
      }
    } catch (err) {
      console.error('Save match failed:', err)
      const nextMatches = matches.find(x => x.id === m.id)
        ? matches.map(x => x.id === m.id ? m : x)
        : [...matches, m]
      localStorage.setItem('goat-matches', JSON.stringify(nextMatches))
    }
    setSyncing(false)
  }

  const deleteMatch = async (id: string) => {
    setSyncing(true)
    try {
      const nextMatches = matches.filter(m => m.id !== id)
      setMatches(nextMatches)
      await db.deleteMatch(id)
      const nextStats = stats.filter(s => s.matchId !== id)
      setStats(nextStats)
    } catch (err) {
      console.error('Delete match failed:', err)
      const nextMatches = matches.filter(m => m.id !== id)
      localStorage.setItem('goat-matches', JSON.stringify(nextMatches))
    }
    setSyncing(false)
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
    { id: 'dashboard', label: '首页', Icon: LayoutDashboard },
    { id: 'players', label: '球员', Icon: Users, count: players.length },
    { id: 'matches', label: '比赛', Icon: Calendar, count: matches.length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#111111', display: 'flex', flexDirection: 'column' }}>
      {/* Desktop Top Nav */}
      <nav className="desktop-top-nav" style={{
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

          {/* Sync status */}
          {syncing && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 8,
              background: '#f59e0b15', border: '1px solid #f59e0b30',
              fontSize: 10, color: '#f59e0b', fontWeight: 600,
            }}>
              <div className="spin" style={{ width: 12, height: 12, border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%' }} />
              同步中...
            </div>
          )}

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
      <main className="main-content" style={{ flex: 1, padding: '16px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {tab === 'dashboard' && <DashboardPage players={players} matches={matches} stats={stats} />}
        {tab === 'players' && <PlayersPage players={players} stats={stats} matches={matches} onSave={savePlayer} onDelete={deletePlayer} isAdmin={isAdmin} />}
        {tab === 'matches' && <MatchesPage matches={matches} players={players} stats={stats} onSaveMatch={saveMatch} onDeleteMatch={deleteMatch} isAdmin={isAdmin} />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0d0d0d',
        borderTop: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '8px 0', zIndex: 50,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}>
        {navItems.map(({ id, label, Icon, count }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 20px', border: 'none', cursor: 'pointer',
                background: active ? '#F7FF1915' : 'transparent',
                color: active ? '#F7FF19' : '#555',
                fontSize: 10, fontWeight: active ? 700 : 600,
                borderRadius: 12, transition: 'all 0.15s',
                minWidth: 70,
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span style={{ letterSpacing: '0.02em' }}>{label}</span>
              {count !== undefined && count > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: '15%',
                  fontSize: 9, fontWeight: 800,
                  padding: '1px 5px', borderRadius: 8,
                  background: '#F7FF19', color: '#000',
                }}>{count}</span>
              )}
            </button>
          )
        })}
        
        {/* User profile button */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '8px 20px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#555',
            fontSize: 10, fontWeight: 600, borderRadius: 12,
          }}
        >
          <LogOut size={22} strokeWidth={2} />
          <span>退出</span>
        </button>
      </nav>

      {/* Footer - desktop only */}
      <footer className="mobile-hide" style={{ borderTop: '1px solid #1a1a1a', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, color: '#2a2a2a', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
          {online ? <Cloud size={12} /> : <CloudOff size={12} />}
          数据存储于云端 · {online ? '已同步' : '离线模式'}
        </div>
      </footer>
    </div>
  )
}

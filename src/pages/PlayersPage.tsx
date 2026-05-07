import { useState } from 'react'
import type { Player, PlayerMatchStats, Match, Position, PlayerStatus } from '@/types'
import { computePlayerRating, getOverallRating, POSITION_COLORS, STATUS_COLORS, STATUS_LABELS } from '@/utils'
import PlayerCard from '@/components/PlayerCard'
import PlayerForm from '@/components/PlayerForm'
import PlayerDetail from '@/components/PlayerDetail'
import { Plus, Search, Users } from 'lucide-react'

interface PlayersPageProps {
  players: Player[]
  stats: PlayerMatchStats[]
  matches: Match[]
  onSave: (p: Player) => void
  onDelete: (id: string) => void
  isAdmin: boolean
}

export default function PlayersPage({ players, stats, matches, onSave, onDelete, isAdmin }: PlayersPageProps) {
  const [search, setSearch] = useState('')
  const [filterPos, setFilterPos] = useState<Position | 'ALL'>('ALL')
  const [filterStatus, setFilterStatus] = useState<PlayerStatus | 'ALL'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editPlayer, setEditPlayer] = useState<Player | undefined>(undefined)
  const [detailPlayer, setDetailPlayer] = useState<Player | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'overall' | 'name' | 'number'>('overall')

  const filtered = players
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || String(p.number).includes(search))
    .filter(p => filterPos === 'ALL' || p.positions.includes(filterPos))
    .filter(p => filterStatus === 'ALL' || p.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'overall') {
        const ao = getOverallRating(computePlayerRating(a, stats))
        const bo = getOverallRating(computePlayerRating(b, stats))
        return bo - ao
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return a.number - b.number
    })

  const handleSave = (p: Player) => {
    onSave(p)
    setShowForm(false)
    setEditPlayer(undefined)
  }

  const handleDelete = (id: string) => {
    if (confirm('确认删除该球员？')) {
      onDelete(id)
      setDetailPlayer(undefined)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#F7FF19', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            球员管理
          </h1>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{players.length} 名球员</div>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditPlayer(undefined); setShowForm(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 8, border: 'none',
              background: '#F7FF19', color: '#000', cursor: 'pointer',
              fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
          >
            <Plus size={16} /> 添加球员
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名或号码..."
            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#f0f0f0', borderRadius: 8, padding: '10px 10px 10px 32px', fontSize: 13, width: '100%', outline: 'none' }}
          />
        </div>

        {/* Position filter - scrollable on mobile */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
          {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
            const active = filterPos === pos
            const color = pos === 'ALL' ? '#F7FF19' : POSITION_COLORS[pos]
            return (
              <button key={pos} onClick={() => setFilterPos(pos)} style={{
                padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 11,
                border: `1px solid ${active ? color : '#333'}`,
                background: active ? `${color}22` : 'transparent',
                color: active ? color : '#555',
                textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
              }}>
                {pos === 'ALL' ? '全部' : pos}
              </button>
            )
          })}
        </div>
      </div>

      {/* Player grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#333' }}>
          <Users size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>暂无球员</div>
          <div style={{ fontSize: 12, marginTop: 4, color: '#2a2a2a' }}>点击「添加球员」开始构建你的球队</div>
        </div>
      ) : (
        <div className="grid-auto-fill" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="fade-in-up">
              <PlayerCard
                player={p}
                allStats={stats}
                onClick={() => setDetailPlayer(p)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && isAdmin && (
        <PlayerForm
          player={editPlayer}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditPlayer(undefined) }}
        />
      )}

      {detailPlayer && (
        <PlayerDetail
          player={detailPlayer}
          allStats={stats}
          allMatches={matches}
          isAdmin={isAdmin}
          onClose={() => setDetailPlayer(undefined)}
          onEdit={() => {
            setEditPlayer(detailPlayer)
            setDetailPlayer(undefined)
            setShowForm(true)
          }}
          onDelete={() => handleDelete(detailPlayer.id)}
        />
      )}
    </div>
  )
}

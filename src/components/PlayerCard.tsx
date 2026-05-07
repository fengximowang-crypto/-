import { useState } from 'react'
import type { Player, PlayerMatchStats } from '@/types'
import { computePlayerRating, getOverallRating, getDimensionRatings, POSITION_COLORS, STATUS_LABELS, STATUS_COLORS, POSITION_LABELS } from '@/utils'
import RadarChart from './RadarChart'

interface PlayerCardProps {
  player: Player
  allStats: PlayerMatchStats[]
  onClick?: () => void
}

function StatBar({ label, value, color = '#F7FF19' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, width: 68, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 0.8s ease-out',
          }}
        />
      </div>
      <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, width: 24, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function PlayerCard({ player, allStats, onClick }: PlayerCardProps) {
  const [flipped, setFlipped] = useState(false)

  const attrs = computePlayerRating(player, allStats)
  const overall = getOverallRating(attrs)
  const dims = getDimensionRatings(attrs)
  const posColor = POSITION_COLORS[player.positions[0]] || '#888'

  const radarData = [
    { label: '技术', value: dims.technical },
    { label: '身体', value: dims.physical },
    { label: '态度', value: dims.mental },
    { label: '意识', value: dims.awareness },
  ]

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-flip]')) {
      setFlipped(f => !f)
      return
    }
    onClick?.()
  }

  const overallColor =
    overall >= 80 ? '#F7FF19' :
    overall >= 65 ? '#22c55e' :
    overall >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div
      className="card-3d cursor-pointer"
      style={{ width: 200, height: 280 }}
      onClick={handleClick}
    >
      <div className={`card-inner ${flipped ? 'flipped' : ''}`} style={{ width: '100%', height: '100%' }}>
        {/* ─ Front ─ */}
        <div
          className="card-face rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(160deg, #1e1e1e 0%, #141414 50%, #0d0d0d 100%)`,
            border: `1px solid ${posColor}44`,
            boxShadow: `0 0 24px ${posColor}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Top strip */}
          <div style={{ background: posColor, height: 3, width: '100%' }} />

          {/* Header */}
          <div style={{ padding: '10px 12px 6px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Overall */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: overallColor, lineHeight: 1, letterSpacing: '-1px' }}>{overall}</div>
                <div style={{ fontSize: 8, color: posColor, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>OVR</div>
              </div>

              {/* Position */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  background: posColor,
                  color: '#000',
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.05em',
                }}>{player.positions[0]}</div>
                <div style={{ fontSize: 9, color: '#666', marginTop: 3 }}>#{player.number}</div>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: player.avatar ? 'transparent' : `${posColor}22`,
              border: `2px solid ${posColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {player.avatar ? (
                <img src={player.avatar} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 28 }}>⚽</span>
              )}
            </div>
          </div>

          {/* Name */}
          <div style={{ textAlign: 'center', padding: '6px 8px 4px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.2 }}>{player.name}</div>
            <div style={{ fontSize: 9, color: posColor, marginTop: 2, letterSpacing: '0.08em' }}>
              {player.positions.map(p => POSITION_LABELS[p]).join(' / ')}
            </div>
          </div>

          {/* Status badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <span style={{
              fontSize: 8,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10,
              background: `${STATUS_COLORS[player.status]}22`,
              color: STATUS_COLORS[player.status],
              border: `1px solid ${STATUS_COLORS[player.status]}44`,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>{STATUS_LABELS[player.status]}</span>
          </div>

          {/* Mini radar */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart data={radarData} size={72} mini />
          </div>

          {/* Dim scores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: '6px 10px 8px' }}>
            {[
              { label: '技', val: dims.technical },
              { label: '体', val: dims.physical },
              { label: '态', val: dims.mental },
              { label: '识', val: dims.awareness },
            ].map(d => (
              <div key={d.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '3px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#F7FF19' }}>{d.val}</div>
                <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.05em' }}>{d.label}</div>
              </div>
            ))}
          </div>

          {/* Flip hint */}
          <div data-flip="true" style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 8, color: '#444', cursor: 'pointer' }}>
            详情 ↩
          </div>
        </div>

        {/* ─ Back ─ */}
        <div
          className="card-face card-face-back rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(160deg, #1e1e1e 0%, #141414 100%)`,
            border: `1px solid ${posColor}44`,
            padding: '10px 12px',
          }}
        >
          <div style={{ background: posColor, height: 3, width: '100%', marginBottom: 8, marginLeft: -12, marginRight: -12, width: 'calc(100% + 24px)' }} />
          <div style={{ fontSize: 10, fontWeight: 800, color: posColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            {player.name} · 详细属性
          </div>

          {/* Technical */}
          <div style={{ fontSize: 8, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>技术</div>
          <StatBar label="射门" value={attrs.shooting} color="#ef4444" />
          <StatBar label="传球" value={attrs.passing} color="#3b82f6" />
          <StatBar label="盘带" value={attrs.dribbling} color="#F7FF19" />
          <StatBar label="停球" value={attrs.firstTouch} color="#a78bfa" />

          <div style={{ fontSize: 8, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '5px 0 3px' }}>身体</div>
          <StatBar label="速度" value={attrs.pace} color="#f59e0b" />
          <StatBar label="体能" value={attrs.stamina} color="#22c55e" />
          <StatBar label="力量" value={attrs.strength} color="#ef4444" />
          <StatBar label="敏捷" value={attrs.agility} color="#F7FF19" />

          <div style={{ fontSize: 8, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '5px 0 3px' }}>态度</div>
          <StatBar label="拼抢" value={attrs.aggression} color="#f59e0b" />
          <StatBar label="配合" value={attrs.teamwork} color="#3b82f6" />
          <StatBar label="纪律" value={attrs.discipline} color="#22c55e" />
          <StatBar label="领导力" value={attrs.leadership} color="#a78bfa" />

          <div style={{ fontSize: 8, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '5px 0 3px' }}>意识</div>
          <StatBar label="站位" value={attrs.positioning} color="#3b82f6" />
          <StatBar label="决策" value={attrs.decisions} color="#22c55e" />
          <StatBar label="视野" value={attrs.vision} color="#F7FF19" />
          <StatBar label="预判" value={attrs.anticipation} color="#f59e0b" />

          <div data-flip="true" style={{ textAlign: 'right', fontSize: 8, color: '#444', marginTop: 4, cursor: 'pointer' }}>↩ 返回</div>
        </div>
      </div>
    </div>
  )
}

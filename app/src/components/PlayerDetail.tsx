import { useState, useRef } from 'react'
import type { Player, Match, PlayerMatchStats } from '@/types'
import { computePlayerRating, getDimensionRatings, getOverallRating, STATUS_COLORS, STATUS_LABELS, POSITION_LABELS, POSITION_COLORS } from '@/utils'
import RadarChart from './RadarChart'
import { X, Edit2, Trash2, ChevronRight, Star } from 'lucide-react'

interface PlayerDetailProps {
  player: Player
  allStats: PlayerMatchStats[]
  allMatches: Match[]
  isAdmin: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
      <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>{value}</span>
        {sub && <div style={{ fontSize: 10, color: '#555' }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function PlayerDetail({ player, allStats, allMatches, isAdmin, onClose, onEdit, onDelete }: PlayerDetailProps) {
  const attrs = computePlayerRating(player, allStats)
  const dims = getDimensionRatings(attrs)
  const overall = getOverallRating(attrs)
  const posColor = POSITION_COLORS[player.positions[0]] || '#888'

  const playerStats = allStats.filter(s => s.playerId === player.id)
  const n = playerStats.length || 1
  const totalGoals = playerStats.reduce((a, s) => a + s.goals, 0)
  const totalAssists = playerStats.reduce((a, s) => a + s.assists, 0)
  const totalMatches = playerStats.length

  const radarData = [
    { label: '射门', value: attrs.shooting },
    { label: '传球', value: attrs.passing },
    { label: '盘带', value: attrs.dribbling },
    { label: '速度', value: attrs.pace },
    { label: '体能', value: attrs.stamina },
    { label: '意识', value: Math.round((attrs.positioning + attrs.decisions + attrs.vision + attrs.anticipation) / 4) },
  ]

  const overallColor =
    overall >= 80 ? '#F7FF19' :
    overall >= 65 ? '#22c55e' :
    overall >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: 12, width: '100%', maxWidth: 480,
        border: '1px solid #2a2a2a', maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header strip */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${posColor}, #F7FF19)`, flexShrink: 0 }} />

        {/* Top bar */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #222', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: player.avatar ? 'transparent' : `${posColor}22`,
              border: `2px solid ${posColor}55`, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {player.avatar ? (
                <img src={player.avatar} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : <span style={{ fontSize: 22 }}>⚽</span>}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>{player.name}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                <span style={{ background: posColor, color: '#000', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 3 }}>{player.positions.join('/')}</span>
                <span style={{ fontSize: 11, color: '#666' }}>#{player.number} · {player.age}岁</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                  background: `${STATUS_COLORS[player.status]}22`, color: STATUS_COLORS[player.status],
                }}>{STATUS_LABELS[player.status]}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAdmin && (
              <>
                <button onClick={onEdit} style={{ background: '#222', border: '1px solid #333', borderRadius: 6, padding: '6px 10px', color: '#aaa', cursor: 'pointer' }}><Edit2 size={14} /></button>
                <button onClick={onDelete} style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 6, padding: '6px 10px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Overall + Radar */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: overallColor, lineHeight: 1, letterSpacing: '-2px' }}>{overall}</div>
              <div style={{ fontSize: 10, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>OVERALL</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 8 }}>
                {[
                  { label: '技', val: dims.technical, color: '#ef4444' },
                  { label: '体', val: dims.physical, color: '#3b82f6' },
                  { label: '态', val: dims.mental, color: '#22c55e' },
                  { label: '识', val: dims.awareness, color: '#a78bfa' },
                ].map(d => (
                  <div key={d.label} style={{ background: '#222', borderRadius: 4, padding: '3px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: d.color }}>{d.val}</div>
                    <div style={{ fontSize: 8, color: '#555' }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <RadarChart data={radarData} size={160} color="#F7FF19" />
          </div>

          {/* Career stats */}
          <div style={{ background: '#222', borderRadius: 8, padding: '12px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>赛季数据</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: '出场', val: totalMatches },
                { label: '进球', val: totalGoals },
                { label: '助攻', val: totalAssists },
                { label: '场均进球', val: totalMatches ? (totalGoals / totalMatches).toFixed(1) : '0.0' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: '#555', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Physical info */}
          <div style={{ background: '#222', borderRadius: 8, padding: '12px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>基础信息</div>
            <StatRow label="身高" value={`${player.height} cm`} />
            <StatRow label="体重" value={`${player.weight} kg`} />
            <StatRow label="年龄" value={`${player.age} 岁`} />
            <StatRow label="惯用脚" value={player.preferredFoot === 'RIGHT' ? '右脚' : player.preferredFoot === 'LEFT' ? '左脚' : '双脚'} />
            <StatRow label="入队时间" value={player.joinedAt?.slice(0, 10) || '-'} />
            {player.notes && <StatRow label="备注" value={player.notes} />}
          </div>

          {/* All attributes */}
          <div style={{ background: '#222', borderRadius: 8, padding: '12px' }}>
            <div style={{ fontSize: 10, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>全部属性</div>
            {[
              { group: '技术', items: [{ k: '射门', v: attrs.shooting }, { k: '传球', v: attrs.passing }, { k: '盘带', v: attrs.dribbling }, { k: '停球', v: attrs.firstTouch }] },
              { group: '身体', items: [{ k: '速度', v: attrs.pace }, { k: '体能', v: attrs.stamina }, { k: '力量', v: attrs.strength }, { k: '敏捷', v: attrs.agility }] },
              { group: '态度', items: [{ k: '拼抢', v: attrs.aggression }, { k: '配合', v: attrs.teamwork }, { k: '纪律', v: attrs.discipline }, { k: '领导力', v: attrs.leadership }] },
              { group: '意识', items: [{ k: '站位', v: attrs.positioning }, { k: '决策', v: attrs.decisions }, { k: '视野', v: attrs.vision }, { k: '预判', v: attrs.anticipation }] },
            ].map(g => (
              <div key={g.group} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{g.group}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
                  {g.items.map(item => (
                    <div key={item.k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                      <span style={{ fontSize: 11, color: '#888', width: 40, flexShrink: 0 }}>{item.k}</span>
                      <div style={{ flex: 1, height: 3, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.v}%`, background: '#F7FF19', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#F7FF19', width: 22, textAlign: 'right' }}>{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

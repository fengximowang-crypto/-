import { useState } from 'react'
import type { Match, Player, PlayerMatchStats } from '@/types'
import { getMatchResult, formatDate, MATCH_TYPE_LABELS, computeMatchRating } from '@/utils'
import MatchForm from '@/components/MatchForm'
import { Plus, Calendar } from 'lucide-react'
import { X, Trash2, Edit2 } from 'lucide-react'

interface MatchesPageProps {
  matches: Match[]
  players: Player[]
  stats: PlayerMatchStats[]
  onSaveMatch: (m: Match, s: PlayerMatchStats[]) => void
  onDeleteMatch: (id: string) => void
  isAdmin: boolean
}

function ResultBadge({ result }: { result: 'WIN' | 'DRAW' | 'LOSS' }) {
  const map = {
    WIN:  { label: '胜', bg: '#22c55e22', color: '#22c55e', border: '#22c55e44' },
    DRAW: { label: '平', bg: '#f59e0b22', color: '#f59e0b', border: '#f59e0b44' },
    LOSS: { label: '负', bg: '#ef4444', color: '#ef4444', border: '#ef4444' },
  }
  const s = map[result]
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: '0.05em' }}>
      {s.label}
    </span>
  )
}

function MatchDetail({ match, stats, players, isAdmin, onClose, onEdit, onDelete }: {
  match: Match; stats: PlayerMatchStats[]; players: Player[]
  isAdmin: boolean
  onClose: () => void; onEdit: () => void; onDelete: () => void
}) {
  const result = getMatchResult(match.ourScore, match.opponentScore)
  const matchStats = stats.filter(s => s.matchId === match.id)

  const scorers = matchStats.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals)
  const assisters = matchStats.filter(s => s.assists > 0).sort((a, b) => b.assists - a.assists)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1a1a1a', borderRadius: 12, width: '100%', maxWidth: 560, border: '1px solid #2a2a2a', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 4, background: result === 'WIN' ? '#22c55e' : result === 'DRAW' ? '#f59e0b' : '#ef4444', flexShrink: 0 }} />

        <div style={{ padding: '14px 16px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{match.opponent}</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{formatDate(match.date)} · {MATCH_TYPE_LABELS[match.type]} · {match.venue}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {isAdmin && (
              <>
                <button onClick={onEdit} style={{ background: '#222', border: '1px solid #333', borderRadius: 6, padding: '5px 9px', color: '#aaa', cursor: 'pointer' }}><Edit2 size={13} /></button>
                <button onClick={onDelete} style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 6, padding: '5px 9px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
              </>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}><X size={16} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* Score */}
          <div style={{ background: '#222', borderRadius: 10, padding: '16px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: '#F7FF19', fontWeight: 700, marginBottom: 4 }}>我方</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{match.ourScore}</div>
              </div>
              <div>
                <ResultBadge result={result} />
                <div style={{ fontSize: 24, color: '#333', fontWeight: 900, marginTop: 4 }}>:</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>{match.opponent}</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{match.opponentScore}</div>
              </div>
            </div>
          </div>

          {/* Stats comparison */}
          <div style={{ background: '#222', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>数据对比</div>
            {[
              { label: '控球率', our: `${match.possession}%`, opp: `${match.opponentPossession}%` },
              { label: '射门', our: matchStats.reduce((a, s) => a + s.shots, 0), opp: match.opponentShots },
              { label: '射正', our: matchStats.reduce((a, s) => a + s.shotsOnTarget, 0), opp: match.opponentShotsOnTarget },
              { label: '角球', our: match.corners, opp: match.opponentCorners },
              { label: '越位', our: match.offsides, opp: '-' },
              { label: '犯规', our: match.fouls, opp: '-' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #2a2a2a' }}>
                <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#F7FF19' }}>{row.our}</span>
                <span style={{ width: 64, textAlign: 'center', fontSize: 10, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{row.opp}</span>
              </div>
            ))}
          </div>

          {/* Scorers */}
          {scorers.length > 0 && (
            <div style={{ background: '#222', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>进球</div>
              {scorers.map(s => {
                const p = players.find(x => x.id === s.playerId)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontSize: 13, color: '#f0f0f0' }}>⚽ {p?.name || '未知'}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F7FF19' }}>{s.goals}球</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Assisters */}
          {assisters.length > 0 && (
            <div style={{ background: '#222', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>助攻</div>
              {assisters.map(s => {
                const p = players.find(x => x.id === s.playerId)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontSize: 13, color: '#f0f0f0' }}>🎯 {p?.name || '未知'}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{s.assists}次</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Player performance table */}
          {matchStats.length > 0 && (
            <div style={{ background: '#222', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontSize: 10, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>球员表现 · 本场评分</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ color: '#555', fontWeight: 600 }}>
                      <th style={{ textAlign: 'left', padding: '4px 6px' }}>球员</th>
                      <th style={{ padding: '4px 4px' }}>分钟</th>
                      <th style={{ padding: '4px 4px' }}>进球</th>
                      <th style={{ padding: '4px 4px' }}>助攻</th>
                      <th style={{ padding: '4px 4px' }}>射门</th>
                      <th style={{ padding: '4px 4px' }}>传球</th>
                      <th style={{ padding: '4px 4px' }}>抢断</th>
                      <th style={{ padding: '4px 4px' }}>评分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchStats
                      .sort((a, b) => {
                        const ra = computeMatchRating(a)
                        const rb = computeMatchRating(b)
                        return rb - ra
                      })
                      .map(s => {
                      const p = players.find(x => x.id === s.playerId)
                      const rating = computeMatchRating(s)
                      const ratingColor =
                        rating >= 80 ? '#F7FF19' :
                        rating >= 70 ? '#22c55e' :
                        rating >= 60 ? '#3b82f6' :
                        rating >= 50 ? '#f59e0b' : '#ef4444'
                      return (
                        <tr key={s.id} style={{ borderTop: '1px solid #2a2a2a' }}>
                          <td style={{ padding: '5px 6px', color: '#f0f0f0', fontWeight: 600 }}>
                            {s.isStarter ? '' : '🔄 '}{p?.name || '-'}
                          </td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', color: '#888' }}>{s.minutesPlayed}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', color: s.goals > 0 ? '#F7FF19' : '#555', fontWeight: s.goals > 0 ? 700 : 400 }}>{s.goals}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', color: s.assists > 0 ? '#3b82f6' : '#555', fontWeight: s.assists > 0 ? 700 : 400 }}>{s.assists}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', color: '#888' }}>{s.shots}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', color: '#888' }}>{s.passes}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', color: '#888' }}>{s.tackles}</td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', color: ratingColor, fontWeight: 800, fontSize: 12 }}>{rating}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Rating legend */}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: '≥80 核心', color: '#F7FF19' },
                  { label: '70-79 主力', color: '#22c55e' },
                  { label: '60-69 稳定', color: '#3b82f6' },
                  { label: '50-59 一般', color: '#f59e0b' },
                  { label: '<50 低迷', color: '#ef4444' },
                ].map(l => (
                  <span key={l.label} style={{ fontSize: 9, color: l.color, fontWeight: 600 }}>■ {l.label}</span>
                ))}
              </div>
            </div>
          )}

          {match.notes && (
            <div style={{ background: '#222', borderRadius: 8, padding: '10px 12px', marginTop: 10, fontSize: 12, color: '#888' }}>
              <span style={{ color: '#555', fontSize: 10, fontWeight: 700 }}>备注：</span>{match.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MatchesPage({ matches, players, stats, onSaveMatch, onDeleteMatch, isAdmin }: MatchesPageProps) {
  const [showForm, setShowForm] = useState(false)
  const [editMatch, setEditMatch] = useState<Match | undefined>()
  const [detailMatch, setDetailMatch] = useState<Match | undefined>()

  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date))

  const handleSave = (m: Match, s: PlayerMatchStats[]) => {
    onSaveMatch(m, s)
    setShowForm(false)
    setEditMatch(undefined)
  }

  const handleDelete = (id: string) => {
    if (confirm('确认删除该比赛记录？')) {
      onDeleteMatch(id)
      setDetailMatch(undefined)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#F7FF19', textTransform: 'uppercase', letterSpacing: '0.05em' }}>比赛记录</h1>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{matches.length} 场比赛</div>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditMatch(undefined); setShowForm(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: '#F7FF19', color: '#000', cursor: 'pointer', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}
          >
            <Plus size={16} /> 录入比赛
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#333' }}>
          <Calendar size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>暂无比赛记录</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>点击「录入比赛」记录你的第一场比赛</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(m => {
            const result = getMatchResult(m.ourScore, m.opponentScore)
            const resColors = {
              WIN:  { border: '#22c55e44', bg: '#22c55e08', strip: '#22c55e' },
              DRAW: { border: '#f59e0b44', bg: '#f59e0b08', strip: '#f59e0b' },
              LOSS: { border: '#ef4444', bg: '#ef4444', strip: '#ef4444' },
            }
            const rc = resColors[result]

            return (
              <div
                key={m.id}
                onClick={() => setDetailMatch(m)}
                className="fade-in-up"
                style={{
                  background: rc.bg, border: `1px solid ${rc.border}`,
                  borderLeft: `4px solid ${rc.strip}`,
                  borderRadius: 10, padding: '14px 16px',
                  cursor: 'pointer', transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{m.date.slice(8, 10)}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{m.date.slice(0, 7)}</div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0' }}>{m.opponent}</div>
                    <span style={{ fontSize: 9, color: '#555', background: '#222', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                      {MATCH_TYPE_LABELS[m.type]}
                    </span>
                    <span style={{ fontSize: 9, color: '#555' }}>{m.venue}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>
                    控球 {m.possession}% · 角球 {m.corners} · 越位 {m.offsides}
                  </div>
                </div>

                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>
                    {m.ourScore} - {m.opponentScore}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <ResultBadge result={result} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && isAdmin && (
        <MatchForm
          match={editMatch}
          existingStats={editMatch ? stats.filter(s => s.matchId === editMatch.id) : []}
          players={players}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditMatch(undefined) }}
        />
      )}

      {detailMatch && (
        <MatchDetail
          match={detailMatch}
          stats={stats}
          players={players}
          isAdmin={isAdmin}
          onClose={() => setDetailMatch(undefined)}
          onEdit={() => {
            setEditMatch(detailMatch)
            setDetailMatch(undefined)
            setShowForm(true)
          }}
          onDelete={() => handleDelete(detailMatch.id)}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import type { Match, Player, PlayerMatchStats, MatchType } from '@/types'
import { generateId, MATCH_TYPE_LABELS, POSITION_LABELS, POSITION_COLORS } from '@/utils'
import { X, ChevronLeft, ChevronRight, Plus, Minus, Check } from 'lucide-react'

interface MatchFormProps {
  match?: Match
  existingStats?: PlayerMatchStats[]
  players: Player[]
  onSave: (match: Match, stats: PlayerMatchStats[]) => void
  onClose: () => void
}

const defaultStats = (matchId: string, playerId: string, isStarter: boolean): PlayerMatchStats => ({
  id: generateId(),
  matchId,
  playerId,
  isStarter,
  minutesPlayed: isStarter ? 90 : 0,
  goals: 0, assists: 0, shots: 0, shotsOnTarget: 0,
  passes: 0, passAccuracy: 75, keyPasses: 0,
  tackles: 0, interceptions: 0, clearances: 0,
  dribbles: 0, foulsWon: 0,
  yellowCards: 0, redCards: 0,
})

export default function MatchForm({ match, existingStats = [], players, onSave, onClose }: MatchFormProps) {
  const matchId = match?.id || generateId()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Basic info
  const [date, setDate] = useState(match?.date || new Date().toISOString().slice(0, 10))
  const [opponent, setOpponent] = useState(match?.opponent || '')
  const [type, setType] = useState<MatchType>(match?.type || 'LEAGUE')
  const [venue, setVenue] = useState(match?.venue || '主场')
  const [ourScore, setOurScore] = useState(match?.ourScore ?? 0)
  const [oppScore, setOppScore] = useState(match?.opponentScore ?? 0)
  const [possession, setPossession] = useState(match?.possession ?? 50)
  const [corners, setCorners] = useState(match?.corners ?? 0)
  const [freekicks, setFreekicks] = useState(match?.freekicks ?? 0)
  const [offsides, setOffsides] = useState(match?.offsides ?? 0)
  const [fouls, setFouls] = useState(match?.fouls ?? 0)
  const [oppPossession, setOppPossession] = useState(match?.opponentPossession ?? 50)
  const [oppShots, setOppShots] = useState(match?.opponentShots ?? 0)
  const [oppShotsOnTarget, setOppShotsOnTarget] = useState(match?.opponentShotsOnTarget ?? 0)
  const [oppCorners, setOppCorners] = useState(match?.opponentCorners ?? 0)
  const [notes, setNotes] = useState(match?.notes || '')

  // Lineup
  const [starters, setStarters] = useState<string[]>(() => existingStats.filter(s => s.isStarter).map(s => s.playerId))
  const [subs, setSubs] = useState<string[]>(() => existingStats.filter(s => !s.isStarter).map(s => s.playerId))

  // Per-player stats
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerMatchStats>>(() => {
    const map: Record<string, PlayerMatchStats> = {}
    existingStats.forEach(s => { map[s.playerId] = s })
    return map
  })

  const allSelected = [...starters, ...subs]

  const togglePlayer = (id: string, role: 'starter' | 'sub') => {
    if (role === 'starter') {
      if (starters.includes(id)) {
        setStarters(p => p.filter(x => x !== id))
        const ps = { ...playerStats }; delete ps[id]; setPlayerStats(ps)
      } else if (starters.length < 11) {
        setStarters(p => [...p, id])
        setPlayerStats(ps => ({ ...ps, [id]: ps[id] || defaultStats(matchId, id, true) }))
      }
    } else {
      if (subs.includes(id)) {
        setSubs(p => p.filter(x => x !== id))
        const ps = { ...playerStats }; delete ps[id]; setPlayerStats(ps)
      } else if (subs.length < 7) {
        setSubs(p => [...p, id])
        setPlayerStats(ps => ({ ...ps, [id]: ps[id] || defaultStats(matchId, id, false) }))
      }
    }
  }

  const updateStat = (playerId: string, key: keyof PlayerMatchStats, val: number) => {
    setPlayerStats(ps => ({
      ...ps,
      [playerId]: { ...ps[playerId], [key]: val },
    }))
  }

  const handleSave = () => {
    if (!opponent.trim()) return alert('请填写对手名称')
    const savedMatch: Match = {
      id: matchId,
      date, opponent: opponent.trim(), type, venue,
      ourScore, opponentScore: oppScore,
      possession, corners, freekicks, offsides, fouls,
      opponentPossession: oppPossession,
      opponentShots: oppShots, opponentShotsOnTarget: oppShotsOnTarget, opponentCorners: oppCorners,
      notes,
      createdAt: match?.createdAt || new Date().toISOString(),
    }
    const statsArr = allSelected.map(pid => ({
      ...playerStats[pid] || defaultStats(matchId, pid, starters.includes(pid)),
      matchId,
      isStarter: starters.includes(pid),
    }))
    onSave(savedMatch, statsArr)
  }

  const inputStyle: React.CSSProperties = {
    background: '#222', border: '1px solid #333', color: '#f0f0f0',
    borderRadius: 6, padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, color: '#666', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
  }
  const numInput = (val: number, set: (v: number) => void, min = 0, max = 999) => (
    <input type="number" min={min} max={max} value={val} onChange={e => set(Number(e.target.value))} style={inputStyle} />
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1a1a1a', borderRadius: 12, width: '100%', maxWidth: 640, border: '1px solid #333', display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#F7FF19', textTransform: 'uppercase' }}>
            {match ? '编辑比赛' : '录入比赛'} · 步骤 {step}/3
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={18} /></button>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #222', flexShrink: 0 }}>
          {[{ id: 1, label: '比赛信息' }, { id: 2, label: '出场阵容' }, { id: 3, label: '球员数据' }].map(t => (
            <button key={t.id} onClick={() => setStep(t.id as any)} style={{
              flex: 1, padding: '9px 0', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: step === t.id ? '#F7FF19' : '#444',
              borderBottom: step === t.id ? '2px solid #F7FF19' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          {/* ─ Step 1: Match Info ─ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Score display */}
              <div style={{ background: '#222', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>比分</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#F7FF19', fontWeight: 700, marginBottom: 4 }}>我方</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setOurScore(Math.max(0, ourScore - 1))} style={{ width: 28, height: 28, background: '#333', border: 'none', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 16 }}>-</button>
                      <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', minWidth: 44, textAlign: 'center' }}>{ourScore}</div>
                      <button onClick={() => setOurScore(ourScore + 1)} style={{ width: 28, height: 28, background: '#333', border: 'none', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 16 }}>+</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 28, color: '#333', fontWeight: 900 }}>:</div>
                  <div>
                    <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>对方</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setOppScore(Math.max(0, oppScore - 1))} style={{ width: 28, height: 28, background: '#333', border: 'none', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 16 }}>-</button>
                      <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', minWidth: 44, textAlign: 'center' }}>{oppScore}</div>
                      <button onClick={() => setOppScore(oppScore + 1)} style={{ width: 28, height: 28, background: '#333', border: 'none', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 16 }}>+</button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>比赛日期</label>
                  <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>对手名称</label>
                  <input style={inputStyle} value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="对手队名" />
                </div>
                <div>
                  <label style={labelStyle}>比赛类型</label>
                  <select style={inputStyle} value={type} onChange={e => setType(e.target.value as MatchType)}>
                    {Object.entries(MATCH_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>场地</label>
                  <select style={inputStyle} value={venue} onChange={e => setVenue(e.target.value)}>
                    <option value="主场">主场</option>
                    <option value="客场">客场</option>
                    <option value="中立场地">中立场地</option>
                  </select>
                </div>
              </div>

              <div style={{ fontSize: 10, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>我方数据</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div><label style={labelStyle}>控球率%</label>{numInput(possession, setPossession, 0, 100)}</div>
                <div><label style={labelStyle}>角球</label>{numInput(corners, setCorners)}</div>
                <div><label style={labelStyle}>任意球</label>{numInput(freekicks, setFreekicks)}</div>
                <div><label style={labelStyle}>越位</label>{numInput(offsides, setOffsides)}</div>
                <div><label style={labelStyle}>犯规</label>{numInput(fouls, setFouls)}</div>
              </div>

              <div style={{ fontSize: 10, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>对方数据（简化）</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div><label style={labelStyle}>控球率%</label>{numInput(oppPossession, setOppPossession, 0, 100)}</div>
                <div><label style={labelStyle}>射门</label>{numInput(oppShots, setOppShots)}</div>
                <div><label style={labelStyle}>射正</label>{numInput(oppShotsOnTarget, setOppShotsOnTarget)}</div>
                <div><label style={labelStyle}>角球</label>{numInput(oppCorners, setOppCorners)}</div>
              </div>

              <div>
                <label style={labelStyle}>比赛备注</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="可选备注..." />
              </div>
            </div>
          )}

          {/* ─ Step 2: Lineup ─ */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#888' }}>
                  首发 <span style={{ color: '#F7FF19', fontWeight: 700 }}>{starters.length}</span>/11 ·
                  替补 <span style={{ color: '#3b82f6', fontWeight: 700 }}>{subs.length}</span>/7
                </div>
              </div>

              {players.map(p => {
                const isStarter = starters.includes(p.id)
                const isSub = subs.includes(p.id)
                const posColor = POSITION_COLORS[p.positions[0]] || '#888'
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: '1px solid #222',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: p.avatar ? 'transparent' : `${posColor}22`,
                      border: `1px solid ${posColor}44`, overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⚽'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>#{p.number} · {p.positions.join('/')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => togglePlayer(p.id, 'starter')}
                        style={{
                          padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          border: `1px solid ${isStarter ? '#F7FF19' : '#333'}`,
                          background: isStarter ? '#F7FF1922' : 'transparent',
                          color: isStarter ? '#F7FF19' : '#555',
                        }}
                      >首发</button>
                      <button
                        onClick={() => togglePlayer(p.id, 'sub')}
                        style={{
                          padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          border: `1px solid ${isSub ? '#3b82f6' : '#333'}`,
                          background: isSub ? '#3b82f622' : 'transparent',
                          color: isSub ? '#3b82f6' : '#555',
                        }}
                      >替补</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ─ Step 3: Player Stats ─ */}
          {step === 3 && (
            <div>
              {allSelected.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#444', fontSize: 13 }}>请先在上一步选择出场球员</div>
              ) : (
                allSelected.map(pid => {
                  const p = players.find(x => x.id === pid)
                  if (!p) return null
                  const s = playerStats[pid] || defaultStats(matchId, pid, starters.includes(pid))
                  const role = starters.includes(pid) ? '首发' : '替补'
                  const posColor = POSITION_COLORS[p.positions[0]] || '#888'

                  return (
                    <div key={pid} style={{ marginBottom: 16, background: '#222', borderRadius: 8, padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: `${posColor}22`,
                          border: `1px solid ${posColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', flexShrink: 0,
                        }}>
                          {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⚽'}
                        </div>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.name}</span>
                          <span style={{ fontSize: 10, color: '#555', marginLeft: 6 }}>#{p.number}</span>
                        </div>
                        <span style={{
                          marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                          background: role === '首发' ? '#F7FF1922' : '#3b82f622',
                          color: role === '首发' ? '#F7FF19' : '#3b82f6',
                        }}>{role}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {[
                          { label: '上场(分)', key: 'minutesPlayed', max: 90 },
                          { label: '进球', key: 'goals', max: 20 },
                          { label: '助攻', key: 'assists', max: 20 },
                          { label: '射门', key: 'shots', max: 30 },
                          { label: '射正', key: 'shotsOnTarget', max: 30 },
                          { label: '传球', key: 'passes', max: 200 },
                          { label: '传球率%', key: 'passAccuracy', max: 100 },
                          { label: '关键传球', key: 'keyPasses', max: 20 },
                          { label: '抢断', key: 'tackles', max: 20 },
                          { label: '拦截', key: 'interceptions', max: 20 },
                          { label: '解围', key: 'clearances', max: 20 },
                          { label: '过人', key: 'dribbles', max: 20 },
                          { label: '被犯规', key: 'foulsWon', max: 20 },
                          { label: '黄牌', key: 'yellowCards', max: 2 },
                          { label: '红牌', key: 'redCards', max: 1 },
                        ].map(({ label, key, max }) => (
                          <div key={key}>
                            <div style={{ fontSize: 9, color: '#555', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                            <input
                              type="number" min={0} max={max}
                              value={(s as any)[key]}
                              onChange={e => updateStat(pid, key as any, Number(e.target.value))}
                              style={{ background: '#1a1a1a', border: '1px solid #333', color: '#f0f0f0', borderRadius: 5, padding: '5px 7px', fontSize: 12, width: '100%', outline: 'none' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #222', display: 'flex', gap: 8, justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={() => step > 1 && setStep((step - 1) as any)} style={{
            padding: '8px 18px', borderRadius: 6, border: '1px solid #333', background: 'transparent',
            color: step > 1 ? '#888' : '#333', cursor: step > 1 ? 'pointer' : 'default', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <ChevronLeft size={14} /> 上一步
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>取消</button>
            {step < 3 ? (
              <button onClick={() => setStep((step + 1) as any)} style={{
                padding: '8px 22px', borderRadius: 6, border: 'none', background: '#F7FF19',
                color: '#000', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                下一步 <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSave} style={{
                padding: '8px 22px', borderRadius: 6, border: 'none', background: '#F7FF19',
                color: '#000', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Check size={14} /> 保存比赛
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

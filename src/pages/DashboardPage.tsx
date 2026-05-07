import type { Player, Match, PlayerMatchStats } from '@/types'
import { computePlayerRating, getOverallRating, getMatchResult, formatDate, POSITION_LABELS, POSITION_COLORS, STATUS_COLORS, STATUS_LABELS } from '@/utils'
import RadarChart from '@/components/RadarChart'

interface DashboardProps {
  players: Player[]
  matches: Match[]
  stats: PlayerMatchStats[]
}

function StatCard({ label, value, sub, color = '#F7FF19' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 10, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage({ players, matches, stats }: DashboardProps) {
  const totalMatches = matches.length
  const wins = matches.filter(m => getMatchResult(m.ourScore, m.opponentScore) === 'WIN').length
  const draws = matches.filter(m => getMatchResult(m.ourScore, m.opponentScore) === 'DRAW').length
  const losses = matches.filter(m => getMatchResult(m.ourScore, m.opponentScore) === 'LOSS').length
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(0) : '0'
  const totalGoals = matches.reduce((a, m) => a + m.ourScore, 0)
  const totalConceded = matches.reduce((a, m) => a + m.opponentScore, 0)
  const avgGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0.0'
  const avgConceded = totalMatches > 0 ? (totalConceded / totalMatches).toFixed(1) : '0.0'

  // Top scorers
  const scorerMap: Record<string, number> = {}
  const assistMap: Record<string, number> = {}
  stats.forEach(s => {
    scorerMap[s.playerId] = (scorerMap[s.playerId] || 0) + s.goals
    assistMap[s.playerId] = (assistMap[s.playerId] || 0) + s.assists
  })
  const topScorers = Object.entries(scorerMap)
    .map(([id, goals]) => ({ player: players.find(p => p.id === id), goals }))
    .filter(x => x.player && x.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5)
  const topAssisters = Object.entries(assistMap)
    .map(([id, assists]) => ({ player: players.find(p => p.id === id), assists }))
    .filter(x => x.player && x.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 5)

  // Player ratings
  const playerRatings = players
    .map(p => ({
      player: p,
      attrs: computePlayerRating(p, stats),
    }))
    .map(x => ({ ...x, overall: getOverallRating(x.attrs) }))
    .sort((a, b) => b.overall - a.overall)

  // Recent matches
  const recentMatches = [...matches].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  // Best player radar
  const bestPlayer = playerRatings[0]

  return (
    <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#F7FF19', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ⚽ GOAT FC · 数据中心
        </h1>
        <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>赛季总览 · 实时数据</div>
      </div>

      {/* Team overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="总场次" value={totalMatches} sub={`胜${wins} 平${draws} 负${losses}`} />
        <StatCard label="胜率" value={`${winRate}%`} sub="本赛季" color={Number(winRate) >= 60 ? '#22c55e' : Number(winRate) >= 40 ? '#f59e0b' : '#ef4444'} />
        <StatCard label="进球" value={totalGoals} sub={`场均 ${avgGoals}`} color="#22c55e" />
        <StatCard label="失球" value={totalConceded} sub={`场均 ${avgConceded}`} color="#ef4444" />
        <StatCard label="球员数" value={players.length} sub={`可出战 ${players.filter(p => p.status === 'MATCH_FIT').length}`} color="#3b82f6" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Player Leaderboard */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>🏆 球员总评榜</div>
          {playerRatings.slice(0, 8).map((item, i) => {
            const posColor = POSITION_COLORS[item.player.positions[0]] || '#888'
            const overallColor = item.overall >= 80 ? '#F7FF19' : item.overall >= 65 ? '#22c55e' : '#f59e0b'
            return (
              <div key={item.player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #222' }}>
                <div style={{ width: 20, textAlign: 'center', fontSize: 11, fontWeight: 700, color: i < 3 ? '#F7FF19' : '#444' }}>
                  {i + 1}
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: item.player.avatar ? 'transparent' : `${posColor}22`,
                  border: `1px solid ${posColor}44`, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>
                  {item.player.avatar ? <img src={item.player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⚽'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>{item.player.name}</div>
                  <div style={{ fontSize: 10, color: '#555' }}>#{item.player.number} · {item.player.positions.join('/')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: overallColor }}>{item.overall}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 8, color: '#ef4444' }}>{scorerMap[item.player.id] || 0}⚽</span>
                    <span style={{ fontSize: 8, color: '#3b82f6' }}>{assistMap[item.player.id] || 0}🎯</span>
                  </div>
                </div>
              </div>
            )
          })}
          {players.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: '#333', fontSize: 12 }}>暂无球员数据</div>}
        </div>

        {/* Best player radar */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 11, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>⭐ 球队之星</div>
          {bestPlayer ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: POSITION_COLORS[bestPlayer.player.positions[0]] + '22',
                  border: `2px solid ${POSITION_COLORS[bestPlayer.player.positions[0]]}55`,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {bestPlayer.player.avatar ? <img src={bestPlayer.player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>⚽</span>}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{bestPlayer.player.name}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>#{bestPlayer.player.number} · 总评 <span style={{ color: '#F7FF19', fontWeight: 700 }}>{bestPlayer.overall}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RadarChart
                  data={[
                    { label: '射门', value: bestPlayer.attrs.shooting },
                    { label: '传球', value: bestPlayer.attrs.passing },
                    { label: '盘带', value: bestPlayer.attrs.dribbling },
                    { label: '速度', value: bestPlayer.attrs.pace },
                    { label: '体能', value: bestPlayer.attrs.stamina },
                    { label: '意识', value: Math.round((bestPlayer.attrs.positioning + bestPlayer.attrs.decisions + bestPlayer.attrs.vision + bestPlayer.attrs.anticipation) / 4) },
                  ]}
                  size={180}
                  color="#F7FF19"
                />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#333', fontSize: 13 }}>暂无球员数据</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Top scorers */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 11, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>⚽ 射手榜</div>
          {topScorers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#333', fontSize: 11 }}>暂无进球数据</div>
          ) : topScorers.map((item, i) => (
            <div key={item.player!.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ width: 16, fontSize: 10, fontWeight: 700, color: i === 0 ? '#F7FF19' : '#444' }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>{item.player!.name}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#F7FF19' }}>{item.goals}</div>
            </div>
          ))}
        </div>

        {/* Top assisters */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>🎯 助攻榜</div>
          {topAssisters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#333', fontSize: 11 }}>暂无助攻数据</div>
          ) : topAssisters.map((item, i) => (
            <div key={item.player!.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ width: 16, fontSize: 10, fontWeight: 700, color: i === 0 ? '#3b82f6' : '#444' }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>{item.player!.name}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#3b82f6' }}>{item.assists}</div>
            </div>
          ))}
        </div>

        {/* Recent matches */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>📅 近期战绩</div>
          {recentMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#333', fontSize: 11 }}>暂无比赛记录</div>
          ) : recentMatches.map(m => {
            const result = getMatchResult(m.ourScore, m.opponentScore)
            const resColor = { WIN: '#22c55e', DRAW: '#f59e0b', LOSS: '#ef4444' }[result]
            const resLabel = { WIN: 'W', DRAW: 'D', LOSS: 'L' }[result]
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1e1e1e' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, background: `${resColor}22`,
                  border: `1px solid ${resColor}44`, color: resColor,
                  fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{resLabel}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#e0e0e0' }}>{m.opponent}</div>
                  <div style={{ fontSize: 9, color: '#555' }}>{formatDate(m.date)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{m.ourScore}-{m.opponentScore}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Formation / position distribution */}
      <div style={{ marginTop: 16, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontSize: 11, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>🔢 阵容分布</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
            const count = players.filter(p => p.positions.includes(pos)).length
            const color = POSITION_COLORS[pos]
            return (
              <div key={pos} style={{ background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 8, padding: '12px 20px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color }}>{count}</div>
                <div style={{ fontSize: 10, color: '#555', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 3 }}>{POSITION_LABELS[pos]}</div>
              </div>
            )
          })}
          <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => {
              const count = players.filter(p => p.status === k).length
              if (count === 0) return null
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[k] }} />
                  <span style={{ fontSize: 11, color: '#888' }}>{v} {count}人</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

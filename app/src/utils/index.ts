import type { Player, Match, PlayerMatchStats, AppState, PlayerAttributes } from '@/types'

const KEYS = {
  players: 'goat-players',
  matches: 'goat-matches',
  stats: 'goat-player-match-stats',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const storage = {
  getState(): AppState {
    return {
      players: load<Player[]>(KEYS.players, []),
      matches: load<Match[]>(KEYS.matches, []),
      playerMatchStats: load<PlayerMatchStats[]>(KEYS.stats, []),
    }
  },
  savePlayers(players: Player[]) { save(KEYS.players, players) },
  saveMatches(matches: Match[]) { save(KEYS.matches, matches) },
  saveStats(stats: PlayerMatchStats[]) { save(KEYS.stats, stats) },
}

// ─── Rating Engine ─────────────────────────────────────────────────────────────

/**
 * 单场评分（0-100），权重：进球 > 助攻 > 其他数据
 * 评分逻辑透明，便于理解：
 *   - 进球 +15/球，助攻 +10/球
 *   - 射正 +3，关键传球 +3，抢断/拦截/解围 +2
 *   - 过人成功 +2，被犯规 +1
 *   - 黄牌 -5，红牌 -15
 *   - 上场时间加成（最长90分钟封顶）
 */
export function computeMatchRating(stats: PlayerMatchStats): number {
  const {
    goals, assists, shotsOnTarget, keyPasses,
    tackles, interceptions, clearances,
    dribbles, foulsWon,
    yellowCards, redCards, minutesPlayed,
  } = stats

  let score = 50 // 基础分

  // 核心数据（高权重）
  score += goals * 15
  score += assists * 10

  // 进攻贡献
  score += shotsOnTarget * 3
  score += keyPasses * 3
  score += dribbles * 2
  score += foulsWon * 1

  // 防守贡献
  score += tackles * 2
  score += interceptions * 2
  score += clearances * 2

  // 纪律扣分
  score -= yellowCards * 5
  score -= redCards * 15

  // 上场时间加成（最多+10分）
  score += Math.round(Math.min(minutesPlayed, 90) / 90 * 10)

  return Math.max(1, Math.min(100, Math.round(score)))
}

/**
 * 根据所有历史比赛数据，计算球员的最新属性（移动平均）
 * 新评分 = 历史 × 0.7 + 本赛季综合 × 0.3
 */
export function computePlayerRating(
  player: Player,
  allStats: PlayerMatchStats[]
): PlayerAttributes {
  const playerStats = allStats.filter(s => s.playerId === player.id)

  if (playerStats.length === 0) return { ...player.attributes }

  const n = playerStats.length
  const sum = <K extends keyof PlayerMatchStats>(key: K): number =>
    playerStats.reduce((acc, s) => acc + (s[key] as number), 0)

  const totalGoals = sum('goals')
  const totalAssists = sum('assists')
  const totalShots = sum('shots')
  const totalShotsOnTarget = sum('shotsOnTarget')
  const totalPasses = sum('passes')
  const totalKeyPasses = sum('keyPasses')
  const totalTackles = sum('tackles')
  const totalInterceptions = sum('interceptions')
  const totalClearances = sum('clearances')
  const totalDribbles = sum('dribbles')
  const totalFoulsWon = sum('foulsWon')
  const totalYellow = sum('yellowCards')
  const totalRed = sum('redCards')
  const totalMinutes = sum('minutesPlayed')
  const avgPassAcc = sum('passAccuracy') / n

  // 各项原始评分（基于历史数据均值）
  const shootingRaw = Math.min(100, (totalGoals * 15 + (totalShotsOnTarget) * 3 + totalShots * 1) / Math.max(1, n))
  const passingRaw  = Math.min(100, avgPassAcc * 0.35 + (totalKeyPasses / n) * 25 + (totalAssists / n) * 20)
  const dribblingRaw = Math.min(100, (totalDribbles / n) * 12 + (totalFoulsWon / n) * 8)
  const strengthRaw  = Math.min(100, ((totalTackles + totalClearances + totalInterceptions) / n) * 7)
  const disciplineRaw = Math.max(1, Math.min(100, player.attributes.discipline - totalYellow * 2 - totalRed * 10))
  const teamworkRaw  = Math.min(100, avgPassAcc * 0.25 + (totalAssists / n) * 18 + 40)
  const aggression    = Math.min(100, ((totalTackles + totalInterceptions) / n) * 7 + 20)
  const visionRaw     = totalPasses > 0 ? Math.min(100, (totalKeyPasses / totalPasses) * 700 + 30) : player.attributes.vision
  const anticipationRaw = Math.min(100, (totalInterceptions / n) * 9 + 20)
  const positioningRaw = Math.min(100, ((totalInterceptions + totalClearances) / n) * 5 + 25)
  const staminaRaw    = Math.min(100, (totalMinutes / Math.max(1, n * 90)) * 75 + 20)

  const blend = (base: number, computed: number) =>
    Math.round(Math.max(1, Math.min(100, base * 0.7 + computed * 0.3)))

  return {
    shooting:     blend(player.attributes.shooting, shootingRaw),
    passing:      blend(player.attributes.passing, passingRaw),
    dribbling:    blend(player.attributes.dribbling, dribblingRaw),
    firstTouch:    player.attributes.firstTouch,
    pace:         player.attributes.pace,
    stamina:      blend(player.attributes.stamina, staminaRaw),
    strength:     blend(player.attributes.strength, strengthRaw),
    agility:      player.attributes.agility,
    aggression:   blend(player.attributes.aggression, aggression),
    teamwork:     blend(player.attributes.teamwork, teamworkRaw),
    discipline:   Math.round(disciplineRaw),
    leadership:   player.attributes.leadership,
    positioning:  blend(player.attributes.positioning, positioningRaw),
    decisions:    blend(player.attributes.decisions, passingRaw * 0.6),
    vision:       blend(player.attributes.vision, visionRaw),
    anticipation: blend(player.attributes.anticipation, anticipationRaw),
  }
}

export function getOverallRating(attrs: PlayerAttributes): number {
  const tech = (attrs.shooting + attrs.passing + attrs.dribbling + attrs.firstTouch) / 4
  const phys = (attrs.pace + attrs.stamina + attrs.strength + attrs.agility) / 4
  const ment = (attrs.aggression + attrs.teamwork + attrs.discipline + attrs.leadership) / 4
  const awar = (attrs.positioning + attrs.decisions + attrs.vision + attrs.anticipation) / 4
  return Math.round((tech + phys + ment + awar) / 4)
}

export function getDimensionRatings(attrs: PlayerAttributes) {
  return {
    technical: Math.round((attrs.shooting + attrs.passing + attrs.dribbling + attrs.firstTouch) / 4),
    physical: Math.round((attrs.pace + attrs.stamina + attrs.strength + attrs.agility) / 4),
    mental: Math.round((attrs.aggression + attrs.teamwork + attrs.discipline + attrs.leadership) / 4),
    awareness: Math.round((attrs.positioning + attrs.decisions + attrs.vision + attrs.anticipation) / 4),
  }
}

export function getMatchResult(ourScore: number, opponentScore: number): 'WIN' | 'DRAW' | 'LOSS' {
  if (ourScore > opponentScore) return 'WIN'
  if (ourScore < opponentScore) return 'LOSS'
  return 'DRAW'
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export const POSITION_COLORS: Record<string, string> = {
  GK: '#f59e0b',
  DEF: '#3b82f6',
  MID: '#22c55e',
  FWD: '#ef4444',
}

export const STATUS_COLORS: Record<string, string> = {
  MATCH_FIT: '#22c55e',
  INJURED: '#ef4444',
  RECOVERING: '#f59e0b',
  SUSPENDED: '#a855f7',
}

export const STATUS_LABELS: Record<string, string> = {
  MATCH_FIT: '可出战',
  INJURED: '受伤',
  RECOVERING: '恢复中',
  SUSPENDED: '停赛',
}

export const MATCH_TYPE_LABELS: Record<string, string> = {
  LEAGUE: '联赛',
  CUP: '杯赛',
  FRIENDLY: '友谊赛',
}

export const POSITION_LABELS: Record<string, string> = {
  GK: '门将',
  DEF: '后卫',
  MID: '中场',
  FWD: '前锋',
}

// Demo seed data
export function seedDemoData(): AppState {
  const players: Player[] = [
    {
      id: 'p1', name: '张伟', number: 10, age: 24, height: 178, weight: 72,
      positions: ['MID'], preferredFoot: 'RIGHT', avatar: null,
      attributes: { shooting: 78, passing: 82, dribbling: 80, firstTouch: 79, pace: 75, stamina: 80, strength: 68, agility: 77, aggression: 72, teamwork: 85, discipline: 88, leadership: 82, positioning: 78, decisions: 81, vision: 83, anticipation: 76 },
      status: 'MATCH_FIT', joinedAt: '2023-01-15', notes: '队长', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'p2', name: '李明', number: 9, age: 22, height: 182, weight: 78,
      positions: ['FWD'], preferredFoot: 'LEFT', avatar: null,
      attributes: { shooting: 88, passing: 72, dribbling: 84, firstTouch: 80, pace: 90, stamina: 78, strength: 74, agility: 86, aggression: 76, teamwork: 74, discipline: 78, leadership: 65, positioning: 82, decisions: 79, vision: 72, anticipation: 80 },
      status: 'MATCH_FIT', joinedAt: '2023-03-01', notes: '主力前锋', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'p3', name: '王强', number: 1, age: 26, height: 185, weight: 82,
      positions: ['GK'], preferredFoot: 'RIGHT', avatar: null,
      attributes: { shooting: 45, passing: 65, dribbling: 42, firstTouch: 60, pace: 55, stamina: 76, strength: 80, agility: 72, aggression: 70, teamwork: 80, discipline: 90, leadership: 75, positioning: 88, decisions: 85, vision: 70, anticipation: 86 },
      status: 'MATCH_FIT', joinedAt: '2022-08-10', notes: '首发门将', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'p4', name: '陈杰', number: 4, age: 25, height: 180, weight: 76,
      positions: ['DEF'], preferredFoot: 'RIGHT', avatar: null,
      attributes: { shooting: 55, passing: 70, dribbling: 62, firstTouch: 68, pace: 72, stamina: 82, strength: 84, agility: 68, aggression: 82, teamwork: 78, discipline: 84, leadership: 70, positioning: 82, decisions: 76, vision: 68, anticipation: 78 },
      status: 'INJURED', joinedAt: '2023-06-01', notes: '右后卫', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'p5', name: '刘洋', number: 7, age: 23, height: 175, weight: 70,
      positions: ['MID', 'FWD'], preferredFoot: 'BOTH', avatar: null,
      attributes: { shooting: 75, passing: 78, dribbling: 82, firstTouch: 76, pace: 84, stamina: 85, strength: 66, agility: 88, aggression: 70, teamwork: 80, discipline: 82, leadership: 68, positioning: 78, decisions: 76, vision: 80, anticipation: 74 },
      status: 'MATCH_FIT', joinedAt: '2023-09-15', notes: '边路球员', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ]

  const matches: Match[] = [
    {
      id: 'm1', date: '2026-04-20', opponent: '城北联队', type: 'LEAGUE', venue: '主场',
      ourScore: 3, opponentScore: 1, possession: 58, corners: 6, freekicks: 8, offsides: 2, fouls: 10,
      opponentPossession: 42, opponentShots: 8, opponentShotsOnTarget: 3, opponentCorners: 3,
      notes: '压制性胜利', createdAt: new Date().toISOString(),
    },
    {
      id: 'm2', date: '2026-04-27', opponent: '东区猛虎', type: 'LEAGUE', venue: '客场',
      ourScore: 1, opponentScore: 1, possession: 45, corners: 4, freekicks: 12, offsides: 3, fouls: 14,
      opponentPossession: 55, opponentShots: 14, opponentShotsOnTarget: 6, opponentCorners: 7,
      notes: '客场艰难1-1', createdAt: new Date().toISOString(),
    },
    {
      id: 'm3', date: '2026-05-04', opponent: '南城雄鹰', type: 'CUP', venue: '主场',
      ourScore: 2, opponentScore: 0, possession: 62, corners: 8, freekicks: 6, offsides: 1, fouls: 8,
      opponentPossession: 38, opponentShots: 5, opponentShotsOnTarget: 2, opponentCorners: 4,
      notes: '杯赛晋级', createdAt: new Date().toISOString(),
    },
  ]

  const stats: PlayerMatchStats[] = [
    { id: 's1', matchId: 'm1', playerId: 'p2', isStarter: true, minutesPlayed: 90, goals: 2, assists: 0, shots: 5, shotsOnTarget: 3, passes: 28, passAccuracy: 75, keyPasses: 2, tackles: 1, interceptions: 0, clearances: 0, dribbles: 5, foulsWon: 3, yellowCards: 0, redCards: 0 },
    { id: 's2', matchId: 'm1', playerId: 'p1', isStarter: true, minutesPlayed: 90, goals: 1, assists: 2, shots: 2, shotsOnTarget: 1, passes: 52, passAccuracy: 88, keyPasses: 5, tackles: 4, interceptions: 2, clearances: 0, dribbles: 3, foulsWon: 2, yellowCards: 0, redCards: 0 },
    { id: 's3', matchId: 'm2', playerId: 'p2', isStarter: true, minutesPlayed: 90, goals: 1, assists: 0, shots: 4, shotsOnTarget: 2, passes: 22, passAccuracy: 72, keyPasses: 1, tackles: 0, interceptions: 0, clearances: 0, dribbles: 4, foulsWon: 4, yellowCards: 1, redCards: 0 },
    { id: 's4', matchId: 'm3', playerId: 'p5', isStarter: true, minutesPlayed: 90, goals: 1, assists: 1, shots: 3, shotsOnTarget: 2, passes: 40, passAccuracy: 82, keyPasses: 3, tackles: 3, interceptions: 1, clearances: 0, dribbles: 6, foulsWon: 2, yellowCards: 0, redCards: 0 },
  ]

  return { players, matches, playerMatchStats: stats }
}

// ─── Player Types ──────────────────────────────────────────────────────────────

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'
export type FootPreference = 'LEFT' | 'RIGHT' | 'BOTH'
export type PlayerStatus = 'MATCH_FIT' | 'INJURED' | 'RECOVERING' | 'SUSPENDED'

export interface PlayerAttributes {
  // Technical
  shooting: number
  passing: number
  dribbling: number
  firstTouch: number
  // Physical
  pace: number
  stamina: number
  strength: number
  agility: number
  // Mental
  aggression: number
  teamwork: number
  discipline: number
  leadership: number
  // Awareness
  positioning: number
  decisions: number
  vision: number
  anticipation: number
}

export interface Player {
  id: string
  name: string
  number: number
  age: number
  height: number
  weight: number
  positions: Position[]
  preferredFoot: FootPreference
  avatar: string | null // base64
  attributes: PlayerAttributes
  status: PlayerStatus
  joinedAt: string // ISO date
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Match Types ───────────────────────────────────────────────────────────────

export type MatchType = 'LEAGUE' | 'CUP' | 'FRIENDLY'
export type MatchResult = 'WIN' | 'DRAW' | 'LOSS'

export interface PlayerMatchStats {
  id: string
  matchId: string
  playerId: string
  isStarter: boolean
  minutesPlayed: number
  goals: number
  assists: number
  shots: number
  shotsOnTarget: number
  passes: number
  passAccuracy: number // 0-100
  keyPasses: number
  tackles: number
  interceptions: number
  clearances: number
  dribbles: number
  foulsWon: number
  yellowCards: number
  redCards: number
}

export interface Match {
  id: string
  date: string // ISO date
  opponent: string
  type: MatchType
  venue: string
  ourScore: number
  opponentScore: number
  // Our team stats
  possession: number // 0-100
  corners: number
  freekicks: number
  offsides: number
  fouls: number
  // Opponent stats (simplified)
  opponentPossession: number
  opponentShots: number
  opponentShotsOnTarget: number
  opponentCorners: number
  notes: string
  createdAt: string
}

// ─── Computed / Rating Types ───────────────────────────────────────────────────

export interface PlayerRating {
  playerId: string
  overall: number
  technical: number
  physical: number
  mental: number
  awareness: number
  lastUpdated: string
}

// ─── Store Types ───────────────────────────────────────────────────────────────

export interface AppState {
  players: Player[]
  matches: Match[]
  playerMatchStats: PlayerMatchStats[]
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export type NavTab = 'dashboard' | 'players' | 'matches'

export interface RadarDataPoint {
  label: string
  value: number
}

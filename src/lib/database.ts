import { supabase } from './supabase'
import type { Player, Match, PlayerMatchStats } from '@/types'

// ─── Players ─────────────────────────────────────────────────────────────────

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('*')
  if (error) throw error
  return data || []
}

export async function createPlayer(player: Player): Promise<Player> {
  const { data, error } = await supabase.from('players').insert(player).select().single()
  if (error) throw error
  return data
}

export async function updatePlayer(player: Player): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(player)
    .eq('id', player.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase.from('matches').select('*')
  if (error) throw error
  return data || []
}

export async function createMatch(match: Match): Promise<Match> {
  const { data, error } = await supabase.from('matches').insert(match).select().single()
  if (error) throw error
  return data
}

export async function updateMatch(match: Match): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .update(match)
    .eq('id', match.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMatch(id: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) throw error
}

// ─── Player Match Stats ────────────────────────────────────────────────────────

export async function fetchPlayerMatchStats(): Promise<PlayerMatchStats[]> {
  const { data, error } = await supabase.from('player_match_stats').select('*')
  if (error) throw error
  return data || []
}

export async function createPlayerMatchStats(stats: PlayerMatchStats): Promise<PlayerMatchStats> {
  const { data, error } = await supabase.from('player_match_stats').insert(stats).select().single()
  if (error) throw error
  return data
}

export async function updatePlayerMatchStats(stats: PlayerMatchStats): Promise<PlayerMatchStats> {
  const { data, error } = await supabase
    .from('player_match_stats')
    .update(stats)
    .eq('id', stats.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePlayerMatchStats(id: string): Promise<void> {
  const { error } = await supabase.from('player_match_stats').delete().eq('id', id)
  if (error) throw error
}

// ─── Sync from localStorage to cloud ─────────────────────────────────────────

export async function syncLocalToCloud(
  players: Player[],
  matches: Match[],
  stats: PlayerMatchStats[]
): Promise<void> {
  // Clear existing data and insert fresh
  await Promise.all([
    supabase.from('players').delete().neq('id', ''),
    supabase.from('matches').delete().neq('id', ''),
    supabase.from('player_match_stats').delete().neq('id', ''),
  ])

  // Insert all data
  await Promise.all([
    players.length > 0 && supabase.from('players').insert(players),
    matches.length > 0 && supabase.from('matches').insert(matches),
    stats.length > 0 && supabase.from('player_match_stats').insert(stats),
  ])
}

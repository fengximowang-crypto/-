-- GOAT FC Manager - Supabase Database Setup
-- Run this SQL in Supabase Dashboard -> SQL Editor

-- ─── Players Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  number INTEGER,
  age INTEGER,
  height INTEGER,
  weight INTEGER,
  positions TEXT[], -- array of positions
  preferred_foot TEXT,
  avatar TEXT, -- base64
  attributes JSONB, -- player attributes object
  status TEXT DEFAULT 'MATCH_FIT',
  joined_at TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- ─── Matches Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  date TEXT,
  opponent TEXT,
  type TEXT DEFAULT 'LEAGUE',
  venue TEXT,
  our_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  possession INTEGER DEFAULT 0,
  corners INTEGER DEFAULT 0,
  freekicks INTEGER DEFAULT 0,
  offsides INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  opponent_possession INTEGER DEFAULT 0,
  opponent_shots INTEGER DEFAULT 0,
  opponent_shots_on_target INTEGER DEFAULT 0,
  opponent_corners INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT
);

-- ─── Player Match Stats Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_match_stats (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  is_starter BOOLEAN DEFAULT true,
  minutes_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  passes INTEGER DEFAULT 0,
  pass_accuracy INTEGER DEFAULT 0,
  key_passes INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  interceptions INTEGER DEFAULT 0,
  clearances INTEGER DEFAULT 0,
  dribbles INTEGER DEFAULT 0,
  fouls_won INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0
);

-- ─── Enable Row Level Security ────────────────────────────────────────────────
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;

-- ─── Public Access Policies (for now, allow all operations) ─────────────────
CREATE POLICY "Allow all for players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for player_match_stats" ON player_match_stats FOR ALL USING (true) WITH CHECK (true);

-- Migration: Create games table for event-based game instances
-- Purpose: Support multi-user trivia games with scheduling and configuration

-- Create enum for game status
CREATE TYPE game_status AS ENUM ('setup', 'in_progress', 'completed', 'cancelled');

-- Create games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  scheduled_date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  max_teams INTEGER DEFAULT 20 NOT NULL,
  max_players_per_team INTEGER DEFAULT 4 NOT NULL,
  status game_status DEFAULT 'setup' NOT NULL,
  total_rounds INTEGER NOT NULL,
  questions_per_round INTEGER NOT NULL,
  selected_categories TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT positive_values CHECK (
    max_teams BETWEEN 1 AND 20 AND
    max_players_per_team BETWEEN 1 AND 4 AND
    total_rounds > 0 AND
    questions_per_round > 0
  ),
  CONSTRAINT valid_end_time CHECK (
    (end_time IS NULL) OR (start_time IS NULL) OR (end_time > start_time)
  ),
  CONSTRAINT non_empty_categories CHECK (array_length(selected_categories, 1) > 0),
  CONSTRAINT title_length CHECK (LENGTH(TRIM(title)) BETWEEN 1 AND 100),
  CONSTRAINT location_length CHECK (
    location IS NULL OR LENGTH(TRIM(location)) BETWEEN 1 AND 200
  )
);

-- Create indexes for performance
CREATE INDEX idx_games_host_id ON games(host_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_scheduled_date ON games(scheduled_date);
CREATE INDEX idx_games_host_status ON games(host_id, status);
CREATE INDEX idx_games_created_at ON games(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Hosts can view their own games
CREATE POLICY "Hosts can view own games"
ON games
FOR SELECT
USING (auth.uid() = host_id);

-- Hosts can create games for themselves
CREATE POLICY "Hosts can create own games"
ON games
FOR INSERT
WITH CHECK (auth.uid() = host_id);

-- Hosts can update their own games
CREATE POLICY "Hosts can update own games"
ON games
FOR UPDATE
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

-- Hosts can delete their own games
CREATE POLICY "Hosts can delete own games"
ON games
FOR DELETE
USING (auth.uid() = host_id);

-- Players can view games they're participating in (via teams)
CREATE POLICY "Players can view participating games"
ON games
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN team_players tp ON t.id = tp.team_id
    WHERE t.game_id = games.id AND tp.player_id = auth.uid()
  )
);
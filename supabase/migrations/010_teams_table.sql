-- Migration: Create teams table for game-specific team entities
-- Purpose: Support team-based gameplay where teams exist only within a specific game

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  display_color VARCHAR(7) DEFAULT '#000000',
  current_score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT team_name_length CHECK (LENGTH(TRIM(name)) BETWEEN 1 AND 50),
  CONSTRAINT valid_hex_color CHECK (display_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT positive_score CHECK (current_score >= 0),

  -- Unique team name per game
  UNIQUE(game_id, name)
);

-- Create indexes for performance
CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_created_at ON teams(created_at);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Game hosts can manage teams for their games
CREATE POLICY "Hosts can manage teams for own games"
ON teams
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = teams.game_id AND games.host_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = teams.game_id AND games.host_id = auth.uid()
  )
);

-- Players can view teams in games they're participating in
CREATE POLICY "Players can view teams in participating games"
ON teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_players tp
    JOIN teams t ON t.game_id = teams.game_id
    WHERE tp.team_id = t.id AND tp.player_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = teams.game_id AND games.host_id = auth.uid()
  )
);

-- Function to check team size limits
CREATE OR REPLACE FUNCTION check_team_size_limit()
RETURNS TRIGGER AS $$
DECLARE
  team_count INTEGER;
  max_players INTEGER;
BEGIN
  -- Get current team size and game limits
  SELECT COUNT(*), g.max_players_per_team
  INTO team_count, max_players
  FROM team_players tp
  JOIN teams t ON t.id = tp.team_id
  JOIN games g ON g.id = t.game_id
  WHERE tp.team_id = NEW.team_id
  GROUP BY g.max_players_per_team;

  -- Check if adding this player would exceed limit
  IF team_count >= max_players THEN
    RAISE EXCEPTION 'Team cannot have more than % players', max_players;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
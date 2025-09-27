-- Migration: Create team_players table for membership tracking
-- Purpose: Track team membership with uniqueness constraints and size limits

-- Create team_players table
CREATE TABLE team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraints
  UNIQUE(team_id, player_id),

  -- One team per player per game constraint
  CONSTRAINT one_team_per_player_per_game UNIQUE (
    player_id,
    (SELECT game_id FROM teams WHERE teams.id = team_id)
  )
);

-- Create indexes for performance
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_player_id ON team_players(player_id);
CREATE INDEX idx_team_players_joined_at ON team_players(joined_at);

-- Create composite index for game-level queries
CREATE INDEX idx_team_players_game_player ON team_players(
  player_id,
  (SELECT game_id FROM teams WHERE teams.id = team_id)
);

-- Function to enforce one team per player per game
CREATE OR REPLACE FUNCTION enforce_one_team_per_game()
RETURNS TRIGGER AS $$
DECLARE
  game_id_for_team UUID;
  existing_team_count INTEGER;
BEGIN
  -- Get the game_id for the team
  SELECT game_id INTO game_id_for_team
  FROM teams
  WHERE id = NEW.team_id;

  -- Check if player is already on another team in this game
  SELECT COUNT(*)
  INTO existing_team_count
  FROM team_players tp
  JOIN teams t ON t.id = tp.team_id
  WHERE tp.player_id = NEW.player_id
    AND t.game_id = game_id_for_team
    AND tp.team_id != NEW.team_id;

  IF existing_team_count > 0 THEN
    RAISE EXCEPTION 'Player can only join one team per game';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce team size limit (from previous migration)
CREATE TRIGGER check_team_size_before_insert
  BEFORE INSERT ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION check_team_size_limit();

-- Create trigger to enforce one team per game
CREATE TRIGGER enforce_one_team_per_game_trigger
  BEFORE INSERT OR UPDATE ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION enforce_one_team_per_game();

-- Enable Row Level Security
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Game hosts can manage team membership for their games
CREATE POLICY "Hosts can manage team players for own games"
ON team_players
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN games g ON g.id = t.game_id
    WHERE t.id = team_players.team_id AND g.host_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN games g ON g.id = t.game_id
    WHERE t.id = team_players.team_id AND g.host_id = auth.uid()
  )
);

-- Players can view team membership for games they're in
CREATE POLICY "Players can view team membership in participating games"
ON team_players
FOR SELECT
USING (
  -- Can see their own membership
  player_id = auth.uid()
  OR
  -- Can see other players in same game
  EXISTS (
    SELECT 1 FROM team_players tp1
    JOIN teams t1 ON t1.id = tp1.team_id
    JOIN teams t2 ON t2.game_id = t1.game_id
    WHERE tp1.player_id = auth.uid() AND t2.id = team_players.team_id
  )
  OR
  -- Game host can see all
  EXISTS (
    SELECT 1 FROM teams t
    JOIN games g ON g.id = t.game_id
    WHERE t.id = team_players.team_id AND g.host_id = auth.uid()
  )
);

-- Players can join teams (INSERT only when game status = 'setup')
CREATE POLICY "Players can join teams during setup"
ON team_players
FOR INSERT
WITH CHECK (
  player_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM teams t
    JOIN games g ON g.id = t.game_id
    WHERE t.id = team_players.team_id AND g.status = 'setup'
  )
);

-- Players can leave teams (DELETE only when game status = 'setup')
CREATE POLICY "Players can leave teams during setup"
ON team_players
FOR DELETE
USING (
  player_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM teams t
    JOIN games g ON g.id = t.game_id
    WHERE t.id = team_players.team_id AND g.status = 'setup'
  )
);
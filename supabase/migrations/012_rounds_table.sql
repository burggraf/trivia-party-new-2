-- Migration: Create rounds table for game rounds with status tracking
-- Purpose: Support multiple rounds within multi-user games

-- Create enum for round status
CREATE TYPE round_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create rounds table
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  status round_status DEFAULT 'pending' NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT positive_round_number CHECK (round_number > 0),
  CONSTRAINT valid_round_end_time CHECK (
    (end_time IS NULL) OR (start_time IS NULL) OR (end_time > start_time)
  ),

  -- Unique round number per game
  UNIQUE(game_id, round_number)
);

-- Create indexes for performance
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_round_number ON rounds(round_number);
CREATE INDEX idx_rounds_game_round ON rounds(game_id, round_number);
CREATE INDEX idx_rounds_created_at ON rounds(created_at);

-- Function to validate round number sequence
CREATE OR REPLACE FUNCTION validate_round_sequence()
RETURNS TRIGGER AS $$
DECLARE
  max_existing_round INTEGER;
  game_total_rounds INTEGER;
BEGIN
  -- Get the maximum existing round number for this game
  SELECT COALESCE(MAX(round_number), 0), g.total_rounds
  INTO max_existing_round, game_total_rounds
  FROM rounds r
  RIGHT JOIN games g ON g.id = NEW.game_id
  WHERE r.game_id = NEW.game_id OR r.game_id IS NULL
  GROUP BY g.total_rounds;

  -- Check if round number exceeds game's total_rounds
  IF NEW.round_number > game_total_rounds THEN
    RAISE EXCEPTION 'Round number % exceeds game total rounds %',
      NEW.round_number, game_total_rounds;
  END IF;

  -- For INSERT, ensure sequential round creation (no gaps)
  IF TG_OP = 'INSERT' THEN
    IF NEW.round_number != max_existing_round + 1 THEN
      RAISE EXCEPTION 'Rounds must be created sequentially. Expected round %, got %',
        max_existing_round + 1, NEW.round_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate round sequence
CREATE TRIGGER validate_round_sequence_trigger
  BEFORE INSERT OR UPDATE ON rounds
  FOR EACH ROW
  EXECUTE FUNCTION validate_round_sequence();

-- Enable Row Level Security
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Game hosts can manage rounds for their games
CREATE POLICY "Hosts can manage rounds for own games"
ON rounds
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = rounds.game_id AND games.host_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = rounds.game_id AND games.host_id = auth.uid()
  )
);

-- Players can view rounds for games they're participating in
CREATE POLICY "Players can view rounds in participating games"
ON rounds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_players tp
    JOIN teams t ON t.id = tp.team_id
    WHERE t.game_id = rounds.game_id AND tp.player_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = rounds.game_id AND games.host_id = auth.uid()
  )
);
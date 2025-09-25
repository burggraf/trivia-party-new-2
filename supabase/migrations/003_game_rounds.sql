-- Migration: Create game_rounds table with constraints
-- Purpose: Tracks individual rounds within a game session

-- Create game_rounds table
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  questions_count INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0 NOT NULL,
  round_score INTEGER DEFAULT 0 NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_ms BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT positive_values CHECK (
    round_number > 0 AND
    questions_count > 0 AND
    correct_answers >= 0 AND
    round_score >= 0
  ),
  CONSTRAINT valid_correct_answers CHECK (correct_answers <= questions_count),
  CONSTRAINT non_empty_categories CHECK (array_length(categories, 1) > 0),
  CONSTRAINT valid_duration CHECK (
    (duration_ms IS NULL) OR (duration_ms >= 0)
  ),
  CONSTRAINT valid_times CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND (end_time IS NULL OR end_time >= start_time))
  ),
  -- Unique constraint: one round per number per session
  UNIQUE(game_session_id, round_number)
);

-- Create indexes
CREATE INDEX idx_game_rounds_session ON game_rounds(game_session_id, round_number);

-- Enable Row Level Security
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view rounds from their own game sessions
CREATE POLICY "Users can view own game rounds"
ON game_rounds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_session_id AND gs.user_id = auth.uid()
  )
);

-- System can create rounds for user's game sessions
-- (Edge functions will handle this with service role key)
CREATE POLICY "System can create game rounds"
ON game_rounds
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_session_id AND gs.user_id = auth.uid()
  )
);

-- System can update rounds for user's game sessions
CREATE POLICY "System can update game rounds"
ON game_rounds
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_session_id AND gs.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_session_id AND gs.user_id = auth.uid()
  )
);

-- Cascade delete with game sessions (handled by foreign key)
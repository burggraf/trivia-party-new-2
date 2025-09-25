-- Migration: Create game_sessions table with foreign keys
-- Purpose: Represents a complete trivia game session

-- Create enum for game session status
CREATE TYPE game_session_status AS ENUM ('setup', 'in_progress', 'paused', 'completed');

-- Create game_sessions table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status game_session_status DEFAULT 'setup' NOT NULL,
  total_rounds INTEGER NOT NULL,
  questions_per_round INTEGER NOT NULL,
  selected_categories TEXT[] NOT NULL DEFAULT '{}',
  current_round INTEGER DEFAULT 1 NOT NULL,
  current_question_index INTEGER DEFAULT 0 NOT NULL,
  total_score INTEGER DEFAULT 0 NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  total_duration_ms BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT positive_values CHECK (
    total_rounds > 0 AND
    questions_per_round > 0 AND
    current_round > 0 AND
    current_question_index >= 0 AND
    total_score >= 0
  ),
  CONSTRAINT valid_current_round CHECK (current_round <= total_rounds),
  CONSTRAINT valid_end_time CHECK (
    (status = 'completed' AND end_time IS NOT NULL) OR
    (status != 'completed' AND end_time IS NULL)
  ),
  CONSTRAINT valid_duration CHECK (
    (total_duration_ms IS NULL) OR (total_duration_ms >= 0)
  ),
  CONSTRAINT non_empty_categories CHECK (array_length(selected_categories, 1) > 0)
);

-- Create indexes
CREATE INDEX idx_game_sessions_user_status ON game_sessions(user_id, status);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own game sessions
CREATE POLICY "Users can view own game sessions"
ON game_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create game sessions for themselves
CREATE POLICY "Users can create own game sessions"
ON game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own game sessions
CREATE POLICY "Users can update own game sessions"
ON game_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own game sessions
CREATE POLICY "Users can delete own game sessions"
ON game_sessions
FOR DELETE
USING (auth.uid() = user_id);
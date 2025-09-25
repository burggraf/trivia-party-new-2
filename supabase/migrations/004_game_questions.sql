-- Migration: Create game_questions table with relationships
-- Purpose: Links questions to game sessions with user answers and timing

-- Create game_questions table
CREATE TABLE game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  game_round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  question_order INTEGER NOT NULL,
  presented_answers JSONB NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  time_to_answer_ms BIGINT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_question_order CHECK (question_order >= 0),
  CONSTRAINT valid_time_to_answer CHECK (
    (time_to_answer_ms IS NULL) OR (time_to_answer_ms > 0)
  ),
  CONSTRAINT answer_consistency CHECK (
    (user_answer IS NULL AND is_correct IS NULL AND time_to_answer_ms IS NULL AND answered_at IS NULL) OR
    (user_answer IS NOT NULL AND is_correct IS NOT NULL AND time_to_answer_ms IS NOT NULL AND answered_at IS NOT NULL)
  ),
  CONSTRAINT valid_presented_answers CHECK (
    jsonb_typeof(presented_answers) = 'array' AND
    jsonb_array_length(presented_answers) = 4
  ),
  -- Unique constraint: one question per order per round
  UNIQUE(game_round_id, question_order)
);

-- Create indexes
CREATE INDEX idx_game_questions_round_order ON game_questions(game_round_id, question_order);
CREATE INDEX idx_game_questions_session ON game_questions(game_session_id);
CREATE INDEX idx_game_questions_question_id ON game_questions(question_id);

-- Function to validate user answer against presented answers
CREATE OR REPLACE FUNCTION validate_game_question_answer()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_answer is provided, validate it's in presented_answers
  IF NEW.user_answer IS NOT NULL THEN
    IF NOT (NEW.presented_answers ? NEW.user_answer) THEN
      RAISE EXCEPTION 'User answer must be one of the presented answers';
    END IF;

    -- Auto-calculate is_correct based on user_answer vs correct_answer
    NEW.is_correct := (NEW.user_answer = NEW.correct_answer);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for answer validation
CREATE TRIGGER game_questions_validate_answer
  BEFORE INSERT OR UPDATE ON game_questions
  FOR EACH ROW
  EXECUTE FUNCTION validate_game_question_answer();

-- Enable Row Level Security
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view questions from their own game sessions
CREATE POLICY "Users can view own game questions"
ON game_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_session_id AND gs.user_id = auth.uid()
  )
);

-- System can create question records for user's game sessions
CREATE POLICY "System can create game questions"
ON game_questions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_session_id AND gs.user_id = auth.uid()
  )
);

-- System can update question records (for answers)
CREATE POLICY "System can update game questions"
ON game_questions
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

-- Cascade delete with game sessions and rounds (handled by foreign keys)
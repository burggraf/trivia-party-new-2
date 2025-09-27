-- Migration: Create round_questions table for question assignment to rounds
-- Purpose: Assign questions to specific rounds with proper ordering

-- Create round_questions table
CREATE TABLE round_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT positive_question_order CHECK (question_order > 0),

  -- Unique constraints
  UNIQUE(round_id, question_order),
  UNIQUE(round_id, question_id)
);

-- Create indexes for performance
CREATE INDEX idx_round_questions_round_id ON round_questions(round_id);
CREATE INDEX idx_round_questions_question_id ON round_questions(question_id);
CREATE INDEX idx_round_questions_order ON round_questions(round_id, question_order);
CREATE INDEX idx_round_questions_created_at ON round_questions(created_at);

-- Function to validate question order sequence
CREATE OR REPLACE FUNCTION validate_question_order()
RETURNS TRIGGER AS $$
DECLARE
  max_existing_order INTEGER;
  questions_per_round INTEGER;
BEGIN
  -- Get the maximum existing question order for this round
  SELECT COALESCE(MAX(question_order), 0)
  INTO max_existing_order
  FROM round_questions
  WHERE round_id = NEW.round_id;

  -- Get the questions_per_round for this game
  SELECT g.questions_per_round
  INTO questions_per_round
  FROM rounds r
  JOIN games g ON g.id = r.game_id
  WHERE r.id = NEW.round_id;

  -- Check if question order exceeds game's questions_per_round
  IF NEW.question_order > questions_per_round THEN
    RAISE EXCEPTION 'Question order % exceeds questions per round %',
      NEW.question_order, questions_per_round;
  END IF;

  -- For INSERT, ensure sequential question ordering (no gaps)
  IF TG_OP = 'INSERT' THEN
    IF NEW.question_order != max_existing_order + 1 THEN
      RAISE EXCEPTION 'Questions must be ordered sequentially. Expected order %, got %',
        max_existing_order + 1, NEW.question_order;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate question order
CREATE TRIGGER validate_question_order_trigger
  BEFORE INSERT OR UPDATE ON round_questions
  FOR EACH ROW
  EXECUTE FUNCTION validate_question_order();

-- Function to automatically mark questions as used by host
CREATE OR REPLACE FUNCTION mark_question_used_by_host()
RETURNS TRIGGER AS $$
DECLARE
  host_user_id UUID;
BEGIN
  -- Get the host_id for this game
  SELECT g.host_id
  INTO host_user_id
  FROM rounds r
  JOIN games g ON g.id = r.game_id
  WHERE r.id = NEW.round_id;

  -- Insert into host_used_questions if not already exists
  INSERT INTO host_used_questions (host_id, question_id)
  VALUES (host_user_id, NEW.question_id)
  ON CONFLICT (host_id, question_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically mark questions as used
CREATE TRIGGER mark_question_used_trigger
  AFTER INSERT ON round_questions
  FOR EACH ROW
  EXECUTE FUNCTION mark_question_used_by_host();

-- Enable Row Level Security
ALTER TABLE round_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Game hosts can manage round questions for their games
CREATE POLICY "Hosts can manage round questions for own games"
ON round_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM rounds r
    JOIN games g ON g.id = r.game_id
    WHERE r.id = round_questions.round_id AND g.host_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rounds r
    JOIN games g ON g.id = r.game_id
    WHERE r.id = round_questions.round_id AND g.host_id = auth.uid()
  )
);

-- Players can view round questions for games they're participating in
CREATE POLICY "Players can view round questions in participating games"
ON round_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rounds r
    JOIN games g ON g.id = r.game_id
    JOIN teams t ON t.game_id = g.id
    JOIN team_players tp ON tp.team_id = t.id
    WHERE r.id = round_questions.round_id AND tp.player_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM rounds r
    JOIN games g ON g.id = r.game_id
    WHERE r.id = round_questions.round_id AND g.host_id = auth.uid()
  )
);
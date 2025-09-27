-- Migration: Create team_answers table for team responses with constraints
-- Purpose: Track team answers with first-submit-wins logic and scoring

-- Create team_answers table
CREATE TABLE team_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_question_id UUID NOT NULL REFERENCES round_questions(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  answer VARCHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0 NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_answer_choice CHECK (answer IN ('A', 'B', 'C', 'D')),
  CONSTRAINT positive_points CHECK (points_earned >= 0),

  -- One answer per team per question (first-submit-wins)
  UNIQUE(team_id, round_question_id)
);

-- Create indexes for performance
CREATE INDEX idx_team_answers_team_id ON team_answers(team_id);
CREATE INDEX idx_team_answers_round_question_id ON team_answers(round_question_id);
CREATE INDEX idx_team_answers_submitted_by ON team_answers(submitted_by);
CREATE INDEX idx_team_answers_submitted_at ON team_answers(submitted_at);
CREATE INDEX idx_team_answers_is_correct ON team_answers(is_correct);

-- Composite indexes for common queries
CREATE INDEX idx_team_answers_team_round ON team_answers(team_id, round_question_id);
CREATE INDEX idx_team_answers_round_team ON team_answers(round_question_id, team_id);

-- Function to validate submitter is team member
CREATE OR REPLACE FUNCTION validate_team_member_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if submitted_by is a member of the team
  IF NOT EXISTS (
    SELECT 1 FROM team_players
    WHERE team_id = NEW.team_id AND player_id = NEW.submitted_by
  ) THEN
    RAISE EXCEPTION 'Only team members can submit answers for their team';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate if answer is correct and assign points
CREATE OR REPLACE FUNCTION calculate_answer_correctness()
RETURNS TRIGGER AS $$
DECLARE
  correct_answer VARCHAR(1);
BEGIN
  -- Get the correct answer for this question
  SELECT q.a INTO correct_answer
  FROM round_questions rq
  JOIN questions q ON q.id = rq.question_id
  WHERE rq.id = NEW.round_question_id;

  -- Set is_correct based on submitted answer
  NEW.is_correct := (NEW.answer = correct_answer);

  -- Assign points (10 for correct, 0 for incorrect)
  NEW.points_earned := CASE WHEN NEW.is_correct THEN 10 ELSE 0 END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update team score
CREATE OR REPLACE FUNCTION update_team_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update team's current_score
  UPDATE teams
  SET current_score = (
    SELECT COALESCE(SUM(points_earned), 0)
    FROM team_answers
    WHERE team_id = NEW.team_id
  )
  WHERE id = NEW.team_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate round is in progress
CREATE OR REPLACE FUNCTION validate_round_in_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the round is in progress
  IF NOT EXISTS (
    SELECT 1 FROM rounds r
    WHERE r.id = (
      SELECT round_id FROM round_questions WHERE id = NEW.round_question_id
    ) AND r.status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Can only submit answers when round is in progress';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER validate_team_member_before_insert
  BEFORE INSERT ON team_answers
  FOR EACH ROW
  EXECUTE FUNCTION validate_team_member_submission();

CREATE TRIGGER validate_round_in_progress_before_insert
  BEFORE INSERT ON team_answers
  FOR EACH ROW
  EXECUTE FUNCTION validate_round_in_progress();

CREATE TRIGGER calculate_answer_correctness_before_insert
  BEFORE INSERT ON team_answers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_answer_correctness();

CREATE TRIGGER update_team_score_after_insert
  AFTER INSERT ON team_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_team_score();

-- Enable Row Level Security
ALTER TABLE team_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Game hosts can view all team answers for their games
CREATE POLICY "Hosts can view team answers for own games"
ON team_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN games g ON g.id = t.game_id
    WHERE t.id = team_answers.team_id AND g.host_id = auth.uid()
  )
);

-- Team members can view answers for their team
CREATE POLICY "Team members can view own team answers"
ON team_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_players tp
    WHERE tp.team_id = team_answers.team_id AND tp.player_id = auth.uid()
  )
);

-- Team members can submit answers for their team
CREATE POLICY "Team members can submit answers"
ON team_answers
FOR INSERT
WITH CHECK (
  submitted_by = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM team_players tp
    WHERE tp.team_id = team_answers.team_id AND tp.player_id = auth.uid()
  )
);

-- No updates or deletes allowed on team answers (immutable record)
-- This enforces the first-submit-wins rule
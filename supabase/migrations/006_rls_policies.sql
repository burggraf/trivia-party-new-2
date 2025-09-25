-- Migration: Setup Row Level Security policies for all tables
-- Purpose: Comprehensive RLS policies and security functions

-- Enable RLS on questions table (existing table)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Questions table RLS policies (read-only access for authenticated users)
CREATE POLICY "Authenticated users can view questions"
ON questions
FOR SELECT
TO authenticated
USING (true);

-- Create security functions for edge function access
-- These functions allow edge functions to bypass RLS with service role

-- Function to create game session (used by edge functions)
CREATE OR REPLACE FUNCTION create_game_session_secure(
  p_user_id UUID,
  p_total_rounds INTEGER,
  p_questions_per_round INTEGER,
  p_selected_categories TEXT[]
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Invalid user ID';
  END IF;

  -- Validate categories exist
  IF NOT (p_selected_categories <@ get_available_categories()) THEN
    RAISE EXCEPTION 'Invalid categories specified';
  END IF;

  -- Create the session
  INSERT INTO game_sessions (
    user_id,
    total_rounds,
    questions_per_round,
    selected_categories
  ) VALUES (
    p_user_id,
    p_total_rounds,
    p_questions_per_round,
    p_selected_categories
  )
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update game session status
CREATE OR REPLACE FUNCTION update_game_session_secure(
  p_session_id UUID,
  p_user_id UUID,
  p_status game_session_status,
  p_current_round INTEGER DEFAULT NULL,
  p_current_question_index INTEGER DEFAULT NULL,
  p_total_score INTEGER DEFAULT NULL,
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_total_duration_ms BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify user owns the session
  IF NOT EXISTS (
    SELECT 1 FROM game_sessions
    WHERE id = p_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  -- Update the session
  UPDATE game_sessions
  SET
    status = p_status,
    current_round = COALESCE(p_current_round, current_round),
    current_question_index = COALESCE(p_current_question_index, current_question_index),
    total_score = COALESCE(p_total_score, total_score),
    start_time = COALESCE(p_start_time, start_time),
    end_time = COALESCE(p_end_time, end_time),
    total_duration_ms = COALESCE(p_total_duration_ms, total_duration_ms),
    updated_at = NOW()
  WHERE id = p_session_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create game round
CREATE OR REPLACE FUNCTION create_game_round_secure(
  p_session_id UUID,
  p_user_id UUID,
  p_round_number INTEGER,
  p_categories TEXT[],
  p_questions_count INTEGER
)
RETURNS UUID AS $$
DECLARE
  round_id UUID;
BEGIN
  -- Verify user owns the session
  IF NOT EXISTS (
    SELECT 1 FROM game_sessions
    WHERE id = p_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  -- Create the round
  INSERT INTO game_rounds (
    game_session_id,
    round_number,
    categories,
    questions_count,
    start_time
  ) VALUES (
    p_session_id,
    p_round_number,
    p_categories,
    p_questions_count,
    NOW()
  )
  RETURNING id INTO round_id;

  RETURN round_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create game question
CREATE OR REPLACE FUNCTION create_game_question_secure(
  p_session_id UUID,
  p_round_id UUID,
  p_user_id UUID,
  p_question_id UUID,
  p_question_order INTEGER,
  p_presented_answers JSONB,
  p_correct_answer TEXT
)
RETURNS UUID AS $$
DECLARE
  question_record_id UUID;
BEGIN
  -- Verify user owns the session
  IF NOT EXISTS (
    SELECT 1 FROM game_sessions
    WHERE id = p_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  -- Verify question exists
  IF NOT EXISTS (SELECT 1 FROM questions WHERE id = p_question_id) THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  -- Create the game question record
  INSERT INTO game_questions (
    game_session_id,
    game_round_id,
    question_id,
    question_order,
    presented_answers,
    correct_answer
  ) VALUES (
    p_session_id,
    p_round_id,
    p_question_id,
    p_question_order,
    p_presented_answers,
    p_correct_answer
  )
  RETURNING id INTO question_record_id;

  RETURN question_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit answer
CREATE OR REPLACE FUNCTION submit_answer_secure(
  p_question_record_id UUID,
  p_user_id UUID,
  p_user_answer TEXT,
  p_time_to_answer_ms BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify user owns the question record through session
  IF NOT EXISTS (
    SELECT 1 FROM game_questions gq
    JOIN game_sessions gs ON gq.game_session_id = gs.id
    WHERE gq.id = p_question_record_id AND gs.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Question record not found or access denied';
  END IF;

  -- Update the question with user answer
  UPDATE game_questions
  SET
    user_answer = p_user_answer,
    time_to_answer_ms = p_time_to_answer_ms,
    answered_at = NOW()
  WHERE id = p_question_record_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile statistics
CREATE OR REPLACE FUNCTION update_user_profile_stats_secure(
  p_user_id UUID,
  p_games_increment INTEGER DEFAULT 0,
  p_correct_increment INTEGER DEFAULT 0,
  p_questions_increment INTEGER DEFAULT 0
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update user profile counters
  UPDATE user_profiles
  SET
    total_games_played = total_games_played + p_games_increment,
    total_correct_answers = total_correct_answers + p_correct_increment,
    total_questions_answered = total_questions_answered + p_questions_increment,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role (for edge functions)
GRANT EXECUTE ON FUNCTION create_game_session_secure(UUID, INTEGER, INTEGER, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION update_game_session_secure(UUID, UUID, game_session_status, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION create_game_round_secure(UUID, UUID, INTEGER, TEXT[], INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION create_game_question_secure(UUID, UUID, UUID, UUID, INTEGER, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION submit_answer_secure(UUID, UUID, TEXT, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_profile_stats_secure(UUID, INTEGER, INTEGER, INTEGER) TO service_role;

-- Grant execute permissions to authenticated users for read functions
GRANT EXECUTE ON FUNCTION create_game_session_secure(UUID, INTEGER, INTEGER, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_answer_secure(UUID, UUID, TEXT, BIGINT) TO authenticated;
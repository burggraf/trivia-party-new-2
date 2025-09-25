-- Migration: Create database indexes and performance optimization
-- Purpose: Add performance indexes and database functions for complex queries

-- Additional performance indexes for questions table (existing table)
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX idx_game_sessions_user_created ON game_sessions(user_id, created_at DESC);
CREATE INDEX idx_game_rounds_session_created ON game_rounds(game_session_id, created_at DESC);
CREATE INDEX idx_game_questions_answered_at ON game_questions(answered_at DESC) WHERE answered_at IS NOT NULL;

-- Function to get user statistics efficiently
CREATE OR REPLACE FUNCTION get_user_statistics(user_uuid UUID)
RETURNS TABLE(
  total_games INTEGER,
  total_questions INTEGER,
  total_correct INTEGER,
  accuracy_percentage NUMERIC,
  average_time_per_question NUMERIC,
  favorite_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      COUNT(DISTINCT gs.id) as games_count,
      COUNT(gq.id) as questions_count,
      COUNT(gq.id) FILTER (WHERE gq.is_correct = true) as correct_count,
      AVG(gq.time_to_answer_ms) as avg_time_ms
    FROM game_sessions gs
    LEFT JOIN game_questions gq ON gs.id = gq.game_session_id
    WHERE gs.user_id = user_uuid
      AND gs.status = 'completed'
      AND gq.answered_at IS NOT NULL
  ),
  category_stats AS (
    SELECT
      q.category,
      COUNT(*) as category_count
    FROM game_sessions gs
    JOIN game_questions gq ON gs.id = gq.game_session_id
    JOIN questions q ON gq.question_id = q.id
    WHERE gs.user_id = user_uuid
      AND gs.status = 'completed'
      AND gq.answered_at IS NOT NULL
    GROUP BY q.category
    ORDER BY category_count DESC
    LIMIT 1
  )
  SELECT
    COALESCE(us.games_count, 0)::INTEGER,
    COALESCE(us.questions_count, 0)::INTEGER,
    COALESCE(us.correct_count, 0)::INTEGER,
    CASE
      WHEN us.questions_count > 0 THEN
        ROUND((us.correct_count::NUMERIC / us.questions_count::NUMERIC) * 100, 2)
      ELSE 0
    END,
    COALESCE(ROUND(us.avg_time_ms / 1000.0, 2), 0),
    COALESCE(cs.category, 'None'::TEXT)
  FROM user_stats us
  CROSS JOIN category_stats cs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent games for a user
CREATE OR REPLACE FUNCTION get_user_recent_games(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  game_id UUID,
  status game_session_status,
  total_score INTEGER,
  total_questions INTEGER,
  accuracy_percentage NUMERIC,
  duration_minutes NUMERIC,
  categories TEXT[],
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs.id,
    gs.status,
    gs.total_score,
    gs.total_rounds * gs.questions_per_round as total_questions_calc,
    CASE
      WHEN COUNT(gq.id) > 0 THEN
        ROUND((COUNT(gq.id) FILTER (WHERE gq.is_correct = true)::NUMERIC / COUNT(gq.id)::NUMERIC) * 100, 2)
      ELSE 0
    END,
    CASE
      WHEN gs.total_duration_ms IS NOT NULL THEN
        ROUND(gs.total_duration_ms / 60000.0, 2)
      ELSE NULL
    END,
    gs.selected_categories,
    gs.created_at,
    gs.end_time
  FROM game_sessions gs
  LEFT JOIN game_questions gq ON gs.id = gq.game_session_id AND gq.answered_at IS NOT NULL
  WHERE gs.user_id = user_uuid
  GROUP BY gs.id, gs.status, gs.total_score, gs.total_rounds, gs.questions_per_round,
           gs.total_duration_ms, gs.selected_categories, gs.created_at, gs.end_time
  ORDER BY gs.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available question categories
CREATE OR REPLACE FUNCTION get_available_categories()
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT category
    FROM questions
    WHERE category IS NOT NULL
    ORDER BY category
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category question counts
CREATE OR REPLACE FUNCTION get_category_question_counts()
RETURNS TABLE(category TEXT, question_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.category,
    COUNT(*) as count
  FROM questions q
  WHERE q.category IS NOT NULL
  GROUP BY q.category
  ORDER BY q.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recent_games(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_question_counts() TO authenticated;
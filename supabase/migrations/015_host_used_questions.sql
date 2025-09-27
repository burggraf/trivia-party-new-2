-- Migration: Create host_used_questions table to prevent question repetition
-- Purpose: Track which questions each host has used to ensure no repetition

-- Create host_used_questions table
CREATE TABLE host_used_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint ensures no question repetition per host
  UNIQUE(host_id, question_id)
);

-- Create indexes for performance
CREATE INDEX idx_host_used_questions_host_id ON host_used_questions(host_id);
CREATE INDEX idx_host_used_questions_question_id ON host_used_questions(question_id);
CREATE INDEX idx_host_used_questions_used_at ON host_used_questions(used_at);

-- Composite index for efficient lookups
CREATE INDEX idx_host_used_questions_lookup ON host_used_questions(host_id, question_id);

-- Function to get available questions for a host
CREATE OR REPLACE FUNCTION get_available_questions_for_host(
  p_host_id UUID,
  p_categories TEXT[],
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  question_id UUID,
  category TEXT,
  question TEXT,
  a TEXT,
  b TEXT,
  c TEXT,
  d TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.category,
    q.question,
    q.a,
    q.b,
    q.c,
    q.d
  FROM questions q
  WHERE
    q.category = ANY(p_categories)
    AND q.id NOT IN (
      SELECT huq.question_id
      FROM host_used_questions huq
      WHERE huq.host_id = p_host_id
    )
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark questions as used by host
CREATE OR REPLACE FUNCTION mark_questions_used(
  p_host_id UUID,
  p_question_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  question_id UUID;
  inserted_count INTEGER := 0;
BEGIN
  FOREACH question_id IN ARRAY p_question_ids
  LOOP
    INSERT INTO host_used_questions (host_id, question_id)
    VALUES (p_host_id, question_id)
    ON CONFLICT (host_id, question_id) DO NOTHING;

    IF FOUND THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if questions are available for host
CREATE OR REPLACE FUNCTION check_questions_available(
  p_host_id UUID,
  p_question_ids UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
  unavailable_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unavailable_count
  FROM unnest(p_question_ids) AS qid
  WHERE EXISTS (
    SELECT 1 FROM host_used_questions huq
    WHERE huq.host_id = p_host_id AND huq.question_id = qid
  );

  RETURN unavailable_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE host_used_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Hosts can view their own used questions
CREATE POLICY "Hosts can view own used questions"
ON host_used_questions
FOR SELECT
USING (host_id = auth.uid());

-- Hosts can insert their own used questions
CREATE POLICY "Hosts can mark own questions as used"
ON host_used_questions
FOR INSERT
WITH CHECK (host_id = auth.uid());

-- No updates or deletes allowed (immutable usage tracking)

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_available_questions_for_host(UUID, TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_questions_used(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_questions_available(UUID, UUID[]) TO authenticated;
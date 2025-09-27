-- Migration: Add question repetition prevention functionality
-- Purpose: Ensure users never see the same question twice across different games

-- Create helper function to reset user question history
-- This function clears all game questions for a specific user and optionally specific categories
CREATE OR REPLACE FUNCTION reset_user_question_history(
  p_user_id UUID,
  p_categories TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session_ids UUID[];
BEGIN
  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Invalid user ID';
  END IF;

  -- Get all session IDs for the user
  SELECT ARRAY(
    SELECT id
    FROM game_sessions
    WHERE user_id = p_user_id
  ) INTO v_session_ids;

  -- If no categories specified, delete all game questions for the user
  IF p_categories IS NULL THEN
    DELETE FROM game_questions
    WHERE game_session_id = ANY(v_session_ids);
  ELSE
    -- Delete only game questions from specified categories
    DELETE FROM game_questions gq
    USING questions q
    WHERE gq.question_id = q.id
      AND gq.game_session_id = ANY(v_session_ids)
      AND q.category = ANY(p_categories);
  END IF;

  -- Also delete the game sessions if all their questions are removed
  DELETE FROM game_sessions gs
  WHERE gs.user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM game_questions gq
      WHERE gq.game_session_id = gs.id
    );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reset_user_question_history(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_question_history(UUID, TEXT[]) TO service_role;

-- Update create_game function to prevent question repetition for users
-- This ensures no question is repeated across different games for the same user
CREATE OR REPLACE FUNCTION public.create_game(p_total_rounds integer, p_questions_per_round integer, p_selected_categories text[])
 RETURNS TABLE(game_session_id uuid, questions jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
  v_total_questions INTEGER;
  v_question_record RECORD;
  v_questions_array JSONB := '[]'::jsonb;
  v_answers TEXT[];
  v_shuffled_answers JSONB;
  v_question_order INTEGER := 1;
  v_round_number INTEGER;
  v_game_question_id UUID;
  v_used_question_ids UUID[];
  v_available_questions_count INTEGER;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Calculate total questions needed
  v_total_questions := p_total_rounds * p_questions_per_round;

  -- Get all question IDs that this user has already used
  SELECT ARRAY(
    SELECT DISTINCT gq.question_id
    FROM game_questions gq
    JOIN game_sessions gs ON gq.game_session_id = gs.id
    WHERE gs.user_id = v_user_id
  ) INTO v_used_question_ids;

  -- If no previous questions, initialize as empty array
  IF v_used_question_ids IS NULL THEN
    v_used_question_ids := ARRAY[]::UUID[];
  END IF;

  -- Check how many unused questions are available in selected categories
  SELECT COUNT(*)
  FROM questions
  WHERE category = ANY(p_selected_categories)
    AND id != ALL(v_used_question_ids)
  INTO v_available_questions_count;

  -- If not enough unused questions available, reset user's history for these categories
  IF v_available_questions_count < v_total_questions THEN
    RAISE NOTICE 'Not enough unused questions (% available, % needed). Resetting question history for selected categories.',
      v_available_questions_count, v_total_questions;

    -- Reset question history for the selected categories only
    PERFORM reset_user_question_history(v_user_id, p_selected_categories);

    -- Clear the used questions array since we just reset
    v_used_question_ids := ARRAY[]::UUID[];

    -- Recheck available questions count
    SELECT COUNT(*)
    FROM questions
    WHERE category = ANY(p_selected_categories)
    INTO v_available_questions_count;

    -- If still not enough questions even after reset, raise error
    IF v_available_questions_count < v_total_questions THEN
      RAISE EXCEPTION 'Insufficient questions in selected categories. Available: %, Needed: %',
        v_available_questions_count, v_total_questions;
    END IF;
  END IF;

  -- Create game session
  INSERT INTO game_sessions (
    user_id,
    status,
    total_rounds,
    questions_per_round,
    selected_categories,
    current_round,
    current_question_index,
    total_score
  ) VALUES (
    v_user_id,
    'setup',
    p_total_rounds,
    p_questions_per_round,
    p_selected_categories,
    1,
    0,
    0
  ) RETURNING id INTO v_session_id;

  -- Get random questions from selected categories, excluding previously used ones
  FOR v_question_record IN
    SELECT id, question, category, a, b, c, d
    FROM questions
    WHERE category = ANY(p_selected_categories)
      AND id != ALL(v_used_question_ids)  -- Exclude previously used questions
    ORDER BY RANDOM()
    LIMIT v_total_questions
  LOOP
    -- Calculate which round this question belongs to
    v_round_number := ((v_question_order - 1) / p_questions_per_round) + 1;

    -- Create shuffled answers array (a is always correct)
    v_answers := ARRAY[v_question_record.a, v_question_record.b, v_question_record.c, v_question_record.d];
    v_shuffled_answers := to_jsonb(
      (SELECT array_agg(elem ORDER BY random())
       FROM unnest(v_answers) AS elem)
    );

    -- Insert game question record and get the game_question_id
    INSERT INTO game_questions (
      game_session_id,
      question_id,
      question_order,
      round_number,
      presented_answers,
      correct_answer,
      points_awarded
    ) VALUES (
      v_session_id,
      v_question_record.id,
      v_question_order,
      v_round_number,
      v_shuffled_answers,
      v_question_record.a,  -- Correct answer is always 'a'
      0  -- No points awarded yet
    ) RETURNING id INTO v_game_question_id;

    -- Build questions array for return - use game_question_id as the id field
    v_questions_array := v_questions_array || jsonb_build_object(
      'id', v_game_question_id,  -- This is the key fix - return game_question_id, not question_id
      'question', v_question_record.question,
      'category', v_question_record.category,
      'answers', v_shuffled_answers,
      'question_order', v_question_order,
      'round_number', v_round_number
    );

    v_question_order := v_question_order + 1;
  END LOOP;

  -- Check if we got enough questions (this should not happen given our validation above)
  IF jsonb_array_length(v_questions_array) < v_total_questions THEN
    RAISE EXCEPTION 'Failed to get enough questions. Needed %, got %',
      v_total_questions, jsonb_array_length(v_questions_array);
  END IF;

  -- Return the session ID and questions
  RETURN QUERY SELECT v_session_id, v_questions_array;
END;
$function$;
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface ValidateAnswerRequest {
  user_id: string;
  game_question_id: string;
  user_answer: string;
  time_to_answer_ms: number;
}

interface ValidateAnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  updated_score: number;
  next_question?: {
    id: string;
    question: string;
    category: string;
    presented_answers: { label: string; text: string }[];
    round_number: number;
    question_number: number;
    total_questions_in_round: number;
  };
  round_complete: boolean;
  game_complete: boolean;
  round_summary?: {
    round_number: number;
    correct_answers: number;
    total_questions: number;
    round_score: number;
    accuracy_percentage: number;
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request body
    const { user_id, game_question_id, user_answer, time_to_answer_ms }: ValidateAnswerRequest =
      await req.json();

    // Validate request
    if (!user_id || !game_question_id || !user_answer || time_to_answer_ms === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (time_to_answer_ms <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid time_to_answer_ms' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the game question and verify ownership
    const { data: gameQuestion, error: gameQuestionError } = await supabaseClient
      .from('game_questions')
      .select(`
        *,
        game_sessions!inner(user_id, status, total_rounds, questions_per_round, current_round, current_question_index),
        game_rounds!inner(round_number, questions_count)
      `)
      .eq('id', game_question_id)
      .single();

    if (gameQuestionError || !gameQuestion) {
      return new Response(
        JSON.stringify({ error: 'Game question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user ownership
    if (gameQuestion.game_sessions.user_id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to game question' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if question was already answered
    if (gameQuestion.answered_at) {
      return new Response(
        JSON.stringify({ error: 'Question already answered' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify game is in progress
    if (gameQuestion.game_sessions.status !== 'in_progress') {
      return new Response(
        JSON.stringify({ error: 'Game is not in progress' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Submit the answer using secure function
    const { error: submitError } = await supabaseClient
      .rpc('submit_answer_secure', {
        p_question_record_id: game_question_id,
        p_user_id: user_id,
        p_user_answer: user_answer,
        p_time_to_answer_ms: time_to_answer_ms
      });

    if (submitError) {
      throw new Error(`Failed to submit answer: ${submitError.message}`);
    }

    // Get the updated question to check if answer was correct
    const { data: updatedQuestion, error: updatedQuestionError } = await supabaseClient
      .from('game_questions')
      .select('is_correct, correct_answer')
      .eq('id', game_question_id)
      .single();

    if (updatedQuestionError || !updatedQuestion) {
      throw new Error('Failed to get updated question data');
    }

    const isCorrect = updatedQuestion.is_correct || false;

    // Update session score and progress
    const currentSession = gameQuestion.game_sessions;
    const newScore = isCorrect ? currentSession.total_score + 1 : currentSession.total_score;
    const newQuestionIndex = currentSession.current_question_index + 1;

    // Check if round is complete
    const questionsInCurrentRound = currentSession.questions_per_round;
    const roundComplete = newQuestionIndex >= questionsInCurrentRound;

    let nextRound = currentSession.current_round;
    let nextQuestionIndex = newQuestionIndex;

    if (roundComplete) {
      nextRound += 1;
      nextQuestionIndex = 0;
    }

    // Check if game is complete
    const gameComplete = nextRound > currentSession.total_rounds;

    // Update game session
    const { error: sessionUpdateError } = await supabaseClient
      .rpc('update_game_session_secure', {
        p_session_id: gameQuestion.game_session_id,
        p_user_id: user_id,
        p_status: gameComplete ? 'completed' : 'in_progress',
        p_current_round: gameComplete ? currentSession.current_round : nextRound,
        p_current_question_index: gameComplete ? currentSession.current_question_index : nextQuestionIndex,
        p_total_score: newScore,
        p_end_time: gameComplete ? new Date().toISOString() : null
      });

    if (sessionUpdateError) {
      console.warn(`Failed to update session: ${sessionUpdateError.message}`);
    }

    // Prepare response
    const response: ValidateAnswerResponse = {
      is_correct: isCorrect,
      correct_answer: updatedQuestion.correct_answer,
      updated_score: newScore,
      round_complete: roundComplete,
      game_complete: gameComplete
    };

    // Get round summary if round is complete
    if (roundComplete) {
      const { data: roundQuestions, error: roundQuestionsError } = await supabaseClient
        .from('game_questions')
        .select('is_correct')
        .eq('game_round_id', gameQuestion.game_round_id)
        .not('answered_at', 'is', null);

      if (!roundQuestionsError && roundQuestions) {
        const correctInRound = roundQuestions.filter(q => q.is_correct).length;
        const totalInRound = roundQuestions.length;

        response.round_summary = {
          round_number: currentSession.current_round,
          correct_answers: correctInRound,
          total_questions: totalInRound,
          round_score: correctInRound,
          accuracy_percentage: totalInRound > 0 ? (correctInRound / totalInRound) * 100 : 0
        };
      }
    }

    // Get next question if not game complete and not round complete
    if (!gameComplete && !roundComplete) {
      const { data: nextQuestions, error: nextQuestionsError } = await supabaseClient
        .from('game_questions')
        .select(`
          id,
          question_order,
          presented_answers,
          questions!inner(question, category)
        `)
        .eq('game_session_id', gameQuestion.game_session_id)
        .eq('game_round_id', gameQuestion.game_round_id)
        .eq('question_order', newQuestionIndex)
        .is('answered_at', null)
        .single();

      if (!nextQuestionsError && nextQuestions) {
        response.next_question = {
          id: nextQuestions.id,
          question: nextQuestions.questions.question,
          category: nextQuestions.questions.category,
          presented_answers: JSON.parse(nextQuestions.presented_answers as string),
          round_number: currentSession.current_round,
          question_number: newQuestionIndex + 1,
          total_questions_in_round: questionsInCurrentRound
        };
      }
    }

    // If game is complete, update user profile statistics
    if (gameComplete) {
      const { error: statsError } = await supabaseClient
        .rpc('update_user_profile_stats_secure', {
          p_user_id: user_id,
          p_games_increment: 1,
          p_correct_increment: newScore,
          p_questions_increment: currentSession.total_rounds * currentSession.questions_per_round
        });

      if (statsError) {
        console.warn(`Failed to update user stats: ${statsError.message}`);
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-answer:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
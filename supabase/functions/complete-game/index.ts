import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface CompleteGameRequest {
  user_id: string;
  game_session_id: string;
}

interface RoundSummary {
  round_number: number;
  correct_answers: number;
  total_questions: number;
  round_score: number;
  duration_ms: number;
  accuracy_percentage: number;
}

interface CompleteGameResponse {
  game_session_id: string;
  total_score: number;
  total_questions: number;
  correct_answers: number;
  accuracy_percentage: number;
  total_duration_ms: number;
  rounds: RoundSummary[];
  personal_best: boolean;
  final_statistics: {
    games_played: number;
    total_correct: number;
    total_questions_answered: number;
    overall_accuracy: number;
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
    const { user_id, game_session_id }: CompleteGameRequest = await req.json();

    // Validate request
    if (!user_id || !game_session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the game session and verify ownership
    const { data: gameSession, error: sessionError } = await supabaseClient
      .from('game_sessions')
      .select('*')
      .eq('id', game_session_id)
      .eq('user_id', user_id)
      .single();

    if (sessionError || !gameSession) {
      return new Response(
        JSON.stringify({ error: 'Game session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total duration if not already set
    let totalDurationMs = gameSession.total_duration_ms;
    if (!totalDurationMs && gameSession.start_time && gameSession.end_time) {
      const startTime = new Date(gameSession.start_time).getTime();
      const endTime = new Date(gameSession.end_time).getTime();
      totalDurationMs = endTime - startTime;

      // Update session with calculated duration
      const { error: durationUpdateError } = await supabaseClient
        .rpc('update_game_session_secure', {
          p_session_id: game_session_id,
          p_user_id: user_id,
          p_status: 'completed',
          p_total_duration_ms: totalDurationMs
        });

      if (durationUpdateError) {
        console.warn(`Failed to update duration: ${durationUpdateError.message}`);
      }
    } else if (!totalDurationMs) {
      totalDurationMs = 0;
    }

    // Get all rounds for this game session
    const { data: rounds, error: roundsError } = await supabaseClient
      .from('game_rounds')
      .select('*')
      .eq('game_session_id', game_session_id)
      .order('round_number');

    if (roundsError) {
      throw new Error(`Failed to get rounds: ${roundsError.message}`);
    }

    // Get all answered questions for detailed statistics
    const { data: answeredQuestions, error: questionsError } = await supabaseClient
      .from('game_questions')
      .select('game_round_id, is_correct, time_to_answer_ms')
      .eq('game_session_id', game_session_id)
      .not('answered_at', 'is', null);

    if (questionsError) {
      throw new Error(`Failed to get answered questions: ${questionsError.message}`);
    }

    // Calculate round summaries
    const roundSummaries: RoundSummary[] = [];
    let totalCorrect = 0;
    let totalQuestions = 0;

    for (const round of rounds || []) {
      const roundQuestions = answeredQuestions?.filter(q => q.game_round_id === round.id) || [];
      const correctInRound = roundQuestions.filter(q => q.is_correct).length;
      const totalInRound = roundQuestions.length;

      // Calculate round duration
      let roundDuration = round.duration_ms || 0;
      if (!roundDuration && round.start_time && round.end_time) {
        const startTime = new Date(round.start_time).getTime();
        const endTime = new Date(round.end_time).getTime();
        roundDuration = endTime - startTime;
      }

      const roundSummary: RoundSummary = {
        round_number: round.round_number,
        correct_answers: correctInRound,
        total_questions: totalInRound,
        round_score: correctInRound,
        duration_ms: roundDuration,
        accuracy_percentage: totalInRound > 0 ? (correctInRound / totalInRound) * 100 : 0
      };

      roundSummaries.push(roundSummary);
      totalCorrect += correctInRound;
      totalQuestions += totalInRound;
    }

    // Calculate overall accuracy
    const accuracyPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Check if this is a personal best
    const { data: userStats, error: statsError } = await supabaseClient
      .rpc('get_user_statistics', { user_uuid: user_id });

    let isPersonalBest = false;
    if (!statsError && userStats && userStats.length > 0) {
      const previousBestAccuracy = userStats[0].accuracy_percentage || 0;
      isPersonalBest = accuracyPercentage > previousBestAccuracy;
    } else {
      // First game is always a personal best
      isPersonalBest = true;
    }

    // Get updated user profile statistics
    const { data: updatedProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('total_games_played, total_correct_answers, total_questions_answered')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.warn(`Failed to get updated profile: ${profileError.message}`);
    }

    // Calculate final statistics
    const finalStats = updatedProfile ? {
      games_played: updatedProfile.total_games_played,
      total_correct: updatedProfile.total_correct_answers,
      total_questions_answered: updatedProfile.total_questions_answered,
      overall_accuracy: updatedProfile.total_questions_answered > 0
        ? (updatedProfile.total_correct_answers / updatedProfile.total_questions_answered) * 100
        : 0
    } : {
      games_played: 1,
      total_correct: totalCorrect,
      total_questions_answered: totalQuestions,
      overall_accuracy: accuracyPercentage
    };

    // Mark session as completed if not already
    if (gameSession.status !== 'completed') {
      const { error: completeError } = await supabaseClient
        .rpc('update_game_session_secure', {
          p_session_id: game_session_id,
          p_user_id: user_id,
          p_status: 'completed',
          p_end_time: new Date().toISOString(),
          p_total_duration_ms: totalDurationMs
        });

      if (completeError) {
        console.warn(`Failed to mark session as completed: ${completeError.message}`);
      }
    }

    // Update user profile with game completion stats if not already updated
    if (gameSession.status !== 'completed') {
      const { error: statsUpdateError } = await supabaseClient
        .rpc('update_user_profile_stats_secure', {
          p_user_id: user_id,
          p_games_increment: 1,
          p_correct_increment: totalCorrect,
          p_questions_increment: totalQuestions
        });

      if (statsUpdateError) {
        console.warn(`Failed to update user profile stats: ${statsUpdateError.message}`);
      }
    }

    const response: CompleteGameResponse = {
      game_session_id: game_session_id,
      total_score: gameSession.total_score,
      total_questions: totalQuestions,
      correct_answers: totalCorrect,
      accuracy_percentage: accuracyPercentage,
      total_duration_ms: totalDurationMs,
      rounds: roundSummaries,
      personal_best: isPersonalBest,
      final_statistics: finalStats
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in complete-game:', error);

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
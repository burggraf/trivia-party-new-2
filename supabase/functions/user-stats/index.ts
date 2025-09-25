import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface UserStatsRequest {
  user_id: string;
  include_recent_games?: boolean;
  recent_games_limit?: number;
}

interface GameSummary {
  game_id: string;
  status: string;
  total_score: number;
  total_questions: number;
  accuracy_percentage: number;
  duration_minutes: number;
  categories: string[];
  created_at: string;
  completed_at?: string;
}

interface UserStatsResponse {
  user_id: string;
  profile: {
    username: string;
    avatar_url?: string;
    total_games_played: number;
    total_correct_answers: number;
    total_questions_answered: number;
    favorite_categories: string[];
  };
  statistics: {
    total_games: number;
    total_questions: number;
    total_correct: number;
    accuracy_percentage: number;
    average_time_per_question: number;
    favorite_category: string;
  };
  recent_games?: GameSummary[];
  performance_trends: {
    games_this_week: number;
    accuracy_this_week: number;
    improvement_percentage: number;
  };
  category_breakdown: {
    category: string;
    questions_answered: number;
    correct_answers: number;
    accuracy_percentage: number;
  }[];
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
    const { user_id, include_recent_games = true, recent_games_limit = 10 }: UserStatsRequest =
      await req.json();

    // Validate request
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get detailed statistics using the database function
    const { data: detailedStats, error: statsError } = await supabaseClient
      .rpc('get_user_statistics', { user_uuid: user_id });

    if (statsError) {
      throw new Error(`Failed to get user statistics: ${statsError.message}`);
    }

    const stats = detailedStats && detailedStats.length > 0 ? detailedStats[0] : {
      total_games: 0,
      total_questions: 0,
      total_correct: 0,
      accuracy_percentage: 0,
      average_time_per_question: 0,
      favorite_category: 'None'
    };

    // Get recent games if requested
    let recentGames: GameSummary[] | undefined;
    if (include_recent_games) {
      const { data: recentGamesData, error: recentGamesError } = await supabaseClient
        .rpc('get_user_recent_games', {
          user_uuid: user_id,
          limit_count: recent_games_limit
        });

      if (!recentGamesError && recentGamesData) {
        recentGames = recentGamesData.map((game: any) => ({
          game_id: game.game_id,
          status: game.status,
          total_score: game.total_score,
          total_questions: game.total_questions,
          accuracy_percentage: game.accuracy_percentage,
          duration_minutes: game.duration_minutes || 0,
          categories: game.categories || [],
          created_at: game.created_at,
          completed_at: game.completed_at
        }));
      }
    }

    // Calculate performance trends (games and accuracy in the last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentGamesForTrends, error: trendsError } = await supabaseClient
      .from('game_sessions')
      .select(`
        id,
        total_score,
        total_rounds,
        questions_per_round,
        status,
        created_at,
        game_questions(is_correct)
      `)
      .eq('user_id', user_id)
      .gte('created_at', oneWeekAgo)
      .eq('status', 'completed');

    let gamesThisWeek = 0;
    let accuracyThisWeek = 0;

    if (!trendsError && recentGamesForTrends) {
      gamesThisWeek = recentGamesForTrends.length;

      if (gamesThisWeek > 0) {
        let totalQuestionsThisWeek = 0;
        let totalCorrectThisWeek = 0;

        recentGamesForTrends.forEach((game: any) => {
          const gameQuestions = game.game_questions || [];
          totalQuestionsThisWeek += gameQuestions.length;
          totalCorrectThisWeek += gameQuestions.filter((q: any) => q.is_correct).length;
        });

        accuracyThisWeek = totalQuestionsThisWeek > 0
          ? (totalCorrectThisWeek / totalQuestionsThisWeek) * 100
          : 0;
      }
    }

    // Calculate improvement percentage (compare this week vs overall)
    const overallAccuracy = stats.accuracy_percentage || 0;
    const improvementPercentage = overallAccuracy > 0
      ? ((accuracyThisWeek - overallAccuracy) / overallAccuracy) * 100
      : 0;

    // Get category breakdown
    const { data: categoryStats, error: categoryError } = await supabaseClient
      .from('game_questions')
      .select(`
        is_correct,
        questions!inner(category)
      `)
      .eq('game_sessions.user_id', user_id)
      .not('answered_at', 'is', null);

    let categoryBreakdown: Array<{
      category: string;
      questions_answered: number;
      correct_answers: number;
      accuracy_percentage: number;
    }> = [];

    if (!categoryError && categoryStats) {
      const categoryMap = new Map<string, { total: number; correct: number }>();

      categoryStats.forEach((question: any) => {
        const category = question.questions.category;
        const existing = categoryMap.get(category) || { total: 0, correct: 0 };
        existing.total += 1;
        if (question.is_correct) {
          existing.correct += 1;
        }
        categoryMap.set(category, existing);
      });

      categoryBreakdown = Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        questions_answered: stats.total,
        correct_answers: stats.correct,
        accuracy_percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
      })).sort((a, b) => b.questions_answered - a.questions_answered);
    }

    const response: UserStatsResponse = {
      user_id,
      profile: {
        username: userProfile.username,
        avatar_url: userProfile.avatar_url,
        total_games_played: userProfile.total_games_played,
        total_correct_answers: userProfile.total_correct_answers,
        total_questions_answered: userProfile.total_questions_answered,
        favorite_categories: userProfile.favorite_categories || []
      },
      statistics: {
        total_games: stats.total_games,
        total_questions: stats.total_questions,
        total_correct: stats.total_correct,
        accuracy_percentage: stats.accuracy_percentage,
        average_time_per_question: stats.average_time_per_question,
        favorite_category: stats.favorite_category
      },
      recent_games: recentGames,
      performance_trends: {
        games_this_week: gamesThisWeek,
        accuracy_this_week: accuracyThisWeek,
        improvement_percentage: improvementPercentage
      },
      category_breakdown: categoryBreakdown
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in user-stats:', error);

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
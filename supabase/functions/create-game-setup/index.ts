import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface GameSetupRequest {
  user_id: string;
  total_rounds: number;
  questions_per_round: number;
  selected_categories: string[];
}

interface GameSetupResponse {
  game_session_id: string;
  first_round_id: string;
  questions: {
    id: string;
    question: string;
    category: string;
    presented_answers: { label: string; text: string }[];
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
    const { user_id, total_rounds, questions_per_round, selected_categories }: GameSetupRequest =
      await req.json();

    // Validate request
    if (!user_id || !total_rounds || !questions_per_round || !selected_categories?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user exists
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get available categories to validate selection
    const { data: categories, error: categoriesError } = await supabaseClient
      .rpc('get_available_categories');

    if (categoriesError) {
      throw new Error(`Failed to get categories: ${categoriesError.message}`);
    }

    // Validate selected categories exist
    const invalidCategories = selected_categories.filter(cat => !categories.includes(cat));
    if (invalidCategories.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid categories: ${invalidCategories.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create game session using secure function
    const { data: sessionId, error: sessionError } = await supabaseClient
      .rpc('create_game_session_secure', {
        p_user_id: user_id,
        p_total_rounds: total_rounds,
        p_questions_per_round: questions_per_round,
        p_selected_categories: selected_categories
      });

    if (sessionError) {
      throw new Error(`Failed to create game session: ${sessionError.message}`);
    }

    // Get questions for the first round
    const totalQuestionsNeeded = questions_per_round;
    const { data: availableQuestions, error: questionsError } = await supabaseClient
      .from('questions')
      .select('*')
      .in('category', selected_categories)
      .limit(totalQuestionsNeeded * 2) // Get extra to ensure we have enough
      .order('created_at', { ascending: false });

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    if (!availableQuestions || availableQuestions.length < totalQuestionsNeeded) {
      return new Response(
        JSON.stringify({ error: 'Not enough questions available for selected categories' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Randomly select questions for first round
    const shuffledQuestions = availableQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, totalQuestionsNeeded);

    // Create the first round
    const { data: roundId, error: roundError } = await supabaseClient
      .rpc('create_game_round_secure', {
        p_session_id: sessionId,
        p_user_id: user_id,
        p_round_number: 1,
        p_categories: selected_categories,
        p_questions_count: questions_per_round
      });

    if (roundError) {
      throw new Error(`Failed to create game round: ${roundError.message}`);
    }

    // Create game question records and prepare response
    const questionPresentations = [];

    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];

      // Randomize answer order while keeping track of correct answer
      const answers = [
        { label: 'A', text: question.a },
        { label: 'B', text: question.b },
        { label: 'C', text: question.c },
        { label: 'D', text: question.d }
      ];

      // Shuffle answers
      const shuffledAnswers = answers.sort(() => Math.random() - 0.5);

      // Create game question record
      const { data: gameQuestionId, error: gameQuestionError } = await supabaseClient
        .rpc('create_game_question_secure', {
          p_session_id: sessionId,
          p_round_id: roundId,
          p_user_id: user_id,
          p_question_id: question.id,
          p_question_order: i,
          p_presented_answers: JSON.stringify(shuffledAnswers),
          p_correct_answer: question.a // 'a' is always the correct answer
        });

      if (gameQuestionError) {
        throw new Error(`Failed to create game question: ${gameQuestionError.message}`);
      }

      questionPresentations.push({
        id: gameQuestionId,
        question: question.question,
        category: question.category,
        presented_answers: shuffledAnswers
      });
    }

    // Update session status to in_progress with start time
    const { error: updateError } = await supabaseClient
      .rpc('update_game_session_secure', {
        p_session_id: sessionId,
        p_user_id: user_id,
        p_status: 'in_progress',
        p_start_time: new Date().toISOString()
      });

    if (updateError) {
      console.warn(`Failed to update session status: ${updateError.message}`);
    }

    const response: GameSetupResponse = {
      game_session_id: sessionId,
      first_round_id: roundId,
      questions: questionPresentations
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-game-setup:', error);

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
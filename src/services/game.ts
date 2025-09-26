import { supabase } from '../lib/supabase';
import type {
  GameService,
  UserProfile,
  Question,
  GameSession,
  CreateGameSessionRequest,
  StartGameResponse,
  QuestionPresentation,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  RoundSummary,
  GameSummary,
} from '@/contracts/game';

class GameServiceImpl implements GameService {
  // Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId);

      if (error) {
        console.error('Error fetching user profile:', error);
        // For any error, assume profile doesn't exist for now
        // This handles 406 errors and other access issues gracefully
        return null;
      }

      // Return first result or null if no results
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.log('User profile not found (network error), returning null');
      return null;
    }
  }

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const newProfile = {
        id: user.id,
        ...profile,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Question Management
  async getAvailableCategories(): Promise<string[]> {
    try {
      // Use RPC function to get distinct categories efficiently
      const { data, error } = await supabase
        .rpc('get_distinct_categories');

      if (error) {
        console.error('RPC error, falling back to direct query:', error);

        // Fallback to direct query with distinct
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('questions')
          .select('category')
          .limit(100);

        if (fallbackError) {
          throw fallbackError;
        }

        // Extract unique categories client-side as fallback
        const categories = [...new Set(fallbackData.map(item => item.category))].sort();
        return categories;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting available categories:', error);
      throw new Error(`Failed to get available categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getQuestionsForSession(categories: string[], count: number, excludeIds?: string[]): Promise<Question[]> {
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .in('category', categories)
        .limit(count);

      if (excludeIds && excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting questions for session:', error);
      throw new Error(`Failed to get questions for session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Game Session Management
  async createGameSession(userId: string, request: CreateGameSessionRequest): Promise<GameSession> {
    try {
      const sessionData = {
        user_id: userId,
        status: 'setup' as const,
        total_rounds: request.total_rounds,
        questions_per_round: request.questions_per_round,
        selected_categories: request.selected_categories,
        current_round: 1,
        current_question_index: 0,
        total_score: 0,
      };

      const { data, error } = await supabase
        .from('game_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating game session:', error);
      throw new Error(`Failed to create game session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGameSession(sessionId: string): Promise<GameSession | null> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting game session:', error);
      throw new Error(`Failed to get game session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserGameSessions(userId: string, status?: GameSession['status']): Promise<GameSession[]> {
    try {
      let query = supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user game sessions:', error);
        // For any error, return empty array gracefully
        // This handles 406 errors and other access issues
        return [];
      }

      return data || [];
    } catch (error) {
      console.log('User game sessions not found (network error), returning empty array');
      return [];
    }
  }

  async updateGameSession(sessionId: string, updates: Partial<GameSession>): Promise<GameSession> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating game session:', error);
      throw new Error(`Failed to update game session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Game Flow
  async startGame(sessionId: string): Promise<StartGameResponse> {
    try {
      console.log('🎯 Starting game for session:', sessionId);

      // Get the session
      const session = await this.getGameSession(sessionId);
      if (!session) {
        throw new Error('Game session not found');
      }

      console.log('🎯 Found session:', session.id, session.status);

      if (session.status !== 'setup') {
        throw new Error('Game session is not in setup state');
      }

      // Use our simplified create_game function
      console.log('🎯 Calling create_game function...');
      const { data, error } = await supabase
        .rpc('create_game', {
          p_total_rounds: session.total_rounds,
          p_questions_per_round: session.questions_per_round,
          p_selected_categories: session.selected_categories,
        });

      if (error) {
        throw error;
      }

      console.log('🎯 Game creation response:', data);

      // The create_game function creates a NEW session, so we need to use that session ID
      const newSessionId = data[0].game_session_id;

      // Update the NEW session to in_progress
      const updatedSession = await this.updateGameSession(newSessionId, {
        status: 'in_progress',
        start_time: new Date().toISOString(),
      });

      // Get the first question from the returned questions array
      const questions = data[0].questions;
      if (!questions || questions.length === 0) {
        throw new Error('No questions returned from game creation');
      }

      const firstQuestion = questions[0];

      const questionPresentation: QuestionPresentation = {
        id: firstQuestion.id,
        question: firstQuestion.question,
        category: firstQuestion.category,
        answers: firstQuestion.answers,
        round_number: firstQuestion.round_number,
        question_number: firstQuestion.question_order,
        total_questions: session.total_rounds * session.questions_per_round,
      };

      return {
        session: updatedSession,
        first_question: questionPresentation,
      };
    } catch (error) {
      console.error('Error starting game:', error);
      throw new Error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNextQuestion(sessionId: string): Promise<QuestionPresentation | null> {
    try {
      const session = await this.getGameSession(sessionId);
      if (!session) {
        throw new Error('Game session not found');
      }

      if (session.status !== 'in_progress') {
        throw new Error('Game is not in progress');
      }

      // Get the current game questions with simplified schema
      const { data: gameQuestions, error } = await supabase
        .from('game_questions')
        .select(`
          *,
          questions!inner(question, category, a, b, c, d)
        `)
        .eq('game_session_id', sessionId)
        .eq('question_order', session.current_question_index + 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No more questions
          return null;
        }
        throw error;
      }

      const questionPresentation: QuestionPresentation = {
        id: gameQuestions.id,
        question: gameQuestions.questions.question,
        category: gameQuestions.questions.category,
        answers: gameQuestions.presented_answers,
        round_number: gameQuestions.round_number,
        question_number: session.current_question_index + 1,
        total_questions: session.total_rounds * session.questions_per_round,
      };

      return questionPresentation;
    } catch (error) {
      console.error('Error getting next question:', error);
      throw new Error(`Failed to get next question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitAnswer(request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    try {
      // First get the game question without joins
      const { data: gameQuestion, error: questionError } = await supabase
        .from('game_questions')
        .select('*')
        .eq('id', request.game_question_id)
        .single();

      if (questionError || !gameQuestion) {
        throw new Error('Game question not found');
      }

      // Then get the game session separately
      const { data: gameSession, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameQuestion.game_session_id)
        .single();

      if (sessionError || !gameSession) {
        throw new Error('Game session not found');
      }

      // Check if answer is correct (client-side validation)
      const isCorrect = request.user_answer === gameQuestion.correct_answer;
      const pointsAwarded = isCorrect ? 1 : 0;

      // Update the game question with the user's answer
      const { error: updateError } = await supabase
        .from('game_questions')
        .update({
          user_answer: request.user_answer,
          is_correct: isCorrect,
          time_to_answer_ms: request.time_to_answer_ms,
          answered_at: new Date().toISOString(),
          points_awarded: pointsAwarded,
        })
        .eq('id', request.game_question_id);

      if (updateError) {
        throw updateError;
      }

      // Update game session score
      const newScore = gameSession.total_score + pointsAwarded;
      const newQuestionIndex = gameSession.current_question_index + 1;

      // Calculate current round based on question index, ensuring it doesn't exceed total_rounds
      const calculatedRound = Math.floor(newQuestionIndex / gameSession.questions_per_round) + 1;
      const newCurrentRound = Math.min(calculatedRound, gameSession.total_rounds);

      // Check if game is complete
      const totalQuestions = gameSession.total_rounds * gameSession.questions_per_round;
      const gameComplete = newQuestionIndex >= totalQuestions;
      const roundComplete = newQuestionIndex % gameSession.questions_per_round === 0;

      const sessionUpdates: any = {
        total_score: newScore,
        current_question_index: newQuestionIndex,
        current_round: newCurrentRound,
      };

      if (gameComplete) {
        sessionUpdates.status = 'completed';
        sessionUpdates.end_time = new Date().toISOString();
      }

      const { error: sessionUpdateError } = await supabase
        .from('game_sessions')
        .update(sessionUpdates)
        .eq('id', gameSession.id);

      if (sessionUpdateError) {
        throw sessionUpdateError;
      }

      // Get next question if game is not complete
      let nextQuestion: QuestionPresentation | undefined;
      if (!gameComplete) {
        nextQuestion = await this.getNextQuestion(gameSession.id) || undefined;
      }

      const response: SubmitAnswerResponse = {
        is_correct: isCorrect,
        correct_answer: gameQuestion.correct_answer,
        updated_score: newScore,
        round_complete: roundComplete,
        game_complete: gameComplete,
        next_question: nextQuestion,
      };

      return response;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw new Error(`Failed to submit answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async pauseGame(sessionId: string): Promise<GameSession> {
    try {
      return await this.updateGameSession(sessionId, {
        status: 'paused',
      });
    } catch (error) {
      console.error('Error pausing game:', error);
      throw new Error(`Failed to pause game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async resumeGame(sessionId: string): Promise<QuestionPresentation> {
    try {
      // Update status to in_progress
      await this.updateGameSession(sessionId, {
        status: 'in_progress',
      });

      // Get current question
      const currentQuestion = await this.getNextQuestion(sessionId);
      if (!currentQuestion) {
        throw new Error('No current question available');
      }

      return currentQuestion;
    } catch (error) {
      console.error('Error resuming game:', error);
      throw new Error(`Failed to resume game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async completeGame(sessionId: string): Promise<GameSummary> {
    try {
      // Simply get the game summary - the game is already marked as complete in submitAnswer
      return await this.getGameSummary(sessionId);
    } catch (error) {
      console.error('Error completing game:', error);
      throw new Error(`Failed to complete game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Statistics
  async getGameSummary(sessionId: string): Promise<GameSummary> {
    try {
      const session = await this.getGameSession(sessionId);
      if (!session) {
        throw new Error('Game session not found');
      }

      // Get round summaries from simplified schema
      const { data: questions, error: questionsError } = await supabase
        .from('game_questions')
        .select('*')
        .eq('game_session_id', sessionId)
        .order('round_number, question_order');

      if (questionsError) {
        throw questionsError;
      }

      // Group questions by round and calculate summaries
      const roundData = new Map<number, any>();

      questions?.forEach(question => {
        if (!roundData.has(question.round_number)) {
          roundData.set(question.round_number, {
            round_number: question.round_number,
            correct_answers: 0,
            total_questions: 0,
            round_score: 0,
            total_time: 0,
          });
        }

        const round = roundData.get(question.round_number)!;
        round.total_questions++;

        if (question.is_correct) {
          round.correct_answers++;
          round.round_score += question.points_awarded || 0;
        }

        if (question.time_to_answer_ms) {
          round.total_time += question.time_to_answer_ms;
        }
      });

      const roundSummaries: RoundSummary[] = Array.from(roundData.values()).map(round => ({
        round_number: round.round_number,
        correct_answers: round.correct_answers,
        total_questions: round.total_questions,
        round_score: round.round_score,
        duration_ms: round.total_time,
        accuracy_percentage: round.total_questions > 0 ?
          (round.correct_answers / round.total_questions) * 100 : 0,
      }));

      const totalQuestions = session.total_rounds * session.questions_per_round;
      const correctAnswers = questions?.filter(q => q.is_correct).length || 0;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Check if this is a personal best (simplified logic)
      const { data: userSessions } = await supabase
        .from('game_sessions')
        .select('total_score')
        .eq('user_id', session.user_id)
        .eq('status', 'completed')
        .order('total_score', { ascending: false });

      const personalBest = !userSessions || userSessions.length === 0 ||
        session.total_score >= userSessions[0].total_score;

      const summary: GameSummary = {
        game_session_id: sessionId,
        total_score: session.total_score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        accuracy_percentage: accuracy,
        total_duration_ms: session.total_duration_ms || 0,
        rounds: roundSummaries,
        personal_best: personalBest,
      };

      return summary;
    } catch (error) {
      console.error('Error getting game summary:', error);
      throw new Error(`Failed to get game summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserStats(userId: string): Promise<{
    total_games: number;
    total_score: number;
    average_accuracy: number;
    favorite_category: string;
    recent_games: GameSession[];
  }> {
    try {
      // Get user's completed games
      const { data: games, error: gamesError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (gamesError) {
        throw gamesError;
      }

      // Get all game questions for this user to calculate stats
      const { data: questions, error: questionsError } = await supabase
        .from('game_questions')
        .select('*, questions!inner(category)')
        .in('game_session_id', games?.map(g => g.id) || []);

      if (questionsError) {
        throw questionsError;
      }

      // Calculate stats
      const totalGames = games?.length || 0;
      const totalScore = games?.reduce((sum, game) => sum + game.total_score, 0) || 0;
      const totalQuestions = questions?.length || 0;
      const correctAnswers = questions?.filter(q => q.is_correct).length || 0;
      const averageAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Find favorite category
      const categoryCount = new Map<string, number>();
      questions?.forEach(q => {
        const category = q.questions.category;
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });

      let favoriteCategory = '';
      let maxCount = 0;
      categoryCount.forEach((count, category) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteCategory = category;
        }
      });

      // Get recent games (limit to 10)
      const recentGames = games?.slice(0, 10) || [];

      return {
        total_games: totalGames,
        total_score: totalScore,
        average_accuracy: averageAccuracy,
        favorite_category: favoriteCategory,
        recent_games: recentGames,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const gameService = new GameServiceImpl();

// Also export the class for testing
export { GameServiceImpl };
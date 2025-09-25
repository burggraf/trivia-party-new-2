import { supabase } from '../lib/supabase';
import { databaseService } from './database';
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
} from '../../specs/001-this-project-is/contracts/game';

class GameServiceImpl implements GameService {
  // Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user profile doesn't exist
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const { data, error } = await supabase
        .from('questions')
        .select('category')
        .order('category');

      if (error) {
        throw error;
      }

      // Extract unique categories
      const categories = [...new Set(data.map(item => item.category))];
      return categories;
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
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user game sessions:', error);
      throw new Error(`Failed to get user game sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      // Get the session
      const session = await this.getGameSession(sessionId);
      if (!session) {
        throw new Error('Game session not found');
      }

      if (session.status !== 'setup') {
        throw new Error('Game session is not in setup state');
      }

      // Create game setup using edge function
      const gameSetup = await databaseService.createGameSetup({
        user_id: session.user_id,
        total_rounds: session.total_rounds,
        questions_per_round: session.questions_per_round,
        selected_categories: session.selected_categories,
      });

      // Update session to in_progress
      const updatedSession = await this.updateGameSession(sessionId, {
        status: 'in_progress',
        start_time: new Date().toISOString(),
      });

      // Get the first question from the setup
      const firstRound = gameSetup.rounds[0];
      const firstQuestion = firstRound.questions[0];

      const questionPresentation: QuestionPresentation = {
        id: firstQuestion.question_id,
        question: firstQuestion.question,
        category: firstQuestion.category,
        answers: firstQuestion.presented_answers,
        round_number: firstRound.round_number,
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

      // Get the current game questions
      const { data: gameQuestions, error } = await supabase
        .from('game_questions')
        .select(`
          *,
          game_rounds!inner(round_number),
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
        round_number: gameQuestions.game_rounds.round_number,
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
      // Use edge function to validate answer and update game state
      const validation = await databaseService.validateAnswer({
        game_question_id: request.game_question_id,
        user_answer: request.user_answer,
        time_to_answer_ms: request.time_to_answer_ms,
      });

      // Build response
      const response: SubmitAnswerResponse = {
        is_correct: validation.is_correct,
        correct_answer: validation.correct_answer,
        updated_score: validation.session_stats.current_score,
        round_complete: validation.session_stats.round_complete,
        game_complete: validation.session_stats.game_complete,
      };

      // If not game complete and not round complete, get next question
      if (!validation.session_stats.game_complete && !validation.session_stats.round_complete) {
        const nextQuestion = await this.getNextQuestion(request.game_session_id);
        response.next_question = nextQuestion || undefined;
      }

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
      // Use edge function to complete the game
      const completion = await databaseService.completeGame({
        game_session_id: sessionId,
      });

      return completion.summary;
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

      // Get rounds summary
      const { data: rounds, error: roundsError } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('game_session_id', sessionId)
        .order('round_number');

      if (roundsError) {
        throw roundsError;
      }

      const roundSummaries: RoundSummary[] = (rounds || []).map(round => ({
        round_number: round.round_number,
        correct_answers: round.correct_answers,
        total_questions: round.questions_count,
        round_score: round.round_score,
        duration_ms: round.duration_ms || 0,
        accuracy_percentage: round.questions_count > 0 ?
          (round.correct_answers / round.questions_count) * 100 : 0,
      }));

      const totalQuestions = session.total_rounds * session.questions_per_round;
      const accuracy = totalQuestions > 0 ?
        (session.total_score / totalQuestions) * 100 : 0;

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
        correct_answers: session.total_score, // Assuming 1 point per correct answer
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
      // Use edge function to get comprehensive user stats
      const statsResponse = await databaseService.getUserStats({
        user_id: userId,
      });

      // Map to expected format
      const favoriteCategory = statsResponse.statistics.favorite_categories.length > 0 ?
        statsResponse.statistics.favorite_categories[0].category : '';

      return {
        total_games: statsResponse.statistics.total_games_played,
        total_score: statsResponse.statistics.total_correct_answers,
        average_accuracy: statsResponse.statistics.average_accuracy,
        favorite_category: favoriteCategory,
        recent_games: statsResponse.recent_games,
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
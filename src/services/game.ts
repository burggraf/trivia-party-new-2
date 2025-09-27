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
import type { ExtendedGameService } from '@/contracts/multi-user-game';
import type {
  Game,
  Team,
  TeamPlayer,
  TeamWithPlayers,
  Round,
  RoundQuestionDetail,
  TeamAnswer,
  CreateGameRequest,
  CreateTeamRequest,
  JoinTeamRequest,
  SubmitTeamAnswerRequest,
  StartGameResponse as MultiUserStartGameResponse,
  GameStateUpdate,
  GameSummaryResponse,
  GameStatus,
} from '@/contracts/multi-user-types';

class GameServiceImpl implements ExtendedGameService {
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

  // Multi-User Game Management
  async createGame(hostId: string, request: CreateGameRequest): Promise<Game> {
    try {
      const gameData = {
        host_id: hostId,
        title: request.title,
        location: request.location,
        scheduled_date: request.scheduled_date,
        start_time: request.start_time,
        end_time: request.end_time,
        max_teams: request.max_teams || 20,
        max_players_per_team: request.max_players_per_team || 4,
        status: 'setup' as GameStatus,
        total_rounds: request.total_rounds,
        questions_per_round: request.questions_per_round,
        selected_categories: request.selected_categories,
      };

      const { data, error } = await supabase
        .from('games')
        .insert([gameData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating multi-user game:', error);
      throw new Error(`Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGame(gameId: string): Promise<Game | null> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting game:', error);
      throw new Error(`Failed to get game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHostGames(hostId: string, status?: GameStatus): Promise<Game[]> {
    try {
      let query = supabase
        .from('games')
        .select('*')
        .eq('host_id', hostId)
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
      console.error('Error getting host games:', error);
      throw new Error(`Failed to get host games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
    try {
      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating game:', error);
      throw new Error(`Failed to update game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async startMultiUserGame(gameId: string): Promise<MultiUserStartGameResponse> {
    try {
      // Get the game
      const game = await this.getGame(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'setup') {
        throw new Error('Game is not in setup state');
      }

      // Get teams for the game
      const teams = await this.getGameTeams(gameId);

      // Create rounds for the game
      const rounds = await this.createRounds(gameId);
      const firstRound = rounds[0];

      // Get questions for the first round
      const firstQuestions = await this.getRoundQuestions(firstRound.id);

      // Update game status to in_progress
      const updatedGame = await this.updateGame(gameId, {
        status: 'in_progress',
        start_time: new Date().toISOString(),
      });

      // Start the first round
      await this.startRound(firstRound.id);

      return {
        game: updatedGame,
        teams,
        first_round: firstRound,
        first_questions: firstQuestions,
      };
    } catch (error) {
      console.error('Error starting multi-user game:', error);
      throw new Error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async completeMultiUserGame(gameId: string): Promise<GameSummaryResponse> {
    try {
      // Update game status to completed
      const game = await this.updateGame(gameId, {
        status: 'completed',
        end_time: new Date().toISOString(),
      });

      // Get teams with final scores
      const teams = await this.getGameTeams(gameId);

      // Get all rounds for the game
      const { data: rounds, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('game_id', gameId)
        .order('round_number');

      if (roundsError) {
        throw roundsError;
      }

      // Calculate team statistics and round summaries
      const teamsWithStats = await Promise.all(teams.map(async (team) => {
        const stats = await this.getTeamStats(team.id);
        return {
          ...team,
          total_score: stats.total_points,
          correct_answers: stats.correct_answers,
          total_questions: stats.total_answers,
          accuracy_percentage: stats.accuracy_percentage,
        };
      }));

      const roundsWithScores = await Promise.all((rounds || []).map(async (round) => {
        const teamAnswers = await this.getRoundAnswers(round.id);

        const teamScores = teams.map(team => {
          const teamRoundAnswers = teamAnswers.filter(answer => answer.team_id === team.id);
          const roundScore = teamRoundAnswers.reduce((sum, answer) => sum + answer.points_earned, 0);
          const correctAnswers = teamRoundAnswers.filter(answer => answer.is_correct).length;

          return {
            team_id: team.id,
            team_name: team.name,
            round_score: roundScore,
            correct_answers: correctAnswers,
          };
        });

        return {
          ...round,
          team_scores: teamScores,
        };
      }));

      // Calculate overall stats
      const totalQuestions = game.total_rounds * game.questions_per_round * teams.length;
      const totalCorrectAnswers = teamsWithStats.reduce((sum, team) => sum + team.correct_answers, 0);
      const averageAccuracy = totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0;

      const startTime = game.start_time ? new Date(game.start_time) : new Date();
      const endTime = game.end_time ? new Date(game.end_time) : new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      return {
        game,
        teams: teamsWithStats,
        rounds: roundsWithScores,
        overall_stats: {
          total_questions: totalQuestions,
          total_correct_answers: totalCorrectAnswers,
          average_accuracy: averageAccuracy,
          duration_ms: durationMs,
        },
      };
    } catch (error) {
      console.error('Error completing multi-user game:', error);
      throw new Error(`Failed to complete game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Team Management (T013)
  async createTeam(request: CreateTeamRequest): Promise<Team> {
    try {
      const teamData = {
        game_id: request.game_id,
        name: request.name,
        display_color: request.display_color || '#FF0000',
        current_score: 0,
      };

      const { data, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error(`Failed to create team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGameTeams(gameId: string): Promise<TeamWithPlayers[]> {
    try {
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at');

      if (teamsError) {
        throw teamsError;
      }

      // Get team players with user profile details
      const teamsWithPlayers = await Promise.all((teams || []).map(async (team) => {
        const { data: teamPlayers, error: playersError } = await supabase
          .from('team_players')
          .select(`
            id,
            joined_at,
            user_profiles!inner(id, display_name, avatar_url)
          `)
          .eq('team_id', team.id)
          .order('joined_at');

        if (playersError) {
          throw playersError;
        }

        const players = (teamPlayers || []).map(tp => ({
          id: tp.user_profiles.id,
          display_name: tp.user_profiles.display_name,
          avatar_url: tp.user_profiles.avatar_url,
          joined_at: tp.joined_at,
        }));

        return {
          ...team,
          players,
        };
      }));

      return teamsWithPlayers;
    } catch (error) {
      console.error('Error getting game teams:', error);
      throw new Error(`Failed to get game teams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async joinTeam(request: JoinTeamRequest): Promise<TeamPlayer> {
    try {
      // First check if player is already in a team for this game
      const team = await this.getTeam(request.team_id);
      if (!team) {
        throw new Error('Team not found');
      }

      const existingTeam = await this.getPlayerTeam(team.game_id, request.player_id);
      if (existingTeam) {
        throw new Error('Player is already in a team for this game');
      }

      // Check team size limit
      const gameTeams = await this.getGameTeams(team.game_id);
      const targetTeam = gameTeams.find(t => t.id === request.team_id);
      if (targetTeam && targetTeam.players.length >= 4) {
        throw new Error('Team is full (maximum 4 players per team)');
      }

      const teamPlayerData = {
        team_id: request.team_id,
        player_id: request.player_id,
      };

      const { data, error } = await supabase
        .from('team_players')
        .insert([teamPlayerData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error joining team:', error);
      throw new Error(`Failed to join team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async leaveTeam(teamId: string, playerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('team_id', teamId)
        .eq('player_id', playerId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      throw new Error(`Failed to leave team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPlayerTeam(gameId: string, playerId: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('team_players')
        .select(`
          teams!inner(*)
        `)
        .eq('player_id', playerId)
        .eq('teams.game_id', gameId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data?.teams || null;
    } catch (error) {
      console.error('Error getting player team:', error);
      throw new Error(`Failed to get player team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method for team operations
  private async getTeam(teamId: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting team:', error);
      return null;
    }
  }

  // Round Management (T015)
  async createRounds(gameId: string): Promise<Round[]> {
    try {
      const game = await this.getGame(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      // Create rounds for the game
      const roundsData = [];
      for (let i = 1; i <= game.total_rounds; i++) {
        roundsData.push({
          game_id: gameId,
          round_number: i,
          status: 'pending' as const,
        });
      }

      const { data: rounds, error: roundsError } = await supabase
        .from('rounds')
        .insert(roundsData)
        .select();

      if (roundsError) {
        throw roundsError;
      }

      // Get available questions for the host
      const totalQuestionsNeeded = game.total_rounds * game.questions_per_round;
      const availableQuestions = await this.getAvailableQuestionsForHost(
        game.host_id,
        game.selected_categories,
        totalQuestionsNeeded
      );

      if (availableQuestions.length < totalQuestionsNeeded) {
        throw new Error(`Not enough available questions. Need ${totalQuestionsNeeded}, found ${availableQuestions.length}`);
      }

      // Assign questions to rounds
      let questionIndex = 0;
      for (const round of rounds || []) {
        const roundQuestionIds = [];
        for (let q = 0; q < game.questions_per_round; q++) {
          roundQuestionIds.push(availableQuestions[questionIndex].id);
          questionIndex++;
        }
        await this.assignQuestionsToRound(round.id, roundQuestionIds);
      }

      // Mark all questions as used by the host
      const allQuestionIds = availableQuestions.slice(0, totalQuestionsNeeded).map(q => q.id);
      await this.markQuestionsUsed(game.host_id, allQuestionIds);

      return rounds || [];
    } catch (error) {
      console.error('Error creating rounds:', error);
      throw new Error(`Failed to create rounds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async startRound(roundId: string): Promise<Round> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString(),
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error starting round:', error);
      throw new Error(`Failed to start round: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async completeRound(roundId: string): Promise<Round> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error completing round:', error);
      throw new Error(`Failed to complete round: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRoundQuestions(roundId: string): Promise<RoundQuestionDetail[]> {
    try {
      const { data, error } = await supabase
        .from('round_questions')
        .select(`
          id,
          round_id,
          question_id,
          question_order,
          created_at,
          questions!inner(
            category,
            question,
            a,
            b,
            c,
            d
          )
        `)
        .eq('round_id', roundId)
        .order('question_order');

      if (error) {
        throw error;
      }

      const roundQuestions: RoundQuestionDetail[] = (data || []).map(rq => ({
        id: rq.id,
        round_id: rq.round_id,
        question_id: rq.question_id,
        question_order: rq.question_order,
        question: {
          category: rq.questions.category,
          question: rq.questions.question,
          a: rq.questions.a,
          b: rq.questions.b,
          c: rq.questions.c,
          d: rq.questions.d,
        },
        created_at: rq.created_at,
      }));

      return roundQuestions;
    } catch (error) {
      console.error('Error getting round questions:', error);
      throw new Error(`Failed to get round questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentRound(gameId: string): Promise<Round | null> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('game_id', gameId)
        .eq('status', 'in_progress')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting current round:', error);
      throw new Error(`Failed to get current round: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async assignQuestionsToRound(roundId: string, questionIds: string[]): Promise<void> {
    try {
      const roundQuestionsData = questionIds.map((questionId, index) => ({
        round_id: roundId,
        question_id: questionId,
        question_order: index + 1,
      }));

      const { error } = await supabase
        .from('round_questions')
        .insert(roundQuestionsData);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error assigning questions to round:', error);
      throw new Error(`Failed to assign questions to round: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Team Answer Management (T016)
  async submitTeamAnswer(request: SubmitTeamAnswerRequest): Promise<TeamAnswer> {
    try {
      // Get the round question to determine correct answer
      const { data: roundQuestion, error: roundQuestionError } = await supabase
        .from('round_questions')
        .select(`
          id,
          questions!inner(a)
        `)
        .eq('id', request.round_question_id)
        .single();

      if (roundQuestionError) {
        throw roundQuestionError;
      }

      // Determine if answer is correct and calculate points
      const correctAnswer = roundQuestion.questions.a; // 'a' is always the correct answer
      const isCorrect = request.answer === correctAnswer;
      const pointsEarned = isCorrect ? 10 : 0; // Standard scoring

      const answerData = {
        team_id: request.team_id,
        round_question_id: request.round_question_id,
        submitted_by: request.submitted_by,
        answer: request.answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      };

      const { data, error } = await supabase
        .from('team_answers')
        .insert([answerData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update team's current score
      await this.updateTeamScore(request.team_id, pointsEarned);

      return data;
    } catch (error) {
      console.error('Error submitting team answer:', error);
      throw new Error(`Failed to submit team answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTeamAnswers(teamId: string, roundId?: string): Promise<TeamAnswer[]> {
    try {
      let query = supabase
        .from('team_answers')
        .select('*')
        .eq('team_id', teamId)
        .order('submitted_at');

      if (roundId) {
        // Join with round_questions to filter by round
        query = supabase
          .from('team_answers')
          .select(`
            *,
            round_questions!inner(round_id)
          `)
          .eq('team_id', teamId)
          .eq('round_questions.round_id', roundId)
          .order('submitted_at');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting team answers:', error);
      throw new Error(`Failed to get team answers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRoundAnswers(roundId: string): Promise<TeamAnswer[]> {
    try {
      const { data, error } = await supabase
        .from('team_answers')
        .select(`
          *,
          round_questions!inner(round_id)
        `)
        .eq('round_questions.round_id', roundId)
        .order('submitted_at');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting round answers:', error);
      throw new Error(`Failed to get round answers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to update team score
  private async updateTeamScore(teamId: string, additionalPoints: number): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('increment_team_score', {
          team_id: teamId,
          points: additionalPoints
        });

      if (error) {
        // Fallback to manual update if RPC function doesn't exist
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('current_score')
          .eq('id', teamId)
          .single();

        if (teamError) {
          throw teamError;
        }

        const newScore = (team?.current_score || 0) + additionalPoints;

        const { error: updateError } = await supabase
          .from('teams')
          .update({ current_score: newScore })
          .eq('id', teamId);

        if (updateError) {
          throw updateError;
        }
      }
    } catch (error) {
      console.error('Error updating team score:', error);
      // Don't throw here to avoid blocking answer submission
    }
  }

  // Question Uniqueness Management (T014)
  async getAvailableQuestionsForHost(hostId: string, categories: string[], count: number): Promise<Question[]> {
    try {
      // Use the database function for efficient question selection
      const { data, error } = await supabase
        .rpc('get_available_questions_for_host', {
          p_host_id: hostId,
          p_categories: categories,
          p_limit: count
        });

      if (error) {
        throw error;
      }

      // Map the returned data to Question interface
      const questions: Question[] = (data || []).map((row: any) => ({
        id: row.question_id,
        category: row.category,
        question: row.question,
        a: row.a,
        b: row.b,
        c: row.c,
        d: row.d,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      return questions;
    } catch (error) {
      console.error('Error getting available questions for host:', error);
      throw new Error(`Failed to get available questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markQuestionsUsed(hostId: string, questionIds: string[]): Promise<void> {
    try {
      // Use the database function for efficient marking
      const { error } = await supabase
        .rpc('mark_questions_used', {
          p_host_id: hostId,
          p_question_ids: questionIds
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error marking questions as used:', error);
      throw new Error(`Failed to mark questions as used: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHostUsedQuestions(hostId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('host_used_questions')
        .select('question_id')
        .eq('host_id', hostId);

      if (error) {
        throw error;
      }

      return (data || []).map(row => row.question_id);
    } catch (error) {
      console.error('Error getting host used questions:', error);
      throw new Error(`Failed to get host used questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async assignQuestionsToRound(roundId: string, questionIds: string[]): Promise<void> {
    throw new Error('Not implemented yet - will be implemented in T015');
  }

  subscribeToGameUpdates(gameId: string, callback: (update: GameStateUpdate) => void): () => void {
    throw new Error('Not implemented yet - real-time subscriptions to be added later');
  }

  subscribeToTeamAnswers(teamId: string, callback: (answer: TeamAnswer) => void): () => void {
    throw new Error('Not implemented yet - real-time subscriptions to be added later');
  }

  subscribeToRoundUpdates(roundId: string, callback: (round: Round) => void): () => void {
    throw new Error('Not implemented yet - real-time subscriptions to be added later');
  }

  async getGameState(gameId: string): Promise<GameStateUpdate> {
    throw new Error('Not implemented yet - game state management to be added later');
  }

  async updateGameStatus(gameId: string, status: GameStatus): Promise<Game> {
    return await this.updateGame(gameId, { status });
  }

  async getTeamStats(teamId: string): Promise<{
    total_answers: number;
    correct_answers: number;
    accuracy_percentage: number;
    total_points: number;
    average_response_time: number;
  }> {
    try {
      const { data: answers, error } = await supabase
        .from('team_answers')
        .select('is_correct, points_earned, submitted_at')
        .eq('team_id', teamId);

      if (error) {
        throw error;
      }

      const totalAnswers = answers?.length || 0;
      const correctAnswers = answers?.filter(a => a.is_correct).length || 0;
      const totalPoints = answers?.reduce((sum, a) => sum + a.points_earned, 0) || 0;
      const accuracyPercentage = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

      // For average response time, we'd need to calculate time between question start and answer submission
      // This is a simplified placeholder - in a real implementation, we'd track question presentation times
      const averageResponseTime = 0; // TODO: Implement proper response time calculation

      return {
        total_answers: totalAnswers,
        correct_answers: correctAnswers,
        accuracy_percentage: accuracyPercentage,
        total_points: totalPoints,
        average_response_time: averageResponseTime,
      };
    } catch (error) {
      console.error('Error getting team stats:', error);
      throw new Error(`Failed to get team stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGameAnalytics(gameId: string): Promise<{
    total_questions: number;
    total_teams: number;
    total_players: number;
    average_score: number;
    completion_rate: number;
    question_difficulty_stats: Record<string, {
      category: string;
      correct_percentage: number;
      average_time: number;
    }>;
  }> {
    throw new Error('Not implemented yet - analytics to be added later');
  }
}

// Export a singleton instance
export const gameService = new GameServiceImpl();

// Also export the class for testing
export { GameServiceImpl };
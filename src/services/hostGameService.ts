import { supabase } from '@/lib/supabase';
import type {
  HostGameService,
  UserRole,
  RoleSelectionRequest,
  RoleSelectionResponse,
  CreateGameRequest,
  UpdateGameRequest,
  ArchiveGameRequest,
  DeleteGameRequest,
  GameListFilters,
  GameListResponse,
  UpdateRoundRequest,
  RoundConfiguration,
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  QuestionPreviewRequest,
  QuestionPreviewResponse,
  ReplaceQuestionRequest,
  QuestionAssignment,
  TeamManagementRequest,
  TeamManagementResponse,
  BulkPlayerAssignmentRequest,
  BulkPlayerAssignmentResponse
} from '@/contracts/host-management';
import type { Game, Team, Round } from '@/contracts/multi-user-types';
import { authService } from './auth';

class HostGameServiceImpl implements HostGameService {

  // === Role Management ===

  async setUserRole(request: RoleSelectionRequest): Promise<RoleSelectionResponse> {
    return authService.setUserRole(request);
  }

  async getUserRole(userId: string): Promise<UserRole | null> {
    return authService.getUserRole(userId);
  }

  // === Game Lifecycle ===

  async createGame(request: CreateGameRequest): Promise<Game> {
    // Verify user has host role
    const userRole = await this.getUserRole(request.host_id);
    if (userRole !== 'host') {
      throw new Error('Only users with host role can create games');
    }

    const { data, error } = await supabase
      .from('games')
      .insert({
        host_id: request.host_id,
        title: request.title,
        location: request.location,
        scheduled_date: request.scheduled_date,
        total_rounds: request.total_rounds,
        questions_per_round: request.questions_per_round,
        selected_categories: request.selected_categories,
        max_teams: request.max_teams,
        max_players_per_team: request.max_players_per_team,
        min_players_per_team: request.min_players_per_team,
        self_registration_enabled: request.self_registration_enabled,
        status: 'setup',
        archived: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create game: ${error.message}`);
    }

    // Create rounds for the game
    await this.createRoundsForGame(data.id, request.total_rounds);

    return this.mapToGame(data);
  }

  async updateGame(request: UpdateGameRequest): Promise<Game> {
    const { data, error } = await supabase
      .from('games')
      .update(request.updates)
      .eq('id', request.gameId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update game: ${error.message}`);
    }

    return this.mapToGame(data);
  }

  async archiveGame(request: ArchiveGameRequest): Promise<void> {
    const { error } = await supabase
      .from('games')
      .update({ archived: true })
      .eq('id', request.gameId);

    if (error) {
      throw new Error(`Failed to archive game: ${error.message}`);
    }
  }

  async deleteGame(request: DeleteGameRequest): Promise<void> {
    // Check if game can be deleted (only in setup status)
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('status')
      .eq('id', request.gameId)
      .single();

    if (gameError) {
      throw new Error(`Failed to check game status: ${gameError.message}`);
    }

    if (gameData.status !== 'setup') {
      throw new Error('Only games in setup status can be deleted');
    }

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', request.gameId);

    if (error) {
      throw new Error(`Failed to delete game: ${error.message}`);
    }
  }

  async getHostGames(hostId: string, filters?: GameListFilters): Promise<GameListResponse> {
    let query = supabase
      .from('games')
      .select('*')
      .eq('host_id', hostId);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.archived !== undefined) {
      query = query.eq('archived', filters.archived);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    // Apply sorting
    const sortField = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get host games: ${error.message}`);
    }

    return {
      games: data.map(game => this.mapToGame(game)),
      totalCount: data.length,
      hasMore: false // Would need a separate count query for accurate pagination
    };
  }

  async getGameDetails(gameId: string, hostId: string): Promise<Game> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        teams:teams(*),
        rounds:rounds(
          *,
          round_questions:round_questions(
            *,
            question:questions(*)
          )
        )
      `)
      .eq('id', gameId)
      .eq('host_id', hostId)
      .single();

    if (error) {
      throw new Error(`Failed to get game details: ${error.message}`);
    }

    return this.mapToGame(data);
  }

  // === Round Management ===

  async updateRoundConfiguration(request: UpdateRoundRequest): Promise<Round> {
    const { data, error } = await supabase
      .from('rounds')
      .update({
        questions_per_round: request.questionsPerRound,
        selected_categories: request.selectedCategories,
        time_limit_seconds: request.timeLimitSeconds
      })
      .eq('id', request.roundId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update round configuration: ${error.message}`);
    }

    return this.mapToRound(data);
  }

  async getRoundConfiguration(roundId: string): Promise<RoundConfiguration> {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single();

    if (error) {
      throw new Error(`Failed to get round configuration: ${error.message}`);
    }

    return {
      roundId: data.id,
      questionsPerRound: data.questions_per_round || 10,
      selectedCategories: data.selected_categories || [],
      timeLimitSeconds: data.time_limit_seconds || 30
    };
  }

  // === Question Management ===

  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    // Get already used questions for this host
    const { data: usedQuestions, error: usedError } = await supabase
      .from('host_used_questions')
      .select('question_id')
      .eq('host_id', request.hostId);

    if (usedError) {
      throw new Error(`Failed to get used questions: ${usedError.message}`);
    }

    const usedQuestionIds = usedQuestions.map(q => q.question_id);

    // Get available questions from selected categories
    let query = supabase
      .from('questions')
      .select('*')
      .in('category', request.categories)
      .limit(request.count * 2); // Get more than needed to account for filtering

    if (usedQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${usedQuestionIds.join(',')})`);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      throw new Error(`Failed to generate questions: ${questionsError.message}`);
    }

    if (questions.length < request.count) {
      throw new Error(`Not enough unused questions available. Found ${questions.length}, need ${request.count}`);
    }

    // Randomly select the required number of questions
    const selectedQuestions = this.shuffleArray(questions).slice(0, request.count);

    // Mark questions as used
    const usedRecords = selectedQuestions.map(q => ({
      host_id: request.hostId,
      question_id: q.id
    }));

    const { error: markUsedError } = await supabase
      .from('host_used_questions')
      .insert(usedRecords);

    if (markUsedError) {
      console.warn('Failed to mark questions as used:', markUsedError.message);
      // Don't throw error here as questions were still generated successfully
    }

    return {
      questions: selectedQuestions.map(q => this.mapToQuestion(q)),
      totalAvailable: questions.length,
      remainingUnused: questions.length - request.count
    };
  }

  async getQuestionPreview(request: QuestionPreviewRequest): Promise<QuestionPreviewResponse> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', request.questionId)
      .single();

    if (error) {
      throw new Error(`Failed to get question preview: ${error.message}`);
    }

    return {
      question: this.mapToQuestion(data),
      isAlreadyUsed: false // Would need to check host_used_questions
    };
  }

  async replaceQuestion(request: ReplaceQuestionRequest): Promise<QuestionAssignment> {
    // Get a new question from the same category
    const { data: currentQuestion } = await supabase
      .from('round_questions')
      .select('question:questions(*)')
      .eq('id', request.questionAssignmentId)
      .single();

    if (!currentQuestion?.question) {
      throw new Error('Current question not found');
    }

    const category = currentQuestion.question.category;

    // Generate a replacement question
    const replacementResponse = await this.generateQuestions({
      hostId: request.hostId,
      categories: [category],
      count: 1
    });

    if (replacementResponse.questions.length === 0) {
      throw new Error('No replacement questions available');
    }

    const newQuestion = replacementResponse.questions[0];

    // Update the round question assignment
    const { data, error } = await supabase
      .from('round_questions')
      .update({ question_id: newQuestion.id })
      .eq('id', request.questionAssignmentId)
      .select(`
        *,
        question:questions(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to replace question: ${error.message}`);
    }

    return {
      id: data.id,
      roundId: data.round_id,
      questionId: data.question_id,
      questionOrder: data.question_order,
      question: this.mapToQuestion(data.question),
      revealedAt: data.revealed_at
    };
  }

  // === Team Management ===

  async createTeam(request: TeamManagementRequest): Promise<TeamManagementResponse> {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        game_id: request.gameId,
        name: request.teamName,
        display_color: request.displayColor || '#FF0000'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create team: ${error.message}`);
    }

    return {
      success: true,
      team: this.mapToTeam(data),
      message: `Team "${request.teamName}" created successfully`
    };
  }

  async updateTeam(request: TeamManagementRequest): Promise<TeamManagementResponse> {
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: request.teamName,
        display_color: request.displayColor
      })
      .eq('id', request.teamId!)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update team: ${error.message}`);
    }

    return {
      success: true,
      team: this.mapToTeam(data),
      message: `Team updated successfully`
    };
  }

  async deleteTeam(request: TeamManagementRequest): Promise<TeamManagementResponse> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', request.teamId!);

    if (error) {
      throw new Error(`Failed to delete team: ${error.message}`);
    }

    return {
      success: true,
      team: null,
      message: `Team deleted successfully`
    };
  }

  async assignPlayersToTeam(request: BulkPlayerAssignmentRequest): Promise<BulkPlayerAssignmentResponse> {
    const assignments = request.playerIds.map(playerId => ({
      team_id: request.teamId,
      user_id: playerId
    }));

    const { data, error } = await supabase
      .from('team_players')
      .insert(assignments)
      .select(`
        *,
        team:teams(*),
        user:user_profiles(*)
      `);

    if (error) {
      throw new Error(`Failed to assign players to team: ${error.message}`);
    }

    return {
      success: true,
      assignments: data.map(assignment => ({
        id: assignment.id,
        teamId: assignment.team_id,
        userId: assignment.user_id,
        joinedAt: assignment.joined_at
      })),
      message: `${request.playerIds.length} players assigned successfully`
    };
  }

  // === Helper Methods ===

  private async createRoundsForGame(gameId: string, totalRounds: number): Promise<void> {
    const rounds = Array.from({ length: totalRounds }, (_, index) => ({
      game_id: gameId,
      round_number: index + 1,
      status: 'pending'
    }));

    const { error } = await supabase
      .from('rounds')
      .insert(rounds);

    if (error) {
      throw new Error(`Failed to create rounds: ${error.message}`);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private mapToGame(data: any): Game {
    return {
      id: data.id,
      host_id: data.host_id,
      title: data.title,
      location: data.location,
      scheduled_date: data.scheduled_date,
      start_time: data.start_time,
      end_time: data.end_time,
      max_teams: data.max_teams,
      max_players_per_team: data.max_players_per_team,
      status: data.status,
      total_rounds: data.total_rounds,
      questions_per_round: data.questions_per_round,
      selected_categories: data.selected_categories,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  private mapToTeam(data: any): Team {
    return {
      id: data.id,
      game_id: data.game_id,
      name: data.name,
      display_color: data.display_color,
      current_score: data.current_score,
      created_at: data.created_at
    };
  }

  private mapToRound(data: any): Round {
    return {
      id: data.id,
      game_id: data.game_id,
      round_number: data.round_number,
      status: data.status,
      start_time: data.start_time,
      end_time: data.end_time,
      created_at: data.created_at
    };
  }

  // === Dashboard Data ===

  async getHostDashboard(hostId: string): Promise<HostDashboardData> {
    try {
      // Get all games for this host
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false });

      if (gamesError) {
        throw new Error(`Failed to fetch host games: ${gamesError.message}`);
      }

      const allGames = games || [];

      // Separate upcoming and recent games
      const now = new Date();
      const upcomingGames = allGames.filter(game => {
        const gameDate = new Date(game.scheduled_date);
        return gameDate >= now && game.status !== 'completed';
      }).slice(0, 5);

      const recentGames = allGames.filter(game => {
        const gameDate = new Date(game.scheduled_date);
        return gameDate < now || game.status === 'completed';
      }).slice(0, 5);

      // Calculate game stats
      const totalGamesHosted = allGames.length;
      const activeGames = allGames.filter(game =>
        game.status === 'in_progress' || game.status === 'setup'
      ).length;

      // Get team count across all games
      let totalTeams = 0;
      if (allGames.length > 0) {
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('game_id')
          .in('game_id', allGames.map(g => g.id));

        if (teamsError) {
          console.error('Error getting teams:', teamsError);
        }

        totalTeams = teams?.length || 0;
      }
      const averagePlayersPerGame = totalGamesHosted > 0 ?
        Math.round((totalTeams / totalGamesHosted) * 10) / 10 : 0;

      // Get question stats from host_used_questions
      const { data: usedQuestions, error: questionsError } = await supabase
        .from('host_used_questions')
        .select('question_id, questions(category)')
        .eq('host_id', hostId);

      const totalQuestionsUsed = usedQuestions?.length || 0;

      // Calculate favorite categories
      const categoryCount: Record<string, number> = {};
      usedQuestions?.forEach(uq => {
        if (uq.questions?.category) {
          categoryCount[uq.questions.category] = (categoryCount[uq.questions.category] || 0) + 1;
        }
      });

      const favoriteCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // Get available questions by category
      const { data: allQuestions, error: allQuestionsError } = await supabase
        .from('questions')
        .select('category');

      const questionsAvailableByCategory: Record<string, number> = {};
      allQuestions?.forEach(q => {
        if (q.category) {
          questionsAvailableByCategory[q.category] = (questionsAvailableByCategory[q.category] || 0) + 1;
        }
      });

      return {
        upcomingGames: upcomingGames.map(game => this.mapToGame(game)),
        recentGames: recentGames.map(game => this.mapToGame(game)),
        gameStats: {
          totalGamesHosted,
          activeGames,
          totalTeams,
          averagePlayersPerGame
        },
        questionStats: {
          totalQuestionsUsed,
          favoriteCategories,
          questionsAvailableByCategory
        }
      };
    } catch (error) {
      console.error('Error getting host dashboard:', error);
      throw new Error(`Failed to get host dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapToQuestion(data: any): any {
    return {
      id: data.id,
      category: data.category,
      question: data.question,
      a: data.a,
      b: data.b,
      c: data.c,
      d: data.d,
      metadata: data.metadata,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}

export const hostGameService = new HostGameServiceImpl();
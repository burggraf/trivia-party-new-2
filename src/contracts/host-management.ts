// Host Management Contracts
// Type definitions for game management system

import type { Game, Team, Round, Question } from './multi-user-types';
import type { UserProfile } from './game';

// === Role Management ===

export type UserRole = 'host' | 'player';

export interface RoleSelectionRequest {
  userId: string;
  preferredRole: UserRole;
}

export interface RoleSelectionResponse {
  success: boolean;
  userProfile: UserProfile;
  redirectPath: string;
}

// === Enhanced User Profile ===

export interface EnhancedUserProfile extends UserProfile {
  preferred_role?: UserRole;
}

// === Game Management ===

export interface GameConfiguration {
  title: string;
  location?: string;
  scheduled_date: string;
  total_rounds: number;
  questions_per_round: number;
  selected_categories: string[];
  max_teams: number;
  max_players_per_team: number;
  min_players_per_team: number;
  self_registration_enabled: boolean;
}

export interface CreateGameRequest extends GameConfiguration {
  host_id: string;
}

export interface UpdateGameRequest {
  gameId: string;
  updates: Partial<GameConfiguration>;
}

export interface ArchiveGameRequest {
  gameId: string;
  hostId: string;
}

export interface DeleteGameRequest {
  gameId: string;
  hostId: string;
}

export interface GameListFilters {
  status?: Game['status'][];
  archived?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface GameListResponse {
  games: Game[];
  total: number;
  hasMore: boolean;
}

// === Round Management ===

export interface RoundConfiguration {
  round_number: number;
  custom_categories?: string[];
  questions_per_round?: number;
}

export interface UpdateRoundRequest {
  roundId: string;
  configuration: RoundConfiguration;
}

export interface RoundWithQuestions extends Round {
  questions: QuestionAssignment[];
  questionsLoaded: boolean;
}

// === Question Management ===

export interface QuestionAssignment {
  id: string;
  round_id: string;
  question_id: string;
  question_order: number;
  question: Question;
  created_at: string;
}

export interface QuestionGenerationRequest {
  gameId: string;
  hostId: string;
  forceRegenerate?: boolean;
}

export interface QuestionGenerationProgress {
  currentRound: number;
  totalRounds: number;
  questionsAssigned: number;
  questionsTotal: number;
  duplicatesFound: number;
  status: 'processing' | 'completed' | 'error';
  message?: string;
}

export interface QuestionGenerationResponse {
  success: boolean;
  progress: QuestionGenerationProgress;
  duplicatesWarning?: {
    count: number;
    rounds: number[];
    message: string;
  };
}

export interface ReplaceQuestionRequest {
  roundQuestionId: string;
  newQuestionId: string;
  hostId: string;
}

export interface QuestionPreviewRequest {
  roundId: string;
  hostId: string;
}

export interface QuestionPreviewResponse {
  round: RoundWithQuestions;
  replacementOptions: Record<string, Question[]>; // question_id -> alternatives
}

export interface QuestionReplacementOptions {
  originalQuestionId: string;
  alternatives: Question[];
  category: string;
}

// === Team Management ===

export interface TeamConfiguration {
  name: string;
  display_color: string;
  player_ids?: string[];
}

export interface CreateTeamRequest {
  gameId: string;
  hostId: string;
  teamData: TeamConfiguration;
}

export interface UpdateTeamRequest {
  teamId: string;
  hostId: string;
  updates: Partial<TeamConfiguration>;
}

export interface AddPlayerToTeamRequest {
  teamId: string;
  playerId: string;
  hostId: string;
}

export interface RemovePlayerFromTeamRequest {
  teamId: string;
  playerId: string;
  hostId: string;
}

export interface TeamManagementResponse {
  team: Team;
  playerCount: number;
  isValid: boolean;
  validationErrors: string[];
}

// === Game Wizard State ===

export type GameWizardStep = 'basic' | 'rounds' | 'questions' | 'teams' | 'review';

export interface GameWizardState {
  currentStep: GameWizardStep;
  gameData: Partial<GameConfiguration>;
  roundsConfig: RoundConfiguration[];
  questionsGenerated: boolean;
  teamsConfigured: boolean;
  validationErrors: Record<string, string[]>;
  isLoading: boolean;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
  canProceed: boolean;
}

// === Host Dashboard ===

export interface HostDashboardData {
  upcomingGames: Game[];
  recentGames: Game[];
  gameStats: {
    totalGamesHosted: number;
    activeGames: number;
    totalTeams: number;
    averagePlayersPerGame: number;
  };
  questionStats: {
    totalQuestionsUsed: number;
    favoriteCategories: string[];
    questionsAvailableByCategory: Record<string, number>;
  };
}

export interface HostGameSummary {
  id: string;
  title: string;
  scheduled_date: string;
  status: Game['status'];
  team_count: number;
  player_count: number;
  questions_configured: boolean;
  is_complete: boolean;
}

// === Service Interface ===

export interface HostGameService {
  // Role Management
  setUserRole(request: RoleSelectionRequest): Promise<RoleSelectionResponse>;
  getUserRole(userId: string): Promise<UserRole | null>;

  // Game Lifecycle
  createGame(request: CreateGameRequest): Promise<Game>;
  updateGame(request: UpdateGameRequest): Promise<Game>;
  archiveGame(request: ArchiveGameRequest): Promise<void>;
  deleteGame(request: DeleteGameRequest): Promise<void>;
  getHostGames(hostId: string, filters?: GameListFilters): Promise<GameListResponse>;
  getGameDetails(gameId: string, hostId: string): Promise<Game>;

  // Round Management
  updateRoundConfiguration(request: UpdateRoundRequest): Promise<Round>;
  getRoundConfiguration(roundId: string): Promise<RoundConfiguration>;

  // Question Management
  generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse>;
  getQuestionPreview(request: QuestionPreviewRequest): Promise<QuestionPreviewResponse>;
  replaceQuestion(request: ReplaceQuestionRequest): Promise<QuestionAssignment>;
  getReplacementOptions(questionId: string, category: string): Promise<Question[]>;

  // Team Management
  createTeam(request: CreateTeamRequest): Promise<TeamManagementResponse>;
  updateTeam(request: UpdateTeamRequest): Promise<TeamManagementResponse>;
  deleteTeam(teamId: string, hostId: string): Promise<void>;
  addPlayerToTeam(request: AddPlayerToTeamRequest): Promise<TeamManagementResponse>;
  removePlayerFromTeam(request: RemovePlayerFromTeamRequest): Promise<TeamManagementResponse>;
  getGameTeams(gameId: string, hostId: string): Promise<Team[]>;

  // Dashboard Data
  getHostDashboard(hostId: string): Promise<HostDashboardData>;
  getGameSummary(gameId: string, hostId: string): Promise<HostGameSummary>;
}

// === Event Types for Real-time Updates ===

export type HostGameEvent =
  | { type: 'game_created'; game: Game }
  | { type: 'game_updated'; game: Game }
  | { type: 'game_archived'; gameId: string }
  | { type: 'game_deleted'; gameId: string }
  | { type: 'questions_generated'; gameId: string; progress: QuestionGenerationProgress }
  | { type: 'question_replaced'; roundQuestionId: string; newQuestion: Question }
  | { type: 'team_created'; team: Team }
  | { type: 'team_updated'; team: Team }
  | { type: 'team_deleted'; teamId: string }
  | { type: 'player_added_to_team'; teamId: string; playerId: string }
  | { type: 'player_removed_from_team'; teamId: string; playerId: string };

export type HostGameEventCallback = (event: HostGameEvent) => void;
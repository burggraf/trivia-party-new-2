// Multi-User Game Service Contract
// Extends existing GameService with multi-user functionality

import type { GameService } from './game';
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
  StartGameResponse,
  GameStateUpdate,
  GameSummaryResponse,
  GameStatus,
  Question
} from './multi-user-types';

// Extended service interface that includes both single-player and multi-user functionality
export interface ExtendedGameService extends GameService {
  // Multi-User Game Management
  createGame(hostId: string, request: CreateGameRequest): Promise<Game>;
  getGame(gameId: string): Promise<Game | null>;
  getHostGames(hostId: string, status?: GameStatus): Promise<Game[]>;
  updateGame(gameId: string, updates: Partial<Game>): Promise<Game>;
  startMultiUserGame(gameId: string): Promise<StartGameResponse>;
  completeMultiUserGame(gameId: string): Promise<GameSummaryResponse>;

  // Team Management
  createTeam(request: CreateTeamRequest): Promise<Team>;
  getGameTeams(gameId: string): Promise<TeamWithPlayers[]>;
  joinTeam(request: JoinTeamRequest): Promise<TeamPlayer>;
  leaveTeam(teamId: string, playerId: string): Promise<void>;
  getPlayerTeam(gameId: string, playerId: string): Promise<Team | null>;

  // Multi-User Round Management
  createRounds(gameId: string): Promise<Round[]>;
  startRound(roundId: string): Promise<Round>;
  completeRound(roundId: string): Promise<Round>;
  getRoundQuestions(roundId: string): Promise<RoundQuestionDetail[]>;
  getCurrentRound(gameId: string): Promise<Round | null>;

  // Team Answer Management
  submitTeamAnswer(request: SubmitTeamAnswerRequest): Promise<TeamAnswer>;
  getTeamAnswers(teamId: string, roundId?: string): Promise<TeamAnswer[]>;
  getRoundAnswers(roundId: string): Promise<TeamAnswer[]>;

  // Enhanced Question Management for Multi-User
  getAvailableQuestionsForHost(hostId: string, categories: string[], count: number): Promise<Question[]>;
  markQuestionsUsed(hostId: string, questionIds: string[]): Promise<void>;
  getHostUsedQuestions(hostId: string): Promise<string[]>;
  assignQuestionsToRound(roundId: string, questionIds: string[]): Promise<void>;

  // Real-time subscriptions
  subscribeToGameUpdates(gameId: string, callback: (update: GameStateUpdate) => void): () => void;
  subscribeToTeamAnswers(teamId: string, callback: (answer: TeamAnswer) => void): () => void;
  subscribeToRoundUpdates(roundId: string, callback: (round: Round) => void): () => void;

  // Game State Management
  getGameState(gameId: string): Promise<GameStateUpdate>;
  updateGameStatus(gameId: string, status: GameStatus): Promise<Game>;

  // Team Statistics
  getTeamStats(teamId: string): Promise<{
    total_answers: number;
    correct_answers: number;
    accuracy_percentage: number;
    total_points: number;
    average_response_time: number;
  }>;

  // Game Analytics
  getGameAnalytics(gameId: string): Promise<{
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
  }>;
}

// Type guards for distinguishing between single-player and multi-user operations
export const isMultiUserGame = (gameData: any): gameData is Game => {
  return gameData && typeof gameData.host_id === 'string' && typeof gameData.max_teams === 'number';
};

export const isSinglePlayerSession = (sessionData: any): boolean => {
  return sessionData && typeof sessionData.user_id === 'string' && !sessionData.host_id;
};

// Utility types for service method parameters
export type GameIdentifier = {
  type: 'multi-user';
  gameId: string;
} | {
  type: 'single-player';
  sessionId: string;
};

export type PlayerContext = {
  userId: string;
  role: 'host' | 'player';
  teamId?: string;
};

// Event types for real-time updates
export type GameEvent =
  | { type: 'game_started'; game: Game }
  | { type: 'game_completed'; game: Game }
  | { type: 'round_started'; round: Round }
  | { type: 'round_completed'; round: Round }
  | { type: 'team_created'; team: Team }
  | { type: 'player_joined'; teamPlayer: TeamPlayer }
  | { type: 'player_left'; teamPlayer: TeamPlayer }
  | { type: 'answer_submitted'; teamAnswer: TeamAnswer }
  | { type: 'scores_updated'; teams: TeamWithPlayers[] };

export type GameEventCallback = (event: GameEvent) => void;
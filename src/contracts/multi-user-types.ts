// Multi-User Trivia Game Type Definitions
// Extension of existing game contracts for team-based gameplay

export type GameStatus = 'setup' | 'in_progress' | 'completed' | 'cancelled';
export type RoundStatus = 'pending' | 'in_progress' | 'completed';

// Enhanced User Profile with display name
export interface EnhancedUserProfile {
  id: string; // matches auth.users.id
  username: string;
  display_name: string; // New field for TV display
  avatar_url?: string;
  total_games_played: number;
  total_correct_answers: number;
  total_questions_answered: number;
  favorite_categories: string[];
  created_at: string;
  updated_at: string;
}

// Event-based game instance
export interface Game {
  id: string;
  host_id: string;
  title: string;
  location?: string;
  scheduled_date: string; // ISO date
  start_time?: string; // ISO datetime
  end_time?: string; // ISO datetime
  max_teams: number; // default 20
  max_players_per_team: number; // default 4
  status: GameStatus;
  total_rounds: number;
  questions_per_round: number;
  selected_categories: string[];
  created_at: string;
  updated_at: string;
}

// Game-specific team entity
export interface Team {
  id: string;
  game_id: string;
  name: string;
  display_color: string; // hex color
  current_score: number;
  created_at: string;
}

// Team membership tracking
export interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  joined_at: string;
}

// Enhanced team info with player details
export interface TeamWithPlayers {
  id: string;
  game_id: string;
  name: string;
  display_color: string;
  current_score: number;
  created_at: string;
  players: {
    id: string;
    display_name: string;
    avatar_url?: string;
    joined_at: string;
  }[];
}

// Game round entity
export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  status: RoundStatus;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

// Question assignment to rounds
export interface RoundQuestion {
  id: string;
  round_id: string;
  question_id: string;
  question_order: number;
  created_at: string;
}

// Enhanced round question with question details
export interface RoundQuestionDetail {
  id: string;
  round_id: string;
  question_id: string;
  question_order: number;
  question: {
    category: string;
    question: string;
    a: string;
    b: string;
    c: string;
    d: string;
  };
  created_at: string;
}

// Team answer submission
export interface TeamAnswer {
  id: string;
  team_id: string;
  round_question_id: string;
  submitted_by: string; // player_id
  answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  points_earned: number;
  submitted_at: string;
}

// Question usage tracking per host
export interface HostUsedQuestion {
  id: string;
  host_id: string;
  question_id: string;
  used_at: string;
}

// Request/Response Types for API operations

export interface CreateGameRequest {
  title: string;
  location?: string;
  scheduled_date: string;
  start_time?: string;
  end_time?: string;
  max_teams?: number;
  max_players_per_team?: number;
  total_rounds: number;
  questions_per_round: number;
  selected_categories: string[];
}

export interface CreateTeamRequest {
  game_id: string;
  name: string;
  display_color?: string;
}

export interface JoinTeamRequest {
  team_id: string;
  player_id: string;
}

export interface SubmitTeamAnswerRequest {
  team_id: string;
  round_question_id: string;
  answer: 'A' | 'B' | 'C' | 'D';
  submitted_by: string; // player_id
}

export interface StartGameResponse {
  game: Game;
  teams: TeamWithPlayers[];
  first_round: Round;
  first_questions: RoundQuestionDetail[];
}

export interface GameStateUpdate {
  game: Game;
  current_round?: Round;
  teams: TeamWithPlayers[];
  current_question?: RoundQuestionDetail;
  team_answers?: TeamAnswer[];
}

export interface GameSummaryResponse {
  game: Game;
  teams: (TeamWithPlayers & {
    total_score: number;
    correct_answers: number;
    total_questions: number;
    accuracy_percentage: number;
  })[];
  rounds: (Round & {
    team_scores: {
      team_id: string;
      team_name: string;
      round_score: number;
      correct_answers: number;
    }[];
  })[];
  overall_stats: {
    total_questions: number;
    total_correct_answers: number;
    average_accuracy: number;
    duration_ms: number;
  };
}

// Multi-User Game Service Interface
export interface MultiUserGameService {
  // Game Management
  createGame(hostId: string, request: CreateGameRequest): Promise<Game>;
  getGame(gameId: string): Promise<Game | null>;
  getHostGames(hostId: string, status?: GameStatus): Promise<Game[]>;
  updateGame(gameId: string, updates: Partial<Game>): Promise<Game>;
  startGame(gameId: string): Promise<StartGameResponse>;
  completeGame(gameId: string): Promise<GameSummaryResponse>;

  // Team Management
  createTeam(request: CreateTeamRequest): Promise<Team>;
  getGameTeams(gameId: string): Promise<TeamWithPlayers[]>;
  joinTeam(request: JoinTeamRequest): Promise<TeamPlayer>;
  leaveTeam(teamId: string, playerId: string): Promise<void>;
  getPlayerTeam(gameId: string, playerId: string): Promise<Team | null>;

  // Round Management
  startRound(roundId: string): Promise<Round>;
  completeRound(roundId: string): Promise<Round>;
  getRoundQuestions(roundId: string): Promise<RoundQuestionDetail[]>;

  // Answer Management
  submitTeamAnswer(request: SubmitTeamAnswerRequest): Promise<TeamAnswer>;
  getTeamAnswers(teamId: string, roundId?: string): Promise<TeamAnswer[]>;
  getRoundAnswers(roundId: string): Promise<TeamAnswer[]>;

  // Question Management
  getAvailableQuestions(hostId: string, categories: string[], count: number): Promise<Question[]>;
  markQuestionsUsed(hostId: string, questionIds: string[]): Promise<void>;
  getHostUsedQuestions(hostId: string): Promise<string[]>;

  // Real-time subscriptions
  subscribeToGameUpdates(gameId: string, callback: (update: GameStateUpdate) => void): () => void;
  subscribeToTeamAnswers(teamId: string, callback: (answer: TeamAnswer) => void): () => void;
}

// Import existing Question type
export interface Question {
  id: string;
  category: string;
  question: string;
  a: string; // correct answer
  b: string;
  c: string;
  d: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
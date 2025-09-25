// Game API Contract
// Database operations for game functionality using Supabase client

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

export interface UserProfile {
  id: string; // matches auth.users.id
  username: string;
  avatar_url?: string;
  total_games_played: number;
  total_correct_answers: number;
  total_questions_answered: number;
  favorite_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  status: 'setup' | 'in_progress' | 'paused' | 'completed';
  total_rounds: number;
  questions_per_round: number;
  selected_categories: string[];
  current_round: number;
  current_question_index: number;
  total_score: number;
  start_time?: string;
  end_time?: string;
  total_duration_ms?: number;
  created_at: string;
  updated_at: string;
}

export interface GameRound {
  id: string;
  game_session_id: string;
  round_number: number;
  categories: string[];
  questions_count: number;
  correct_answers: number;
  round_score: number;
  start_time?: string;
  end_time?: string;
  duration_ms?: number;
  created_at: string;
}

export interface GameQuestion {
  id: string;
  game_session_id: string;
  game_round_id: string;
  question_id: string;
  question_order: number;
  presented_answers: { label: string; text: string }[]; // randomized order
  user_answer?: string;
  correct_answer: string;
  is_correct?: boolean;
  time_to_answer_ms?: number;
  answered_at?: string;
  created_at: string;
}

// Request/Response Types
export interface CreateGameSessionRequest {
  total_rounds: number;
  questions_per_round: number;
  selected_categories: string[];
}

export interface StartGameResponse {
  session: GameSession;
  first_question: QuestionPresentation;
}

export interface QuestionPresentation {
  id: string;
  question: string;
  category: string;
  answers: { label: string; text: string }[]; // A, B, C, D with randomized content
  round_number: number;
  question_number: number;
  total_questions: number;
}

export interface SubmitAnswerRequest {
  game_session_id: string;
  game_question_id: string;
  user_answer: string;
  time_to_answer_ms: number;
}

export interface SubmitAnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  explanation?: string;
  updated_score: number;
  next_question?: QuestionPresentation;
  round_complete?: boolean;
  game_complete?: boolean;
}

export interface RoundSummary {
  round_number: number;
  correct_answers: number;
  total_questions: number;
  round_score: number;
  duration_ms: number;
  accuracy_percentage: number;
}

export interface GameSummary {
  game_session_id: string;
  total_score: number;
  total_questions: number;
  correct_answers: number;
  accuracy_percentage: number;
  total_duration_ms: number;
  rounds: RoundSummary[];
  personal_best: boolean;
}

// Expected Game Service Methods
export interface GameService {
  // Profile Management
  getUserProfile(userId: string): Promise<UserProfile | null>;
  createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;

  // Question Management
  getAvailableCategories(): Promise<string[]>;
  getQuestionsForSession(categories: string[], count: number, excludeIds?: string[]): Promise<Question[]>;

  // Game session Management
  createGameSession(userId: string, request: CreateGameSessionRequest): Promise<GameSession>;
  getGameSession(sessionId: string): Promise<GameSession | null>;
  getUserGameSessions(userId: string, status?: GameSession['status']): Promise<GameSession[]>;
  updateGameSession(sessionId: string, updates: Partial<GameSession>): Promise<GameSession>;

  // Game Flow
  startGame(sessionId: string): Promise<StartGameResponse>;
  getNextQuestion(sessionId: string): Promise<QuestionPresentation | null>;
  submitAnswer(request: SubmitAnswerRequest): Promise<SubmitAnswerResponse>;
  pauseGame(sessionId: string): Promise<GameSession>;
  resumeGame(sessionId: string): Promise<QuestionPresentation>;
  completeGame(sessionId: string): Promise<GameSummary>;

  // Statistics
  getGameSummary(sessionId: string): Promise<GameSummary>;
  getUserStats(userId: string): Promise<{
    total_games: number;
    total_score: number;
    average_accuracy: number;
    favorite_category: string;
    recent_games: GameSession[];
  }>;
}
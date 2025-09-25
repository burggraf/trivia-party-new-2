// Database Edge Functions Contract
// Supabase edge functions for complex game logic

import type { UserProfile, GameSession, GameSummary } from './game';

export interface CreateGameSetupRequest {
  user_id: string;
  total_rounds: number;
  questions_per_round: number;
  selected_categories: string[];
}

export interface CreateGameSetupResponse {
  game_session_id: string;
  rounds: Array<{
    round_id: string;
    round_number: number;
    categories: string[];
    questions: Array<{
      question_id: string;
      question_order: number;
      question: string;
      category: string;
      presented_answers: { label: string; text: string }[];
    }>;
  }>;
}

export interface ValidateAnswerRequest {
  game_question_id: string;
  user_answer: string;
  time_to_answer_ms: number;
}

export interface ValidateAnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  game_question_updated?: boolean;
  session_stats: {
    current_score: number;
    current_round?: number;
    current_question_index?: number;
    round_complete: boolean;
    game_complete: boolean;
  };
  next_question?: {
    id: string;
    question: string;
    category: string;
    answers: string[];
    round_number: number;
    question_number: number;
    total_questions: number;
  };
}

export interface GetUserStatsRequest {
  user_id: string;
}

export interface GetUserStatsResponse {
  profile: UserProfile;
  recent_games: GameSession[];
  statistics: {
    total_games_played: number;
    total_questions_answered: number;
    total_correct_answers: number;
    average_accuracy: number;
    best_streak: number;
    favorite_categories: Array<{
      category: string;
      games_played: number;
      accuracy: number;
    }>;
  };
}

// Edge Function Service interface
export interface DatabaseService {
  // POST /functions/v1/create-game-setup
  createGameSetup(request: CreateGameSetupRequest): Promise<CreateGameSetupResponse>;

  // POST /functions/v1/validate-answer
  validateAnswer(request: ValidateAnswerRequest): Promise<ValidateAnswerResponse>;

  // POST /functions/v1/complete-game
  completeGame(request: { game_session_id: string }): Promise<{
    session: GameSession;
    summary: GameSummary;
    profile_updated: boolean;
  }>;

  // GET /functions/v1/user-stats?user_id={id}
  getUserStats(request: GetUserStatsRequest): Promise<GetUserStatsResponse>;

  // POST /functions/v1/cleanup-abandoned-games
  cleanupAbandonedGames(request: { user_id: string; older_than_hours: number }): Promise<{
    cleaned_sessions: number;
  }>;
}

// Legacy name for compatibility with tests
export interface EdgeFunctionService extends DatabaseService {}
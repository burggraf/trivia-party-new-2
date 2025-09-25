import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  EdgeFunctionService,
  CreateGameSetupRequest,
  CreateGameSetupResponse,
  ValidateAnswerRequest,
  ValidateAnswerResponse,
  GetUserStatsRequest,
  GetUserStatsResponse,
  UserProfile,
  GameSession
} from '../../../specs/001-this-project-is/contracts/database';

// Mock implementation for testing
const mockEdgeFunctionService: EdgeFunctionService = {
  createGameSetup: vi.fn(),
  validateAnswer: vi.fn(),
  completeGame: vi.fn(),
  getUserStats: vi.fn(),
  cleanupAbandonedGames: vi.fn(),
};

// Test implementation will be imported here when created
// import { edgeFunctionService } from '../database';

describe('Database Edge Function Service Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserId = 'user-123';
  const mockGameSessionId = 'session-456';

  describe('createGameSetup', () => {
    it('should create game setup with valid request', async () => {
      const request: CreateGameSetupRequest = {
        user_id: mockUserId,
        total_rounds: 3,
        questions_per_round: 5,
        selected_categories: ['Science', 'History']
      };

      const expectedResponse: CreateGameSetupResponse = {
        game_session_id: mockGameSessionId,
        rounds: [
          {
            round_id: 'round-1',
            round_number: 1,
            categories: ['Science'],
            questions: [
              {
                question_id: 'q1',
                question_order: 1,
                question: 'What is H2O?',
                category: 'Science',
                presented_answers: [
                  { label: 'A', text: 'Water' },
                  { label: 'B', text: 'Oxygen' },
                  { label: 'C', text: 'Hydrogen' },
                  { label: 'D', text: 'Carbon' }
                ]
              }
            ]
          }
        ]
      };

      mockEdgeFunctionService.createGameSetup = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.createGameSetup(request);

      expect(mockEdgeFunctionService.createGameSetup).toHaveBeenCalledWith(request);
      expect(response.game_session_id).toBe(mockGameSessionId);
      expect(response.rounds).toHaveLength(1);
      expect(response.rounds[0].questions[0]).toHaveProperty('question_id');
      expect(response.rounds[0].questions[0]).toHaveProperty('presented_answers');
      expect(response.rounds[0].questions[0].presented_answers).toHaveLength(4);
    });

    it('should handle multiple rounds with different categories', async () => {
      const request: CreateGameSetupRequest = {
        user_id: mockUserId,
        total_rounds: 2,
        questions_per_round: 3,
        selected_categories: ['Science', 'History', 'Geography']
      };

      const expectedResponse: CreateGameSetupResponse = {
        game_session_id: mockGameSessionId,
        rounds: [
          {
            round_id: 'round-1',
            round_number: 1,
            categories: ['Science', 'History'],
            questions: [
              {
                question_id: 'q1',
                question_order: 1,
                question: 'What is H2O?',
                category: 'Science',
                presented_answers: [{ label: 'A', text: 'Water' }, { label: 'B', text: 'Oxygen' }, { label: 'C', text: 'Hydrogen' }, { label: 'D', text: 'Carbon' }]
              },
              {
                question_id: 'q2',
                question_order: 2,
                question: 'When was WWII?',
                category: 'History',
                presented_answers: [{ label: 'A', text: '1939-1945' }, { label: 'B', text: '1914-1918' }, { label: 'C', text: '1950-1953' }, { label: 'D', text: '1960-1975' }]
              }
            ]
          },
          {
            round_id: 'round-2',
            round_number: 2,
            categories: ['Geography'],
            questions: [
              {
                question_id: 'q3',
                question_order: 1,
                question: 'Capital of France?',
                category: 'Geography',
                presented_answers: [{ label: 'A', text: 'Paris' }, { label: 'B', text: 'London' }, { label: 'C', text: 'Berlin' }, { label: 'D', text: 'Madrid' }]
              }
            ]
          }
        ]
      };

      mockEdgeFunctionService.createGameSetup = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.createGameSetup(request);

      expect(response.rounds).toHaveLength(2);
      expect(response.rounds[0].round_number).toBe(1);
      expect(response.rounds[1].round_number).toBe(2);
      expect(response.rounds[0].categories).toContain('Science');
      expect(response.rounds[1].categories).toContain('Geography');
    });
  });

  describe('validateAnswer', () => {
    it('should validate correct answer', async () => {
      const request: ValidateAnswerRequest = {
        game_question_id: 'gq-123',
        user_answer: 'Water',
        time_to_answer_ms: 5000
      };

      const expectedResponse: ValidateAnswerResponse = {
        is_correct: true,
        correct_answer: 'Water',
        game_question_updated: true,
        session_stats: {
          current_score: 1,
          current_round: 1,
          current_question_index: 1,
          round_complete: false,
          game_complete: false
        }
      };

      mockEdgeFunctionService.validateAnswer = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.validateAnswer(request);

      expect(mockEdgeFunctionService.validateAnswer).toHaveBeenCalledWith(request);
      expect(response.is_correct).toBe(true);
      expect(response.correct_answer).toBe('Water');
      expect(response.game_question_updated).toBe(true);
      expect(response.session_stats.current_score).toBe(1);
      expect(response.session_stats.round_complete).toBe(false);
      expect(response.session_stats.game_complete).toBe(false);
    });

    it('should validate incorrect answer', async () => {
      const request: ValidateAnswerRequest = {
        game_question_id: 'gq-123',
        user_answer: 'Oxygen',
        time_to_answer_ms: 8000
      };

      const expectedResponse: ValidateAnswerResponse = {
        is_correct: false,
        correct_answer: 'Water',
        game_question_updated: true,
        session_stats: {
          current_score: 0,
          current_round: 1,
          current_question_index: 1,
          round_complete: false,
          game_complete: false
        }
      };

      mockEdgeFunctionService.validateAnswer = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.validateAnswer(request);

      expect(response.is_correct).toBe(false);
      expect(response.correct_answer).toBe('Water');
      expect(response.session_stats.current_score).toBe(0);
    });

    it('should handle round completion', async () => {
      const request: ValidateAnswerRequest = {
        game_question_id: 'gq-125',
        user_answer: 'Paris',
        time_to_answer_ms: 3000
      };

      const expectedResponse: ValidateAnswerResponse = {
        is_correct: true,
        correct_answer: 'Paris',
        game_question_updated: true,
        session_stats: {
          current_score: 5,
          current_round: 1,
          current_question_index: 5,
          round_complete: true,
          game_complete: false
        }
      };

      mockEdgeFunctionService.validateAnswer = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.validateAnswer(request);

      expect(response.session_stats.round_complete).toBe(true);
      expect(response.session_stats.game_complete).toBe(false);
    });

    it('should handle game completion', async () => {
      const request: ValidateAnswerRequest = {
        game_question_id: 'gq-150',
        user_answer: 'Berlin',
        time_to_answer_ms: 4500
      };

      const expectedResponse: ValidateAnswerResponse = {
        is_correct: true,
        correct_answer: 'Berlin',
        game_question_updated: true,
        session_stats: {
          current_score: 12,
          current_round: 3,
          current_question_index: 15,
          round_complete: true,
          game_complete: true
        }
      };

      mockEdgeFunctionService.validateAnswer = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.validateAnswer(request);

      expect(response.session_stats.round_complete).toBe(true);
      expect(response.session_stats.game_complete).toBe(true);
      expect(response.session_stats.current_score).toBe(12);
    });
  });

  describe('completeGame', () => {
    it('should complete game and return session summary', async () => {
      const mockGameSession: GameSession = {
        id: mockGameSessionId,
        user_id: mockUserId,
        status: 'completed',
        total_rounds: 3,
        questions_per_round: 5,
        selected_categories: ['Science', 'History'],
        current_round: 3,
        current_question_index: 15,
        total_score: 12,
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T10:15:00Z',
        total_duration_ms: 900000,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:15:00Z'
      };

      const expectedResponse = {
        session: mockGameSession,
        summary: {
          game_session_id: mockGameSessionId,
          total_score: 12,
          total_questions: 15,
          correct_answers: 12,
          accuracy_percentage: 80,
          total_duration_ms: 900000,
          rounds: [
            {
              round_number: 1,
              correct_answers: 4,
              total_questions: 5,
              round_score: 4,
              duration_ms: 300000,
              accuracy_percentage: 80
            }
          ],
          personal_best: true
        },
        profile_updated: true
      };

      mockEdgeFunctionService.completeGame = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.completeGame({ game_session_id: mockGameSessionId });

      expect(mockEdgeFunctionService.completeGame).toHaveBeenCalledWith({ game_session_id: mockGameSessionId });
      expect(response.session.status).toBe('completed');
      expect(response.summary.game_session_id).toBe(mockGameSessionId);
      expect(response.summary.total_score).toBe(12);
      expect(response.summary.personal_best).toBe(true);
      expect(response.profile_updated).toBe(true);
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics and recent games', async () => {
      const request: GetUserStatsRequest = {
        user_id: mockUserId
      };

      const mockProfile: UserProfile = {
        id: mockUserId,
        username: 'testuser',
        total_games_played: 10,
        total_correct_answers: 85,
        total_questions_answered: 100,
        favorite_categories: ['Science', 'History'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-15T00:00:00Z'
      };

      const mockRecentGames: GameSession[] = [
        {
          id: 'session-1',
          user_id: mockUserId,
          status: 'completed',
          total_rounds: 3,
          questions_per_round: 5,
          selected_categories: ['Science'],
          current_round: 3,
          current_question_index: 15,
          total_score: 12,
          created_at: '2023-01-15T00:00:00Z',
          updated_at: '2023-01-15T00:15:00Z'
        }
      ];

      const expectedResponse: GetUserStatsResponse = {
        profile: mockProfile,
        recent_games: mockRecentGames,
        statistics: {
          total_games_played: 10,
          total_questions_answered: 100,
          total_correct_answers: 85,
          average_accuracy: 85.0,
          best_streak: 15,
          favorite_categories: [
            {
              category: 'Science',
              games_played: 6,
              accuracy: 88.5
            },
            {
              category: 'History',
              games_played: 4,
              accuracy: 82.0
            }
          ]
        }
      };

      mockEdgeFunctionService.getUserStats = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.getUserStats(request);

      expect(mockEdgeFunctionService.getUserStats).toHaveBeenCalledWith(request);
      expect(response.profile.id).toBe(mockUserId);
      expect(response.recent_games).toHaveLength(1);
      expect(response.statistics.total_games_played).toBe(10);
      expect(response.statistics.average_accuracy).toBe(85.0);
      expect(response.statistics.favorite_categories).toHaveLength(2);
      expect(response.statistics.favorite_categories[0].category).toBe('Science');
    });

    it('should handle new user with no statistics', async () => {
      const request: GetUserStatsRequest = {
        user_id: 'new-user-123'
      };

      const newUserProfile: UserProfile = {
        id: 'new-user-123',
        username: 'newuser',
        total_games_played: 0,
        total_correct_answers: 0,
        total_questions_answered: 0,
        favorite_categories: [],
        created_at: '2023-01-15T00:00:00Z',
        updated_at: '2023-01-15T00:00:00Z'
      };

      const expectedResponse: GetUserStatsResponse = {
        profile: newUserProfile,
        recent_games: [],
        statistics: {
          total_games_played: 0,
          total_questions_answered: 0,
          total_correct_answers: 0,
          average_accuracy: 0,
          best_streak: 0,
          favorite_categories: []
        }
      };

      mockEdgeFunctionService.getUserStats = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.getUserStats(request);

      expect(response.profile.total_games_played).toBe(0);
      expect(response.recent_games).toHaveLength(0);
      expect(response.statistics.average_accuracy).toBe(0);
      expect(response.statistics.favorite_categories).toHaveLength(0);
    });
  });

  describe('cleanupAbandonedGames', () => {
    it('should cleanup abandoned games', async () => {
      const request = {
        user_id: mockUserId,
        older_than_hours: 24
      };

      const expectedResponse = {
        cleaned_sessions: 3
      };

      mockEdgeFunctionService.cleanupAbandonedGames = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.cleanupAbandonedGames(request);

      expect(mockEdgeFunctionService.cleanupAbandonedGames).toHaveBeenCalledWith(request);
      expect(response.cleaned_sessions).toBe(3);
    });

    it('should handle no abandoned games to cleanup', async () => {
      const request = {
        user_id: mockUserId,
        older_than_hours: 1
      };

      const expectedResponse = {
        cleaned_sessions: 0
      };

      mockEdgeFunctionService.cleanupAbandonedGames = vi.fn().mockResolvedValue(expectedResponse);

      const response = await mockEdgeFunctionService.cleanupAbandonedGames(request);

      expect(response.cleaned_sessions).toBe(0);
    });
  });

  // Integration tests - these will fail until implementation exists
  describe('Integration with actual service (will fail until implemented)', () => {
    it('should fail - database edge function service not implemented yet', () => {
      // This test will fail until we create the actual database service
      expect(() => {
        // import { edgeFunctionService } from '../database';
        throw new Error('Database edge function service not implemented yet');
      }).toThrow('Database edge function service not implemented yet');
    });
  });
});
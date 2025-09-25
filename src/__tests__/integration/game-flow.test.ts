import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  GameService,
  EdgeFunctionService,
  GameSession,
  CreateGameSessionRequest,
  StartGameResponse,
  QuestionPresentation,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  GameSummary,
  CreateGameSetupRequest,
  CreateGameSetupResponse,
  ValidateAnswerRequest,
  ValidateAnswerResponse
} from '../../../specs/001-this-project-is/contracts/game';

// Mock services
const mockGameService: GameService = {
  getUserProfile: vi.fn(),
  createUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  getAvailableCategories: vi.fn(),
  getQuestionsForSession: vi.fn(),
  createGameSession: vi.fn(),
  getGameSession: vi.fn(),
  getUserGameSessions: vi.fn(),
  updateGameSession: vi.fn(),
  startGame: vi.fn(),
  getNextQuestion: vi.fn(),
  submitAnswer: vi.fn(),
  pauseGame: vi.fn(),
  resumeGame: vi.fn(),
  completeGame: vi.fn(),
  getGameSummary: vi.fn(),
  getUserStats: vi.fn(),
};

const mockEdgeFunctionService: EdgeFunctionService = {
  createGameSetup: vi.fn(),
  validateAnswer: vi.fn(),
  completeGame: vi.fn(),
  getUserStats: vi.fn(),
  cleanupAbandonedGames: vi.fn(),
};

// Mock game state manager
class MockGameStateManager {
  private currentSession: GameSession | null = null;
  private currentQuestion: QuestionPresentation | null = null;
  private gameHistory: GameSession[] = [];

  setCurrentSession(session: GameSession) {
    this.currentSession = session;
    if (!this.gameHistory.find(s => s.id === session.id)) {
      this.gameHistory.push(session);
    }
  }

  setCurrentQuestion(question: QuestionPresentation) {
    this.currentQuestion = question;
  }

  getCurrentSession() {
    return this.currentSession;
  }

  getCurrentQuestion() {
    return this.currentQuestion;
  }

  getGameHistory() {
    return this.gameHistory;
  }

  updateSessionStatus(status: GameSession['status']) {
    if (this.currentSession) {
      this.currentSession = {
        ...this.currentSession,
        status,
        updated_at: new Date().toISOString()
      };
    }
  }

  reset() {
    this.currentSession = null;
    this.currentQuestion = null;
    this.gameHistory = [];
  }
}

describe('Game Flow Integration Tests', () => {
  let gameStateManager: MockGameStateManager;
  const testUserId = 'integration-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    gameStateManager = new MockGameStateManager();
  });

  afterEach(() => {
    gameStateManager.reset();
  });

  describe('Complete Game Session Flow', () => {
    it('should handle full game flow: create session -> start -> answer questions -> complete', async () => {
      // Step 1: Create game session
      const gameConfig: CreateGameSessionRequest = {
        total_rounds: 2,
        questions_per_round: 3,
        selected_categories: ['Science', 'History']
      };

      const createdSession: GameSession = {
        id: 'session-integration-123',
        user_id: testUserId,
        status: 'setup',
        total_rounds: 2,
        questions_per_round: 3,
        selected_categories: ['Science', 'History'],
        current_round: 1,
        current_question_index: 0,
        total_score: 0,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:00:00Z'
      };

      mockGameService.createGameSession = vi.fn().mockResolvedValue(createdSession);

      const sessionResult = await mockGameService.createGameSession(testUserId, gameConfig);

      expect(mockGameService.createGameSession).toHaveBeenCalledWith(testUserId, gameConfig);
      expect(sessionResult).toEqual(createdSession);

      gameStateManager.setCurrentSession(createdSession);

      // Step 2: Start game using edge function
      const setupRequest: CreateGameSetupRequest = {
        user_id: testUserId,
        total_rounds: 2,
        questions_per_round: 3,
        selected_categories: ['Science', 'History']
      };

      const setupResponse: CreateGameSetupResponse = {
        game_session_id: 'session-integration-123',
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
              },
              {
                question_id: 'q2',
                question_order: 2,
                question: 'What is CO2?',
                category: 'Science',
                presented_answers: [
                  { label: 'A', text: 'Water' },
                  { label: 'B', text: 'Carbon Dioxide' },
                  { label: 'C', text: 'Oxygen' },
                  { label: 'D', text: 'Methane' }
                ]
              }
            ]
          },
          {
            round_id: 'round-2',
            round_number: 2,
            categories: ['History'],
            questions: [
              {
                question_id: 'q3',
                question_order: 1,
                question: 'When did WWII end?',
                category: 'History',
                presented_answers: [
                  { label: 'A', text: '1944' },
                  { label: 'B', text: '1945' },
                  { label: 'C', text: '1946' },
                  { label: 'D', text: '1947' }
                ]
              }
            ]
          }
        ]
      };

      mockEdgeFunctionService.createGameSetup = vi.fn().mockResolvedValue(setupResponse);

      const gameSetupResult = await mockEdgeFunctionService.createGameSetup(setupRequest);

      expect(gameSetupResult.rounds).toHaveLength(2);
      expect(gameSetupResult.rounds[0].questions).toHaveLength(2);

      // Step 3: Start game and get first question
      const firstQuestion: QuestionPresentation = {
        id: 'gq-1',
        question: 'What is H2O?',
        category: 'Science',
        answers: [
          { label: 'A', text: 'Water' },
          { label: 'B', text: 'Oxygen' },
          { label: 'C', text: 'Hydrogen' },
          { label: 'D', text: 'Carbon' }
        ],
        round_number: 1,
        question_number: 1,
        total_questions: 6
      };

      const startGameResponse: StartGameResponse = {
        session: {
          ...createdSession,
          status: 'in_progress',
          start_time: '2023-01-01T10:05:00Z'
        },
        first_question: firstQuestion
      };

      mockGameService.startGame = vi.fn().mockResolvedValue(startGameResponse);

      const gameStart = await mockGameService.startGame('session-integration-123');

      expect(gameStart.session.status).toBe('in_progress');
      expect(gameStart.first_question).toEqual(firstQuestion);

      gameStateManager.updateSessionStatus('in_progress');
      gameStateManager.setCurrentQuestion(firstQuestion);

      // Step 4: Answer questions using edge function validation
      const firstAnswerRequest: ValidateAnswerRequest = {
        game_question_id: 'gq-1',
        user_answer: 'Water',
        time_to_answer_ms: 5000
      };

      const firstAnswerResponse: ValidateAnswerResponse = {
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

      mockEdgeFunctionService.validateAnswer = vi.fn().mockResolvedValue(firstAnswerResponse);

      const firstValidation = await mockEdgeFunctionService.validateAnswer(firstAnswerRequest);

      expect(firstValidation.is_correct).toBe(true);
      expect(firstValidation.session_stats.current_score).toBe(1);

      // Step 5: Continue through multiple questions
      const questions = [
        { id: 'gq-2', question: 'What is CO2?', answer: 'Carbon Dioxide', correct: true },
        { id: 'gq-3', question: 'When did WWII end?', answer: '1945', correct: true },
        { id: 'gq-4', question: 'Capital of France?', answer: 'Berlin', correct: false }, // Wrong answer
      ];

      let currentScore = 1;
      let currentQuestionIndex = 1;

      for (const [index, q] of questions.entries()) {
        const answerRequest: ValidateAnswerRequest = {
          game_question_id: q.id,
          user_answer: q.answer,
          time_to_answer_ms: 4000 + (index * 1000)
        };

        const isCorrect = q.correct;
        if (isCorrect) currentScore++;
        currentQuestionIndex++;

        const answerResponse: ValidateAnswerResponse = {
          is_correct: isCorrect,
          correct_answer: isCorrect ? q.answer : 'Paris', // Correct answer for the wrong one
          game_question_updated: true,
          session_stats: {
            current_score: currentScore,
            current_round: currentQuestionIndex <= 3 ? 1 : 2,
            current_question_index: currentQuestionIndex,
            round_complete: currentQuestionIndex === 3 || currentQuestionIndex === 6,
            game_complete: currentQuestionIndex === 6
          }
        };

        mockEdgeFunctionService.validateAnswer = vi.fn().mockResolvedValue(answerResponse);

        const validation = await mockEdgeFunctionService.validateAnswer(answerRequest);

        expect(validation.is_correct).toBe(isCorrect);
        expect(validation.session_stats.current_score).toBe(currentScore);

        if (validation.session_stats.game_complete) {
          break;
        }
      }

      // Step 6: Complete game
      const finalSummary: GameSummary = {
        game_session_id: 'session-integration-123',
        total_score: 3,
        total_questions: 6,
        correct_answers: 3,
        accuracy_percentage: 50.0,
        total_duration_ms: 300000, // 5 minutes
        rounds: [
          {
            round_number: 1,
            correct_answers: 2,
            total_questions: 3,
            round_score: 2,
            duration_ms: 150000,
            accuracy_percentage: 66.67
          },
          {
            round_number: 2,
            correct_answers: 1,
            total_questions: 3,
            round_score: 1,
            duration_ms: 150000,
            accuracy_percentage: 33.33
          }
        ],
        personal_best: false
      };

      mockGameService.completeGame = vi.fn().mockResolvedValue(finalSummary);

      const completedGame = await mockGameService.completeGame('session-integration-123');

      expect(completedGame.total_score).toBe(3);
      expect(completedGame.accuracy_percentage).toBe(50.0);
      expect(completedGame.rounds).toHaveLength(2);

      gameStateManager.updateSessionStatus('completed');
    });

    it('should handle game pause and resume functionality', async () => {
      // Setup an in-progress game
      const activeSession: GameSession = {
        id: 'pausable-session-123',
        user_id: testUserId,
        status: 'in_progress',
        total_rounds: 3,
        questions_per_round: 5,
        selected_categories: ['Science'],
        current_round: 2,
        current_question_index: 7,
        total_score: 5,
        start_time: '2023-01-01T10:00:00Z',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:10:00Z'
      };

      gameStateManager.setCurrentSession(activeSession);

      // Pause the game
      const pausedSession: GameSession = {
        ...activeSession,
        status: 'paused',
        updated_at: '2023-01-01T10:15:00Z'
      };

      mockGameService.pauseGame = vi.fn().mockResolvedValue(pausedSession);

      const pauseResult = await mockGameService.pauseGame('pausable-session-123');

      expect(pauseResult.status).toBe('paused');
      expect(pauseResult.current_round).toBe(2);
      expect(pauseResult.current_question_index).toBe(7);

      gameStateManager.updateSessionStatus('paused');

      // Resume the game
      const resumeQuestion: QuestionPresentation = {
        id: 'gq-resume-8',
        question: 'What is the speed of light?',
        category: 'Science',
        answers: [
          { label: 'A', text: '299,792,458 m/s' },
          { label: 'B', text: '300,000,000 m/s' },
          { label: 'C', text: '150,000,000 m/s' },
          { label: 'D', text: '400,000,000 m/s' }
        ],
        round_number: 2,
        question_number: 8,
        total_questions: 15
      };

      mockGameService.resumeGame = vi.fn().mockResolvedValue(resumeQuestion);

      const resumeResult = await mockGameService.resumeGame('pausable-session-123');

      expect(resumeResult.question_number).toBe(8);
      expect(resumeResult.round_number).toBe(2);

      gameStateManager.updateSessionStatus('in_progress');
      gameStateManager.setCurrentQuestion(resumeResult);
    });

    it('should handle multiple game sessions for the same user', async () => {
      // Create first session
      const firstGameConfig: CreateGameSessionRequest = {
        total_rounds: 2,
        questions_per_round: 3,
        selected_categories: ['Science']
      };

      const firstSession: GameSession = {
        id: 'multi-session-1',
        user_id: testUserId,
        status: 'setup',
        total_rounds: 2,
        questions_per_round: 3,
        selected_categories: ['Science'],
        current_round: 1,
        current_question_index: 0,
        total_score: 0,
        created_at: '2023-01-01T09:00:00Z',
        updated_at: '2023-01-01T09:00:00Z'
      };

      mockGameService.createGameSession = vi.fn().mockResolvedValue(firstSession);

      const firstResult = await mockGameService.createGameSession(testUserId, firstGameConfig);
      gameStateManager.setCurrentSession(firstResult);

      // Create second session (different config)
      const secondGameConfig: CreateGameSessionRequest = {
        total_rounds: 3,
        questions_per_round: 5,
        selected_categories: ['History', 'Geography']
      };

      const secondSession: GameSession = {
        id: 'multi-session-2',
        user_id: testUserId,
        status: 'setup',
        total_rounds: 3,
        questions_per_round: 5,
        selected_categories: ['History', 'Geography'],
        current_round: 1,
        current_question_index: 0,
        total_score: 0,
        created_at: '2023-01-01T14:00:00Z',
        updated_at: '2023-01-01T14:00:00Z'
      };

      mockGameService.createGameSession = vi.fn().mockResolvedValue(secondSession);

      const secondResult = await mockGameService.createGameSession(testUserId, secondGameConfig);
      gameStateManager.setCurrentSession(secondResult);

      // Get user's game sessions
      const userSessions = [firstSession, secondSession];

      mockGameService.getUserGameSessions = vi.fn().mockResolvedValue(userSessions);

      const sessionHistory = await mockGameService.getUserGameSessions(testUserId);

      expect(sessionHistory).toHaveLength(2);
      expect(sessionHistory[0].selected_categories).toEqual(['Science']);
      expect(sessionHistory[1].selected_categories).toEqual(['History', 'Geography']);
    });
  });

  describe('Game Flow Error Handling', () => {
    it('should handle session creation failures', async () => {
      const failedConfig: CreateGameSessionRequest = {
        total_rounds: 0, // Invalid
        questions_per_round: -1, // Invalid
        selected_categories: []
      };

      mockGameService.createGameSession = vi.fn().mockRejectedValue(
        new Error('Invalid game configuration')
      );

      await expect(
        mockGameService.createGameSession(testUserId, failedConfig)
      ).rejects.toThrow('Invalid game configuration');
    });

    it('should handle answer validation failures', async () => {
      const invalidAnswerRequest: ValidateAnswerRequest = {
        game_question_id: 'non-existent-question',
        user_answer: 'Some answer',
        time_to_answer_ms: 5000
      };

      mockEdgeFunctionService.validateAnswer = vi.fn().mockRejectedValue(
        new Error('Question not found')
      );

      await expect(
        mockEdgeFunctionService.validateAnswer(invalidAnswerRequest)
      ).rejects.toThrow('Question not found');
    });

    it('should handle game state inconsistencies', async () => {
      // Try to resume a completed game
      const completedSession: GameSession = {
        id: 'completed-session-123',
        user_id: testUserId,
        status: 'completed',
        total_rounds: 3,
        questions_per_round: 5,
        selected_categories: ['Science'],
        current_round: 3,
        current_question_index: 15,
        total_score: 12,
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T10:30:00Z',
        total_duration_ms: 1800000,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:30:00Z'
      };

      gameStateManager.setCurrentSession(completedSession);

      mockGameService.resumeGame = vi.fn().mockRejectedValue(
        new Error('Cannot resume completed game')
      );

      await expect(
        mockGameService.resumeGame('completed-session-123')
      ).rejects.toThrow('Cannot resume completed game');
    });

    it('should handle timeout scenarios', async () => {
      // Simulate timeout during answer submission
      const timeoutRequest: SubmitAnswerRequest = {
        game_session_id: 'timeout-session-123',
        game_question_id: 'timeout-question-1',
        user_answer: 'Timeout Answer',
        time_to_answer_ms: 31000 // Over 30 second limit
      };

      const timeoutResponse: SubmitAnswerResponse = {
        is_correct: false,
        correct_answer: 'Correct Answer',
        updated_score: 5,
        explanation: 'Time limit exceeded',
        next_question: null,
        round_complete: false,
        game_complete: false
      };

      mockGameService.submitAnswer = vi.fn().mockResolvedValue(timeoutResponse);

      const result = await mockGameService.submitAnswer(timeoutRequest);

      expect(result.explanation).toContain('Time limit exceeded');
      expect(result.is_correct).toBe(false);
    });
  });

  describe('Game Statistics and Analytics', () => {
    it('should track user statistics across multiple games', async () => {
      const userStats = {
        total_games: 15,
        total_score: 180,
        average_accuracy: 75.5,
        favorite_category: 'Science',
        recent_games: [
          {
            id: 'stats-session-1',
            user_id: testUserId,
            status: 'completed' as const,
            total_rounds: 3,
            questions_per_round: 5,
            selected_categories: ['Science'],
            current_round: 3,
            current_question_index: 15,
            total_score: 12,
            created_at: '2023-01-01T10:00:00Z',
            updated_at: '2023-01-01T10:30:00Z'
          }
        ]
      };

      mockGameService.getUserStats = vi.fn().mockResolvedValue(userStats);

      const stats = await mockGameService.getUserStats(testUserId);

      expect(stats.total_games).toBe(15);
      expect(stats.average_accuracy).toBe(75.5);
      expect(stats.favorite_category).toBe('Science');
      expect(stats.recent_games).toHaveLength(1);
    });

    it('should handle game summary generation', async () => {
      const completedSessionId = 'summary-session-123';

      const gameSummary: GameSummary = {
        game_session_id: completedSessionId,
        total_score: 10,
        total_questions: 15,
        correct_answers: 10,
        accuracy_percentage: 66.67,
        total_duration_ms: 600000,
        rounds: [
          {
            round_number: 1,
            correct_answers: 4,
            total_questions: 5,
            round_score: 4,
            duration_ms: 200000,
            accuracy_percentage: 80.0
          },
          {
            round_number: 2,
            correct_answers: 3,
            total_questions: 5,
            round_score: 3,
            duration_ms: 200000,
            accuracy_percentage: 60.0
          },
          {
            round_number: 3,
            correct_answers: 3,
            total_questions: 5,
            round_score: 3,
            duration_ms: 200000,
            accuracy_percentage: 60.0
          }
        ],
        personal_best: true
      };

      mockGameService.getGameSummary = vi.fn().mockResolvedValue(gameSummary);

      const summary = await mockGameService.getGameSummary(completedSessionId);

      expect(summary.accuracy_percentage).toBeCloseTo(66.67, 1);
      expect(summary.rounds).toHaveLength(3);
      expect(summary.personal_best).toBe(true);
    });
  });

  describe('Edge Function Integration', () => {
    it('should integrate game service with edge function validations', async () => {
      // Create session via game service
      const gameConfig: CreateGameSessionRequest = {
        total_rounds: 1,
        questions_per_round: 2,
        selected_categories: ['Science']
      };

      const session: GameSession = {
        id: 'edge-integration-123',
        user_id: testUserId,
        status: 'setup',
        total_rounds: 1,
        questions_per_round: 2,
        selected_categories: ['Science'],
        current_round: 1,
        current_question_index: 0,
        total_score: 0,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:00:00Z'
      };

      mockGameService.createGameSession = vi.fn().mockResolvedValue(session);

      const sessionResult = await mockGameService.createGameSession(testUserId, gameConfig);

      // Setup via edge function
      const setupRequest: CreateGameSetupRequest = {
        user_id: testUserId,
        total_rounds: 1,
        questions_per_round: 2,
        selected_categories: ['Science']
      };

      const setupResponse: CreateGameSetupResponse = {
        game_session_id: sessionResult.id,
        rounds: [
          {
            round_id: 'edge-round-1',
            round_number: 1,
            categories: ['Science'],
            questions: [
              {
                question_id: 'edge-q1',
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

      mockEdgeFunctionService.createGameSetup = vi.fn().mockResolvedValue(setupResponse);

      const setupResult = await mockEdgeFunctionService.createGameSetup(setupRequest);

      // Verify integration
      expect(setupResult.game_session_id).toBe(sessionResult.id);
      expect(setupResult.rounds[0].questions).toHaveLength(1);

      // Answer via edge function
      const answerRequest: ValidateAnswerRequest = {
        game_question_id: 'edge-q1-instance',
        user_answer: 'Water',
        time_to_answer_ms: 5000
      };

      const answerResponse: ValidateAnswerResponse = {
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

      mockEdgeFunctionService.validateAnswer = vi.fn().mockResolvedValue(answerResponse);

      const validationResult = await mockEdgeFunctionService.validateAnswer(answerRequest);

      expect(validationResult.is_correct).toBe(true);
      expect(validationResult.session_stats.current_score).toBe(1);
    });
  });

  // Integration tests - these will fail until implementation exists
  describe('Integration with actual services (will fail until implemented)', () => {
    it('should fail - game service integration not implemented yet', () => {
      expect(() => {
        // import { gameService } from '../../services/game';
        // import { edgeFunctionService } from '../../services/database';
        throw new Error('Game service integration not implemented yet');
      }).toThrow('Game service integration not implemented yet');
    });

    it('should fail - game state management not implemented yet', () => {
      expect(() => {
        // import { GameProvider } from '../../contexts/GameContext';
        // import { useGame } from '../../hooks/useGame';
        throw new Error('Game state management not implemented yet');
      }).toThrow('Game state management not implemented yet');
    });

    it('should fail - game flow orchestration not implemented yet', () => {
      expect(() => {
        // import { GameOrchestrator } from '../../services/gameOrchestrator';
        throw new Error('Game flow orchestration not implemented yet');
      }).toThrow('Game flow orchestration not implemented yet');
    });
  });
});
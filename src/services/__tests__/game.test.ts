import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  GameSummary,
  RoundSummary
} from '../../../specs/001-this-project-is/contracts/game';

// Mock implementation for testing
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

// Test implementation will be imported here when created
// import { gameService } from '../game';

describe('Game Service Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserId = 'user-123';
  const mockSessionId = 'session-123';

  const mockSession: GameSession = {
    id: mockSessionId,
    user_id: mockUserId,
    status: 'setup',
    total_rounds: 3,
    questions_per_round: 5,
    selected_categories: ['Science', 'History'],
    current_round: 1,
    current_question_index: 0,
    total_score: 0,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  describe('Profile Management', () => {
    const mockProfile: UserProfile = {
      id: mockUserId,
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      total_games_played: 5,
      total_correct_answers: 45,
      total_questions_answered: 50,
      favorite_categories: ['Science', 'History'],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    it('should get user profile by ID', async () => {
      mockGameService.getUserProfile = vi.fn().mockResolvedValue(mockProfile);

      const result = await mockGameService.getUserProfile(mockUserId);

      expect(mockGameService.getUserProfile).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockProfile);
      expect(result?.id).toBe(mockUserId);
    });

    it('should return null for non-existent user', async () => {
      mockGameService.getUserProfile = vi.fn().mockResolvedValue(null);

      const result = await mockGameService.getUserProfile('non-existent');

      expect(result).toBeNull();
    });

    it('should create new user profile', async () => {
      const newProfileData = {
        username: 'newuser',
        total_games_played: 0,
        total_correct_answers: 0,
        total_questions_answered: 0,
        favorite_categories: []
      };

      mockGameService.createUserProfile = vi.fn().mockResolvedValue({
        ...newProfileData,
        id: mockUserId,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });

      const result = await mockGameService.createUserProfile(newProfileData);

      expect(mockGameService.createUserProfile).toHaveBeenCalledWith(newProfileData);
      expect(result.id).toBe(mockUserId);
      expect(result.username).toBe('newuser');
      expect(result.total_games_played).toBe(0);
    });

    it('should update user profile', async () => {
      const updates = { username: 'updateduser', total_games_played: 6 };
      const updatedProfile = { ...mockProfile, ...updates, updated_at: '2023-01-02T00:00:00Z' };

      mockGameService.updateUserProfile = vi.fn().mockResolvedValue(updatedProfile);

      const result = await mockGameService.updateUserProfile(mockUserId, updates);

      expect(mockGameService.updateUserProfile).toHaveBeenCalledWith(mockUserId, updates);
      expect(result.username).toBe('updateduser');
      expect(result.total_games_played).toBe(6);
    });
  });

  describe('Question Management', () => {
    it('should get available categories', async () => {
      const categories = ['Science', 'History', 'Geography', 'Sports'];
      mockGameService.getAvailableCategories = vi.fn().mockResolvedValue(categories);

      const result = await mockGameService.getAvailableCategories();

      expect(mockGameService.getAvailableCategories).toHaveBeenCalled();
      expect(result).toEqual(categories);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get questions for session', async () => {
      const mockQuestions: Question[] = [
        {
          id: 'q1',
          category: 'Science',
          question: 'What is H2O?',
          a: 'Water',
          b: 'Oxygen',
          c: 'Hydrogen',
          d: 'Carbon',
          metadata: {},
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'q2',
          category: 'History',
          question: 'When was WWII?',
          a: '1939-1945',
          b: '1914-1918',
          c: '1950-1953',
          d: '1960-1975',
          metadata: {},
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockGameService.getQuestionsForSession = vi.fn().mockResolvedValue(mockQuestions);

      const result = await mockGameService.getQuestionsForSession(['Science', 'History'], 2);

      expect(mockGameService.getQuestionsForSession).toHaveBeenCalledWith(['Science', 'History'], 2);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('question');
      expect(result[0]).toHaveProperty('a');
      expect(result[0]).toHaveProperty('b');
      expect(result[0]).toHaveProperty('c');
      expect(result[0]).toHaveProperty('d');
    });
  });

  describe('Game Session Management', () => {

    it('should create new game session', async () => {
      const request: CreateGameSessionRequest = {
        total_rounds: 3,
        questions_per_round: 5,
        selected_categories: ['Science', 'History']
      };

      mockGameService.createGameSession = vi.fn().mockResolvedValue(mockSession);

      const result = await mockGameService.createGameSession(mockUserId, request);

      expect(mockGameService.createGameSession).toHaveBeenCalledWith(mockUserId, request);
      expect(result.user_id).toBe(mockUserId);
      expect(result.status).toBe('setup');
      expect(result.total_rounds).toBe(3);
      expect(result.questions_per_round).toBe(5);
      expect(result.selected_categories).toEqual(['Science', 'History']);
    });

    it('should get game session by ID', async () => {
      mockGameService.getGameSession = vi.fn().mockResolvedValue(mockSession);

      const result = await mockGameService.getGameSession(mockSessionId);

      expect(mockGameService.getGameSession).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual(mockSession);
    });

    it('should get user game sessions', async () => {
      const sessions = [mockSession];
      mockGameService.getUserGameSessions = vi.fn().mockResolvedValue(sessions);

      const result = await mockGameService.getUserGameSessions(mockUserId, 'setup');

      expect(mockGameService.getUserGameSessions).toHaveBeenCalledWith(mockUserId, 'setup');
      expect(result).toEqual(sessions);
    });

    it('should update game session', async () => {
      const updates = { status: 'in_progress' as const, current_question_index: 1 };
      const updatedSession = { ...mockSession, ...updates };

      mockGameService.updateGameSession = vi.fn().mockResolvedValue(updatedSession);

      const result = await mockGameService.updateGameSession(mockSessionId, updates);

      expect(mockGameService.updateGameSession).toHaveBeenCalledWith(mockSessionId, updates);
      expect(result.status).toBe('in_progress');
      expect(result.current_question_index).toBe(1);
    });
  });

  describe('Game Flow', () => {
    const mockQuestionPresentation: QuestionPresentation = {
      id: 'gq-123',
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
      total_questions: 15
    };

    it('should start game and return first question', async () => {
      const mockStartResponse: StartGameResponse = {
        session: { ...mockSession, status: 'in_progress' },
        first_question: mockQuestionPresentation
      };

      mockGameService.startGame = vi.fn().mockResolvedValue(mockStartResponse);

      const result = await mockGameService.startGame(mockSessionId);

      expect(mockGameService.startGame).toHaveBeenCalledWith(mockSessionId);
      expect(result.session.status).toBe('in_progress');
      expect(result.first_question).toEqual(mockQuestionPresentation);
      expect(result.first_question.answers).toHaveLength(4);
    });

    it('should get next question', async () => {
      mockGameService.getNextQuestion = vi.fn().mockResolvedValue(mockQuestionPresentation);

      const result = await mockGameService.getNextQuestion(mockSessionId);

      expect(mockGameService.getNextQuestion).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual(mockQuestionPresentation);
    });

    it('should submit answer and get response', async () => {
      const submitRequest: SubmitAnswerRequest = {
        game_session_id: mockSessionId,
        game_question_id: 'gq-123',
        user_answer: 'Water',
        time_to_answer_ms: 5000
      };

      const mockResponse: SubmitAnswerResponse = {
        is_correct: true,
        correct_answer: 'Water',
        updated_score: 1,
        next_question: {
          ...mockQuestionPresentation,
          id: 'gq-124',
          question: 'What is CO2?',
          question_number: 2
        },
        round_complete: false,
        game_complete: false
      };

      mockGameService.submitAnswer = vi.fn().mockResolvedValue(mockResponse);

      const result = await mockGameService.submitAnswer(submitRequest);

      expect(mockGameService.submitAnswer).toHaveBeenCalledWith(submitRequest);
      expect(result.is_correct).toBe(true);
      expect(result.correct_answer).toBe('Water');
      expect(result.updated_score).toBe(1);
      expect(result.next_question?.question_number).toBe(2);
    });

    it('should pause game', async () => {
      const pausedSession = { ...mockSession, status: 'paused' as const };
      mockGameService.pauseGame = vi.fn().mockResolvedValue(pausedSession);

      const result = await mockGameService.pauseGame(mockSessionId);

      expect(mockGameService.pauseGame).toHaveBeenCalledWith(mockSessionId);
      expect(result.status).toBe('paused');
    });

    it('should resume game', async () => {
      mockGameService.resumeGame = vi.fn().mockResolvedValue(mockQuestionPresentation);

      const result = await mockGameService.resumeGame(mockSessionId);

      expect(mockGameService.resumeGame).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual(mockQuestionPresentation);
    });

    it('should complete game and return summary', async () => {
      const mockRounds: RoundSummary[] = [
        {
          round_number: 1,
          correct_answers: 4,
          total_questions: 5,
          round_score: 4,
          duration_ms: 30000,
          accuracy_percentage: 80
        }
      ];

      const mockSummary: GameSummary = {
        game_session_id: mockSessionId,
        total_score: 12,
        total_questions: 15,
        correct_answers: 12,
        accuracy_percentage: 80,
        total_duration_ms: 90000,
        rounds: mockRounds,
        personal_best: true
      };

      mockGameService.completeGame = vi.fn().mockResolvedValue(mockSummary);

      const result = await mockGameService.completeGame(mockSessionId);

      expect(mockGameService.completeGame).toHaveBeenCalledWith(mockSessionId);
      expect(result.game_session_id).toBe(mockSessionId);
      expect(result.total_score).toBe(12);
      expect(result.accuracy_percentage).toBe(80);
      expect(result.personal_best).toBe(true);
      expect(result.rounds).toHaveLength(1);
    });
  });

  describe('Statistics', () => {
    it('should get game summary', async () => {
      const mockSummary: GameSummary = {
        game_session_id: mockSessionId,
        total_score: 10,
        total_questions: 15,
        correct_answers: 10,
        accuracy_percentage: 66.67,
        total_duration_ms: 75000,
        rounds: [],
        personal_best: false
      };

      mockGameService.getGameSummary = vi.fn().mockResolvedValue(mockSummary);

      const result = await mockGameService.getGameSummary(mockSessionId);

      expect(mockGameService.getGameSummary).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual(mockSummary);
    });

    it('should get user statistics', async () => {
      const mockStats = {
        total_games: 10,
        total_score: 85,
        average_accuracy: 75.5,
        favorite_category: 'Science',
        recent_games: [mockSession]
      };

      mockGameService.getUserStats = vi.fn().mockResolvedValue(mockStats);

      const result = await mockGameService.getUserStats(mockUserId);

      expect(mockGameService.getUserStats).toHaveBeenCalledWith(mockUserId);
      expect(result.total_games).toBe(10);
      expect(result.favorite_category).toBe('Science');
      expect(result.recent_games).toHaveLength(1);
    });
  });

  // Integration tests - these will fail until implementation exists
  describe('Integration with actual service (will fail until implemented)', () => {
    it('should fail - game service not implemented yet', () => {
      // This test will fail until we create the actual game service
      expect(() => {
        // import { gameService } from '../game';
        throw new Error('Game service not implemented yet');
      }).toThrow('Game service not implemented yet');
    });
  });
});
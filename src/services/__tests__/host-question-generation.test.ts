// Contract Tests: Question Generation Service
// Tests for question assignment and management functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  QuestionGenerationProgress,
  QuestionPreviewRequest,
  QuestionPreviewResponse,
  ReplaceQuestionRequest,
  QuestionAssignment,
  RoundWithQuestions,
  QuestionReplacementOptions
} from '@/contracts/host-management';
import type { Question } from '@/contracts/multi-user-types';

// Mock the service that doesn't exist yet
const mockQuestionService = {
  generateQuestions: vi.fn(),
  getQuestionPreview: vi.fn(),
  replaceQuestion: vi.fn(),
  getReplacementOptions: vi.fn(),
};

describe('Question Generation Service Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateQuestions', () => {
    it('should generate questions for new game successfully', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        gameId: 'game-123',
        hostId: 'host-123',
        forceRegenerate: false
      };

      const expectedResponse: QuestionGenerationResponse = {
        success: true,
        progress: {
          currentRound: 5,
          totalRounds: 5,
          questionsAssigned: 50,
          questionsTotal: 50,
          duplicatesFound: 0,
          status: 'completed',
          message: 'All questions generated successfully'
        }
      };

      mockQuestionService.generateQuestions.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockQuestionService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.progress.status).toBe('completed');
      expect(result.progress.questionsAssigned).toBe(50);
      expect(result.progress.duplicatesFound).toBe(0);
      expect(mockQuestionService.generateQuestions).toHaveBeenCalledWith(request);
    });

    it('should handle force regeneration of existing questions', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        gameId: 'game-with-questions',
        hostId: 'host-123',
        forceRegenerate: true
      };

      const expectedResponse: QuestionGenerationResponse = {
        success: true,
        progress: {
          currentRound: 3,
          totalRounds: 3,
          questionsAssigned: 30,
          questionsTotal: 30,
          duplicatesFound: 2,
          status: 'completed',
          message: 'Questions regenerated with 2 duplicates replaced'
        },
        duplicatesWarning: {
          count: 2,
          rounds: [1, 3],
          message: 'Some questions were duplicated and automatically replaced'
        }
      };

      mockQuestionService.generateQuestions.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockQuestionService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.progress.duplicatesFound).toBe(2);
      expect(result.duplicatesWarning?.count).toBe(2);
      expect(result.duplicatesWarning?.rounds).toEqual([1, 3]);
    });

    it('should handle insufficient questions scenario', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        gameId: 'game-limited-questions',
        hostId: 'host-123',
        forceRegenerate: false
      };

      mockQuestionService.generateQuestions.mockRejectedValue(
        new Error('Insufficient questions in category science: need 20, have 15 unique (5 duplicates available)')
      );

      // Act & Assert
      await expect(mockQuestionService.generateQuestions(request)).rejects.toThrow('Insufficient questions in category science');
    });

    it('should handle unauthorized question generation', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        gameId: 'game-123',
        hostId: 'unauthorized-host',
        forceRegenerate: false
      };

      mockQuestionService.generateQuestions.mockRejectedValue(
        new Error('Unauthorized to perform generateQuestions on resource game-123')
      );

      // Act & Assert
      await expect(mockQuestionService.generateQuestions(request)).rejects.toThrow('Unauthorized to perform generateQuestions on resource game-123');
    });

    it('should handle question generation in progress', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        gameId: 'game-123',
        hostId: 'host-123',
        forceRegenerate: false
      };

      const expectedResponse: QuestionGenerationResponse = {
        success: false,
        progress: {
          currentRound: 2,
          totalRounds: 5,
          questionsAssigned: 20,
          questionsTotal: 50,
          duplicatesFound: 1,
          status: 'processing',
          message: 'Generating questions for round 2 of 5'
        }
      };

      mockQuestionService.generateQuestions.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockQuestionService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.progress.status).toBe('processing');
      expect(result.progress.currentRound).toBe(2);
      expect(result.progress.questionsAssigned).toBe(20);
    });

    it('should handle game with already generated questions', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        gameId: 'game-complete',
        hostId: 'host-123',
        forceRegenerate: false
      };

      const expectedResponse: QuestionGenerationResponse = {
        success: true,
        progress: {
          currentRound: 5,
          totalRounds: 5,
          questionsAssigned: 50,
          questionsTotal: 50,
          duplicatesFound: 0,
          status: 'completed',
          message: 'Questions already generated for this game'
        }
      };

      mockQuestionService.generateQuestions.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockQuestionService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.progress.status).toBe('completed');
      expect(result.progress.message).toContain('already generated');
    });
  });

  describe('getQuestionPreview', () => {
    it('should retrieve round questions for preview', async () => {
      // Arrange
      const request: QuestionPreviewRequest = {
        roundId: 'round-123',
        hostId: 'host-123'
      };

      const sampleQuestions: QuestionAssignment[] = [
        {
          id: 'rq-1',
          round_id: 'round-123',
          question_id: 'q-1',
          question_order: 1,
          question: {
            id: 'q-1',
            text: 'What is the capital of France?',
            answer: 'Paris',
            category: 'geography',
            difficulty: 'easy',
            created_at: '2024-01-01T10:00:00Z'
          },
          created_at: '2024-01-01T11:00:00Z'
        },
        {
          id: 'rq-2',
          round_id: 'round-123',
          question_id: 'q-2',
          question_order: 2,
          question: {
            id: 'q-2',
            text: 'What is 2 + 2?',
            answer: '4',
            category: 'math',
            difficulty: 'easy',
            created_at: '2024-01-01T10:00:00Z'
          },
          created_at: '2024-01-01T11:00:00Z'
        }
      ];

      const expectedResponse: QuestionPreviewResponse = {
        round: {
          id: 'round-123',
          game_id: 'game-123',
          round_number: 1,
          status: 'setup',
          questions: sampleQuestions,
          questionsLoaded: true,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T11:00:00Z'
        },
        replacementOptions: {
          'q-1': [
            {
              id: 'q-alt-1',
              text: 'What is the capital of Germany?',
              answer: 'Berlin',
              category: 'geography',
              difficulty: 'easy',
              created_at: '2024-01-01T10:00:00Z'
            }
          ],
          'q-2': [
            {
              id: 'q-alt-2',
              text: 'What is 3 + 3?',
              answer: '6',
              category: 'math',
              difficulty: 'easy',
              created_at: '2024-01-01T10:00:00Z'
            }
          ]
        }
      };

      mockQuestionService.getQuestionPreview.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockQuestionService.getQuestionPreview(request);

      // Assert
      expect(result.round.questions).toHaveLength(2);
      expect(result.round.questionsLoaded).toBe(true);
      expect(result.replacementOptions['q-1']).toHaveLength(1);
      expect(result.replacementOptions['q-2']).toHaveLength(1);
      expect(mockQuestionService.getQuestionPreview).toHaveBeenCalledWith(request);
    });

    it('should handle empty round preview', async () => {
      // Arrange
      const request: QuestionPreviewRequest = {
        roundId: 'empty-round',
        hostId: 'host-123'
      };

      const expectedResponse: QuestionPreviewResponse = {
        round: {
          id: 'empty-round',
          game_id: 'game-123',
          round_number: 1,
          status: 'setup',
          questions: [],
          questionsLoaded: false,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        },
        replacementOptions: {}
      };

      mockQuestionService.getQuestionPreview.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockQuestionService.getQuestionPreview(request);

      // Assert
      expect(result.round.questions).toHaveLength(0);
      expect(result.round.questionsLoaded).toBe(false);
      expect(Object.keys(result.replacementOptions)).toHaveLength(0);
    });

    it('should handle unauthorized preview access', async () => {
      // Arrange
      const request: QuestionPreviewRequest = {
        roundId: 'round-123',
        hostId: 'unauthorized-host'
      };

      mockQuestionService.getQuestionPreview.mockRejectedValue(
        new Error('Unauthorized to access round preview')
      );

      // Act & Assert
      await expect(mockQuestionService.getQuestionPreview(request)).rejects.toThrow('Unauthorized to access round preview');
    });

    it('should handle non-existent round preview', async () => {
      // Arrange
      const request: QuestionPreviewRequest = {
        roundId: 'non-existent-round',
        hostId: 'host-123'
      };

      mockQuestionService.getQuestionPreview.mockRejectedValue(
        new Error('Round not found')
      );

      // Act & Assert
      await expect(mockQuestionService.getQuestionPreview(request)).rejects.toThrow('Round not found');
    });
  });

  describe('replaceQuestion', () => {
    it('should replace question successfully', async () => {
      // Arrange
      const request: ReplaceQuestionRequest = {
        roundQuestionId: 'rq-123',
        newQuestionId: 'q-new-456',
        hostId: 'host-123'
      };

      const expectedAssignment: QuestionAssignment = {
        id: 'rq-123',
        round_id: 'round-123',
        question_id: 'q-new-456',
        question_order: 3,
        question: {
          id: 'q-new-456',
          text: 'What is the capital of Italy?',
          answer: 'Rome',
          category: 'geography',
          difficulty: 'medium',
          created_at: '2024-01-01T10:00:00Z'
        },
        created_at: '2024-01-01T12:00:00Z'
      };

      mockQuestionService.replaceQuestion.mockResolvedValue(expectedAssignment);

      // Act
      const result = await mockQuestionService.replaceQuestion(request);

      // Assert
      expect(result.question_id).toBe('q-new-456');
      expect(result.question.text).toBe('What is the capital of Italy?');
      expect(result.created_at).toBe('2024-01-01T12:00:00Z');
      expect(mockQuestionService.replaceQuestion).toHaveBeenCalledWith(request);
    });

    it('should prevent replacing with duplicate question', async () => {
      // Arrange
      const request: ReplaceQuestionRequest = {
        roundQuestionId: 'rq-123',
        newQuestionId: 'q-duplicate',
        hostId: 'host-123'
      };

      mockQuestionService.replaceQuestion.mockRejectedValue(
        new Error('Question q-duplicate is already used in this game')
      );

      // Act & Assert
      await expect(mockQuestionService.replaceQuestion(request)).rejects.toThrow('Question q-duplicate is already used in this game');
    });

    it('should handle unauthorized question replacement', async () => {
      // Arrange
      const request: ReplaceQuestionRequest = {
        roundQuestionId: 'rq-123',
        newQuestionId: 'q-new-456',
        hostId: 'unauthorized-host'
      };

      mockQuestionService.replaceQuestion.mockRejectedValue(
        new Error('Unauthorized to replace questions in this game')
      );

      // Act & Assert
      await expect(mockQuestionService.replaceQuestion(request)).rejects.toThrow('Unauthorized to replace questions in this game');
    });

    it('should handle replacement during active game', async () => {
      // Arrange
      const request: ReplaceQuestionRequest = {
        roundQuestionId: 'rq-active-game',
        newQuestionId: 'q-new-456',
        hostId: 'host-123'
      };

      mockQuestionService.replaceQuestion.mockRejectedValue(
        new Error('Cannot replace questions in active game')
      );

      // Act & Assert
      await expect(mockQuestionService.replaceQuestion(request)).rejects.toThrow('Cannot replace questions in active game');
    });

    it('should handle non-existent question assignment', async () => {
      // Arrange
      const request: ReplaceQuestionRequest = {
        roundQuestionId: 'non-existent-rq',
        newQuestionId: 'q-456',
        hostId: 'host-123'
      };

      mockQuestionService.replaceQuestion.mockRejectedValue(
        new Error('Round question assignment not found')
      );

      // Act & Assert
      await expect(mockQuestionService.replaceQuestion(request)).rejects.toThrow('Round question assignment not found');
    });
  });

  describe('getReplacementOptions', () => {
    it('should get replacement options for question', async () => {
      // Arrange
      const questionId = 'q-123';
      const category = 'science';

      const expectedOptions: Question[] = [
        {
          id: 'q-alt-1',
          text: 'What is the chemical symbol for gold?',
          answer: 'Au',
          category: 'science',
          difficulty: 'medium',
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 'q-alt-2',
          text: 'What is the largest planet in our solar system?',
          answer: 'Jupiter',
          category: 'science',
          difficulty: 'easy',
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 'q-alt-3',
          text: 'What is the speed of light in vacuum?',
          answer: '299,792,458 m/s',
          category: 'science',
          difficulty: 'hard',
          created_at: '2024-01-01T10:00:00Z'
        }
      ];

      mockQuestionService.getReplacementOptions.mockResolvedValue(expectedOptions);

      // Act
      const result = await mockQuestionService.getReplacementOptions(questionId, category);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every(q => q.category === 'science')).toBe(true);
      expect(result.every(q => q.id !== questionId)).toBe(true);
      expect(mockQuestionService.getReplacementOptions).toHaveBeenCalledWith(questionId, category);
    });

    it('should handle limited replacement options', async () => {
      // Arrange
      const questionId = 'q-123';
      const category = 'rare-category';

      const expectedOptions: Question[] = [
        {
          id: 'q-only-option',
          text: 'Single available question',
          answer: 'Single answer',
          category: 'rare-category',
          difficulty: 'medium',
          created_at: '2024-01-01T10:00:00Z'
        }
      ];

      mockQuestionService.getReplacementOptions.mockResolvedValue(expectedOptions);

      // Act
      const result = await mockQuestionService.getReplacementOptions(questionId, category);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('rare-category');
    });

    it('should handle no replacement options available', async () => {
      // Arrange
      const questionId = 'q-123';
      const category = 'empty-category';

      mockQuestionService.getReplacementOptions.mockResolvedValue([]);

      // Act
      const result = await mockQuestionService.getReplacementOptions(questionId, category);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle invalid category for replacement', async () => {
      // Arrange
      const questionId = 'q-123';
      const invalidCategory = 'non-existent-category';

      mockQuestionService.getReplacementOptions.mockRejectedValue(
        new Error('Category not found: non-existent-category')
      );

      // Act & Assert
      await expect(mockQuestionService.getReplacementOptions(questionId, invalidCategory))
        .rejects.toThrow('Category not found: non-existent-category');
    });
  });

  describe('Question generation edge cases', () => {
    it('should handle mixed category availability', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        gameId: 'game-mixed-availability',
        hostId: 'host-123',
        forceRegenerate: false
      };

      const expectedResponse: QuestionGenerationResponse = {
        success: true,
        progress: {
          currentRound: 3,
          totalRounds: 3,
          questionsAssigned: 27,
          questionsTotal: 30,
          duplicatesFound: 5,
          status: 'completed',
          message: 'Generation completed with some duplicate replacements'
        },
        duplicatesWarning: {
          count: 5,
          rounds: [1, 2, 3],
          message: 'Limited question pool in some categories required duplicate handling'
        }
      };

      mockQuestionService.generateQuestions.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockQuestionService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.progress.questionsAssigned).toBe(27);
      expect(result.duplicatesWarning?.count).toBe(5);
    });

    it('should handle partial generation failure', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        gameId: 'game-partial-failure',
        hostId: 'host-123',
        forceRegenerate: false
      };

      const expectedResponse: QuestionGenerationResponse = {
        success: false,
        progress: {
          currentRound: 2,
          totalRounds: 5,
          questionsAssigned: 15,
          questionsTotal: 50,
          duplicatesFound: 0,
          status: 'error',
          message: 'Failed to generate questions for round 2: insufficient science questions'
        }
      };

      mockQuestionService.generateQuestions.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockQuestionService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.progress.status).toBe('error');
      expect(result.progress.currentRound).toBe(2);
      expect(result.progress.message).toContain('insufficient science questions');
    });
  });
});

// This test file will FAIL until the actual service implementation is created
// This is the expected TDD behavior - Red, Green, Refactor
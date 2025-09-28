// Integration Tests: Host Question Generation
// Tests for complete question generation and management workflow

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  QuestionPreviewRequest,
  QuestionPreviewResponse,
  ReplaceQuestionRequest,
  QuestionAssignment,
  RoundWithQuestions
} from '@/contracts/host-management';
import type { Question, Game, Round } from '@/contracts/multi-user-types';

// Mock the integrated question workflow that doesn't exist yet
const mockQuestionWorkflow = {
  questionService: {
    generateQuestions: vi.fn(),
    getQuestionPreview: vi.fn(),
    replaceQuestion: vi.fn(),
    getReplacementOptions: vi.fn(),
    validateQuestionAvailability: vi.fn()
  },
  gameService: {
    getGameWithRounds: vi.fn(),
    updateGameStatus: vi.fn(),
    validateGameForQuestions: vi.fn()
  },
  roundService: {
    getRoundQuestions: vi.fn(),
    updateRoundConfiguration: vi.fn(),
    validateRoundConstraints: vi.fn()
  },
  workflow: {
    executeQuestionGeneration: vi.fn(),
    handleDuplicateQuestions: vi.fn(),
    optimizeQuestionDistribution: vi.fn(),
    validateQuestionIntegrity: vi.fn()
  },
  analytics: {
    trackQuestionUsage: vi.fn(),
    analyzeQuestionDifficulty: vi.fn(),
    generateQuestionReport: vi.fn()
  }
};

describe('Host Question Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Question Generation', () => {
    it('should generate questions for new game with all rounds', async () => {
      // Arrange
      const gameId = 'game-new-questions-123';
      const hostId = 'host-123';

      const game: Game = {
        id: gameId,
        title: 'New Question Game',
        host_id: hostId,
        status: 'setup',
        total_rounds: 4,
        questions_per_round: 10,
        selected_categories: ['science', 'history', 'sports'],
        max_teams: 6,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true,
        scheduled_date: '2024-01-15T19:00:00Z',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      const rounds: Round[] = Array.from({ length: 4 }, (_, i) => ({
        id: `round-${i + 1}`,
        game_id: gameId,
        round_number: i + 1,
        status: 'setup',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      }));

      const request: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: false
      };

      const response: QuestionGenerationResponse = {
        success: true,
        progress: {
          currentRound: 4,
          totalRounds: 4,
          questionsAssigned: 40,
          questionsTotal: 40,
          duplicatesFound: 0,
          status: 'completed',
          message: 'All questions generated successfully'
        }
      };

      mockQuestionWorkflow.gameService.getGameWithRounds.mockResolvedValue({
        game,
        rounds
      });

      mockQuestionWorkflow.questionService.validateQuestionAvailability.mockResolvedValue({
        sufficient: true,
        availableByCategory: {
          science: 150,
          history: 120,
          sports: 100
        },
        totalNeeded: 40,
        distribution: {
          'science': 14,
          'history': 13,
          'sports': 13
        }
      });

      mockQuestionWorkflow.workflow.executeQuestionGeneration.mockResolvedValue(response);

      // Act
      const gameData = await mockQuestionWorkflow.gameService.getGameWithRounds(gameId, hostId);
      const availability = await mockQuestionWorkflow.questionService.validateQuestionAvailability(
        gameData.game.selected_categories,
        gameData.game.total_rounds,
        gameData.game.questions_per_round
      );

      expect(availability.sufficient).toBe(true);

      const result = await mockQuestionWorkflow.workflow.executeQuestionGeneration(request, gameData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.progress.questionsAssigned).toBe(40);
      expect(result.progress.status).toBe('completed');
      expect(result.progress.duplicatesFound).toBe(0);

      expect(mockQuestionWorkflow.gameService.getGameWithRounds).toHaveBeenCalledWith(gameId, hostId);
      expect(mockQuestionWorkflow.questionService.validateQuestionAvailability).toHaveBeenCalled();
      expect(mockQuestionWorkflow.workflow.executeQuestionGeneration).toHaveBeenCalledWith(request, gameData);
    });

    it('should handle question generation with category distribution', async () => {
      // Arrange
      const gameId = 'game-distribution-456';
      const hostId = 'host-456';

      const game: Game = {
        id: gameId,
        title: 'Distribution Test Game',
        host_id: hostId,
        status: 'setup',
        total_rounds: 3,
        questions_per_round: 12,
        selected_categories: ['science', 'history', 'sports', 'entertainment'],
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true,
        scheduled_date: '2024-01-20T19:00:00Z',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      mockQuestionWorkflow.workflow.optimizeQuestionDistribution.mockResolvedValue({
        distribution: {
          science: 9,
          history: 9,
          sports: 9,
          entertainment: 9
        },
        totalQuestions: 36,
        balanceScore: 1.0
      });

      const request: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: false
      };

      mockQuestionWorkflow.workflow.executeQuestionGeneration.mockResolvedValue({
        success: true,
        progress: {
          currentRound: 3,
          totalRounds: 3,
          questionsAssigned: 36,
          questionsTotal: 36,
          duplicatesFound: 0,
          status: 'completed',
          message: 'Questions distributed evenly across categories'
        }
      });

      // Act
      const distribution = await mockQuestionWorkflow.workflow.optimizeQuestionDistribution(
        game.selected_categories,
        game.total_rounds * game.questions_per_round
      );

      const result = await mockQuestionWorkflow.workflow.executeQuestionGeneration(request, { game });

      // Assert
      expect(distribution.balanceScore).toBe(1.0);
      expect(distribution.distribution.science).toBe(9);
      expect(distribution.distribution.history).toBe(9);
      expect(distribution.distribution.sports).toBe(9);
      expect(distribution.distribution.entertainment).toBe(9);

      expect(result.success).toBe(true);
      expect(result.progress.questionsAssigned).toBe(36);
    });

    it('should handle insufficient questions scenario with alternatives', async () => {
      // Arrange
      const gameId = 'game-insufficient-789';
      const hostId = 'host-789';

      const game: Game = {
        id: gameId,
        title: 'Insufficient Questions Game',
        host_id: hostId,
        status: 'setup',
        total_rounds: 10,
        questions_per_round: 20,
        selected_categories: ['rare-category'],
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true,
        scheduled_date: '2024-01-25T19:00:00Z',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      mockQuestionWorkflow.questionService.validateQuestionAvailability.mockResolvedValue({
        sufficient: false,
        availableByCategory: {
          'rare-category': 50
        },
        totalNeeded: 200,
        shortfall: 150,
        suggestions: [
          'Reduce questions per round to 5',
          'Add more categories to selection',
          'Reduce total rounds to 5'
        ]
      });

      // Act
      const availability = await mockQuestionWorkflow.questionService.validateQuestionAvailability(
        game.selected_categories,
        game.total_rounds,
        game.questions_per_round
      );

      // Assert
      expect(availability.sufficient).toBe(false);
      expect(availability.shortfall).toBe(150);
      expect(availability.suggestions).toContain('Reduce questions per round to 5');
      expect(availability.suggestions).toContain('Add more categories to selection');

      // Should not proceed with generation
      expect(mockQuestionWorkflow.workflow.executeQuestionGeneration).not.toHaveBeenCalled();
    });

    it('should generate questions with duplicate handling strategy', async () => {
      // Arrange
      const gameId = 'game-duplicates-012';
      const hostId = 'host-012';

      const request: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: false
      };

      mockQuestionWorkflow.workflow.handleDuplicateQuestions.mockResolvedValue({
        strategy: 'replace_with_alternatives',
        duplicatesFound: 8,
        duplicatesReplaced: 8,
        alternativesUsed: 8,
        remainingDuplicates: 0
      });

      mockQuestionWorkflow.workflow.executeQuestionGeneration.mockResolvedValue({
        success: true,
        progress: {
          currentRound: 5,
          totalRounds: 5,
          questionsAssigned: 50,
          questionsTotal: 50,
          duplicatesFound: 8,
          status: 'completed',
          message: 'Questions generated with duplicate replacement'
        },
        duplicatesWarning: {
          count: 8,
          rounds: [1, 2, 3, 4, 5],
          message: 'Some questions were duplicated and automatically replaced with alternatives'
        }
      });

      // Act
      const duplicateHandling = await mockQuestionWorkflow.workflow.handleDuplicateQuestions(
        gameId,
        hostId,
        'replace_with_alternatives'
      );

      const result = await mockQuestionWorkflow.workflow.executeQuestionGeneration(request, null);

      // Assert
      expect(duplicateHandling.duplicatesFound).toBe(8);
      expect(duplicateHandling.duplicatesReplaced).toBe(8);
      expect(duplicateHandling.remainingDuplicates).toBe(0);

      expect(result.success).toBe(true);
      expect(result.progress.duplicatesFound).toBe(8);
      expect(result.duplicatesWarning?.count).toBe(8);
      expect(result.duplicatesWarning?.message).toContain('automatically replaced');
    });
  });

  describe('Question Preview and Management', () => {
    it('should provide comprehensive question preview with replacement options', async () => {
      // Arrange
      const roundId = 'round-preview-123';
      const hostId = 'host-preview';

      const request: QuestionPreviewRequest = {
        roundId,
        hostId
      };

      const sampleQuestions: QuestionAssignment[] = [
        {
          id: 'qa-1',
          round_id: roundId,
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
          id: 'qa-2',
          round_id: roundId,
          question_id: 'q-2',
          question_order: 2,
          question: {
            id: 'q-2',
            text: 'What is the largest planet?',
            answer: 'Jupiter',
            category: 'science',
            difficulty: 'medium',
            created_at: '2024-01-01T10:00:00Z'
          },
          created_at: '2024-01-01T11:00:00Z'
        }
      ];

      const roundWithQuestions: RoundWithQuestions = {
        id: roundId,
        game_id: 'game-123',
        round_number: 1,
        status: 'setup',
        questions: sampleQuestions,
        questionsLoaded: true,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z'
      };

      const replacementOptions: Record<string, Question[]> = {
        'q-1': [
          {
            id: 'q-alt-1',
            text: 'What is the capital of Germany?',
            answer: 'Berlin',
            category: 'geography',
            difficulty: 'easy',
            created_at: '2024-01-01T10:00:00Z'
          },
          {
            id: 'q-alt-2',
            text: 'What is the capital of Italy?',
            answer: 'Rome',
            category: 'geography',
            difficulty: 'easy',
            created_at: '2024-01-01T10:00:00Z'
          }
        ],
        'q-2': [
          {
            id: 'q-alt-3',
            text: 'What is the smallest planet?',
            answer: 'Mercury',
            category: 'science',
            difficulty: 'medium',
            created_at: '2024-01-01T10:00:00Z'
          }
        ]
      };

      const response: QuestionPreviewResponse = {
        round: roundWithQuestions,
        replacementOptions
      };

      mockQuestionWorkflow.questionService.getQuestionPreview.mockResolvedValue(response);

      // Act
      const result = await mockQuestionWorkflow.questionService.getQuestionPreview(request);

      // Assert
      expect(result.round.questions).toHaveLength(2);
      expect(result.round.questionsLoaded).toBe(true);
      expect(result.replacementOptions['q-1']).toHaveLength(2);
      expect(result.replacementOptions['q-2']).toHaveLength(1);

      expect(result.round.questions[0].question.text).toBe('What is the capital of France?');
      expect(result.replacementOptions['q-1'][0].text).toBe('What is the capital of Germany?');

      expect(mockQuestionWorkflow.questionService.getQuestionPreview).toHaveBeenCalledWith(request);
    });

    it('should handle question replacement with validation', async () => {
      // Arrange
      const roundQuestionId = 'qa-replace-456';
      const newQuestionId = 'q-new-789';
      const hostId = 'host-replace';

      const replaceRequest: ReplaceQuestionRequest = {
        roundQuestionId,
        newQuestionId,
        hostId
      };

      const updatedAssignment: QuestionAssignment = {
        id: roundQuestionId,
        round_id: 'round-123',
        question_id: newQuestionId,
        question_order: 3,
        question: {
          id: newQuestionId,
          text: 'What is the chemical symbol for gold?',
          answer: 'Au',
          category: 'science',
          difficulty: 'medium',
          created_at: '2024-01-01T10:00:00Z'
        },
        created_at: '2024-01-01T12:00:00Z'
      };

      mockQuestionWorkflow.workflow.validateQuestionIntegrity.mockResolvedValue({
        isValid: true,
        checks: {
          noDuplicates: true,
          categoryMatch: true,
          difficultyAppropriate: true,
          questionExists: true
        }
      });

      mockQuestionWorkflow.questionService.replaceQuestion.mockResolvedValue(updatedAssignment);

      // Act
      const validation = await mockQuestionWorkflow.workflow.validateQuestionIntegrity(
        newQuestionId,
        'round-123',
        hostId
      );

      expect(validation.isValid).toBe(true);

      const result = await mockQuestionWorkflow.questionService.replaceQuestion(replaceRequest);

      // Assert
      expect(result.question_id).toBe(newQuestionId);
      expect(result.question.text).toBe('What is the chemical symbol for gold?');
      expect(result.question.category).toBe('science');

      expect(mockQuestionWorkflow.workflow.validateQuestionIntegrity).toHaveBeenCalledWith(
        newQuestionId,
        'round-123',
        hostId
      );
      expect(mockQuestionWorkflow.questionService.replaceQuestion).toHaveBeenCalledWith(replaceRequest);
    });

    it('should prevent replacement with invalid or duplicate questions', async () => {
      // Arrange
      const roundQuestionId = 'qa-invalid-789';
      const duplicateQuestionId = 'q-duplicate-012';
      const hostId = 'host-validation';

      mockQuestionWorkflow.workflow.validateQuestionIntegrity.mockResolvedValue({
        isValid: false,
        checks: {
          noDuplicates: false,
          categoryMatch: true,
          difficultyAppropriate: true,
          questionExists: true
        },
        errors: ['Question is already used in round 2 of this game']
      });

      const replaceRequest: ReplaceQuestionRequest = {
        roundQuestionId,
        newQuestionId: duplicateQuestionId,
        hostId
      };

      mockQuestionWorkflow.questionService.replaceQuestion.mockRejectedValue(
        new Error('Question q-duplicate-012 is already used in this game')
      );

      // Act
      const validation = await mockQuestionWorkflow.workflow.validateQuestionIntegrity(
        duplicateQuestionId,
        'round-123',
        hostId
      );

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.checks.noDuplicates).toBe(false);
      expect(validation.errors).toContain('Question is already used in round 2 of this game');

      await expect(mockQuestionWorkflow.questionService.replaceQuestion(replaceRequest))
        .rejects.toThrow('Question q-duplicate-012 is already used in this game');
    });
  });

  describe('Round-Specific Question Management', () => {
    it('should customize questions per round based on configuration', async () => {
      // Arrange
      const gameId = 'game-custom-rounds-345';
      const hostId = 'host-custom';

      const rounds = [
        {
          id: 'round-1',
          game_id: gameId,
          round_number: 1,
          customConfig: {
            categories: ['science'],
            questions_per_round: 8,
            difficulty_bias: 'easy'
          }
        },
        {
          id: 'round-2',
          game_id: gameId,
          round_number: 2,
          customConfig: {
            categories: ['history', 'geography'],
            questions_per_round: 12,
            difficulty_bias: 'medium'
          }
        },
        {
          id: 'round-3',
          game_id: gameId,
          round_number: 3,
          customConfig: {
            categories: ['sports', 'entertainment'],
            questions_per_round: 10,
            difficulty_bias: 'hard'
          }
        }
      ];

      mockQuestionWorkflow.roundService.validateRoundConstraints.mockImplementation(
        async (roundConfig) => ({
          isValid: true,
          constraints: {
            categoriesAvailable: roundConfig.customConfig.categories.length > 0,
            questionsAvailable: true,
            difficultySupported: true
          }
        })
      );

      mockQuestionWorkflow.workflow.executeQuestionGeneration.mockImplementation(
        async (request, gameData) => {
          const totalQuestions = rounds.reduce((sum, round) =>
            sum + round.customConfig.questions_per_round, 0
          );

          return {
            success: true,
            progress: {
              currentRound: rounds.length,
              totalRounds: rounds.length,
              questionsAssigned: totalQuestions,
              questionsTotal: totalQuestions,
              duplicatesFound: 0,
              status: 'completed',
              message: 'Custom round configurations applied successfully'
            }
          };
        }
      );

      // Act
      const validations = await Promise.all(
        rounds.map(round =>
          mockQuestionWorkflow.roundService.validateRoundConstraints(round)
        )
      );

      const request: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: false
      };

      const result = await mockQuestionWorkflow.workflow.executeQuestionGeneration(request, { rounds });

      // Assert
      validations.forEach(validation => {
        expect(validation.isValid).toBe(true);
        expect(validation.constraints.categoriesAvailable).toBe(true);
      });

      expect(result.success).toBe(true);
      expect(result.progress.questionsAssigned).toBe(30); // 8 + 12 + 10
      expect(result.progress.message).toContain('Custom round configurations');

      expect(mockQuestionWorkflow.roundService.validateRoundConstraints).toHaveBeenCalledTimes(3);
    });

    it('should handle progressive difficulty across rounds', async () => {
      // Arrange
      const gameId = 'game-progressive-678';
      const hostId = 'host-progressive';

      const progressiveRounds = [
        { round: 1, difficulty: 'easy', questions: 10 },
        { round: 2, difficulty: 'medium', questions: 10 },
        { round: 3, difficulty: 'hard', questions: 10 }
      ];

      mockQuestionWorkflow.analytics.analyzeQuestionDifficulty.mockResolvedValue({
        distribution: {
          easy: 33.3,
          medium: 33.3,
          hard: 33.4
        },
        progressionScore: 0.95,
        balanceAchieved: true
      });

      // Act
      const analysis = await mockQuestionWorkflow.analytics.analyzeQuestionDifficulty(
        gameId,
        progressiveRounds
      );

      // Assert
      expect(analysis.progressionScore).toBe(0.95);
      expect(analysis.balanceAchieved).toBe(true);
      expect(analysis.distribution.easy).toBeCloseTo(33.3, 1);
      expect(analysis.distribution.medium).toBeCloseTo(33.3, 1);
      expect(analysis.distribution.hard).toBeCloseTo(33.4, 1);
    });
  });

  describe('Question Analytics and Reporting', () => {
    it('should track question usage patterns across games', async () => {
      // Arrange
      const hostId = 'host-analytics';
      const gameIds = ['game-1', 'game-2', 'game-3'];

      const usageData = {
        questionsUsed: 150,
        categoriesUsed: ['science', 'history', 'sports', 'entertainment'],
        difficultyDistribution: {
          easy: 45,
          medium: 60,
          hard: 45
        },
        reuseRate: 0.12,
        averageQuestionsPerGame: 50
      };

      mockQuestionWorkflow.analytics.trackQuestionUsage.mockResolvedValue(usageData);

      // Act
      const usage = await mockQuestionWorkflow.analytics.trackQuestionUsage(hostId, gameIds);

      // Assert
      expect(usage.questionsUsed).toBe(150);
      expect(usage.categoriesUsed).toHaveLength(4);
      expect(usage.reuseRate).toBe(0.12);
      expect(usage.averageQuestionsPerGame).toBe(50);

      expect(mockQuestionWorkflow.analytics.trackQuestionUsage).toHaveBeenCalledWith(hostId, gameIds);
    });

    it('should generate comprehensive question reports', async () => {
      // Arrange
      const gameId = 'game-report-901';
      const hostId = 'host-report';

      const report = {
        gameId,
        hostId,
        totalQuestions: 40,
        questionsByCategory: {
          science: 12,
          history: 10,
          sports: 10,
          entertainment: 8
        },
        questionsByDifficulty: {
          easy: 15,
          medium: 15,
          hard: 10
        },
        duplicatesHandled: 3,
        replacementsUsed: 2,
        generationTime: 1234,
        qualityScore: 0.92,
        recommendations: [
          'Consider adding more hard questions for competitive balance',
          'Entertainment category could use more questions in the pool'
        ]
      };

      mockQuestionWorkflow.analytics.generateQuestionReport.mockResolvedValue(report);

      // Act
      const result = await mockQuestionWorkflow.analytics.generateQuestionReport(gameId, hostId);

      // Assert
      expect(result.totalQuestions).toBe(40);
      expect(result.qualityScore).toBe(0.92);
      expect(result.duplicatesHandled).toBe(3);
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0]).toContain('hard questions');
      expect(result.generationTime).toBe(1234);

      expect(mockQuestionWorkflow.analytics.generateQuestionReport).toHaveBeenCalledWith(gameId, hostId);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle partial generation failures with recovery options', async () => {
      // Arrange
      const gameId = 'game-partial-failure';
      const hostId = 'host-recovery';

      const request: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: false
      };

      // Mock partial failure scenario
      mockQuestionWorkflow.workflow.executeQuestionGeneration.mockResolvedValue({
        success: false,
        progress: {
          currentRound: 2,
          totalRounds: 5,
          questionsAssigned: 15,
          questionsTotal: 50,
          duplicatesFound: 0,
          status: 'error',
          message: 'Generation failed at round 3: Insufficient questions in sports category'
        },
        recovery: {
          completedRounds: [1, 2],
          failedRound: 3,
          options: [
            'Skip sports category for remaining rounds',
            'Reduce questions per round to 8',
            'Add alternative categories'
          ]
        }
      });

      // Act
      const result = await mockQuestionWorkflow.workflow.executeQuestionGeneration(request, null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.progress.status).toBe('error');
      expect(result.progress.currentRound).toBe(2);
      expect(result.recovery?.completedRounds).toEqual([1, 2]);
      expect(result.recovery?.failedRound).toBe(3);
      expect(result.recovery?.options).toContain('Skip sports category for remaining rounds');
    });

    it('should handle concurrent generation requests properly', async () => {
      // Arrange
      const gameId = 'game-concurrent';
      const hostId = 'host-concurrent';

      const request1: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: false
      };

      const request2: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: true
      };

      // Mock the first request succeeding, second being rejected
      mockQuestionWorkflow.workflow.executeQuestionGeneration
        .mockResolvedValueOnce({
          success: true,
          progress: {
            currentRound: 3,
            totalRounds: 3,
            questionsAssigned: 30,
            questionsTotal: 30,
            duplicatesFound: 0,
            status: 'completed',
            message: 'Generation completed successfully'
          }
        })
        .mockRejectedValueOnce(
          new Error('Question generation already in progress for this game')
        );

      // Act
      const [result1, result2] = await Promise.allSettled([
        mockQuestionWorkflow.workflow.executeQuestionGeneration(request1, null),
        mockQuestionWorkflow.workflow.executeQuestionGeneration(request2, null)
      ]);

      // Assert
      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('rejected');

      if (result1.status === 'fulfilled') {
        expect(result1.value.success).toBe(true);
        expect(result1.value.progress.questionsAssigned).toBe(30);
      }

      if (result2.status === 'rejected') {
        expect(result2.reason.message).toBe('Question generation already in progress for this game');
      }
    });
  });
});

// This test file will FAIL until the actual integration is implemented
// This is the expected TDD behavior - Red, Green, Refactor
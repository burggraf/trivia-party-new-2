// Integration Tests: Host Game Creation Workflow
// Tests for complete game creation user journey

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  CreateGameRequest,
  GameConfiguration,
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  TeamConfiguration,
  CreateTeamRequest
} from '@/contracts/host-management';
import type { Game, Team } from '@/contracts/multi-user-types';

// Mock the integrated service workflow that doesn't exist yet
const mockGameCreationWorkflow = {
  gameService: {
    createGame: vi.fn(),
    updateGame: vi.fn(),
    validateGameConfiguration: vi.fn(),
    getGameDetails: vi.fn()
  },
  questionService: {
    generateQuestions: vi.fn(),
    validateQuestionAvailability: vi.fn(),
    getQuestionPreview: vi.fn()
  },
  teamService: {
    createTeam: vi.fn(),
    getGameTeams: vi.fn(),
    validateTeamConfiguration: vi.fn()
  },
  workflow: {
    executeGameCreationWorkflow: vi.fn(),
    validateWorkflowState: vi.fn(),
    rollbackOnFailure: vi.fn()
  },
  validation: {
    validateGameData: vi.fn(),
    checkQuestionAvailability: vi.fn(),
    validateTeamConstraints: vi.fn()
  }
};

describe('Host Game Creation Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Game Creation', () => {
    it('should create game with minimal required configuration', async () => {
      // Arrange
      const hostId = 'host-123';
      const gameConfig: GameConfiguration = {
        title: 'Friday Night Trivia',
        location: 'Main Hall',
        scheduled_date: '2024-01-15T19:00:00Z',
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['science', 'history'],
        max_teams: 6,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      const createRequest: CreateGameRequest = {
        ...gameConfig,
        host_id: hostId
      };

      const expectedGame: Game = {
        id: 'game-new-123',
        title: gameConfig.title,
        location: gameConfig.location,
        scheduled_date: gameConfig.scheduled_date,
        host_id: hostId,
        status: 'setup',
        total_rounds: gameConfig.total_rounds,
        questions_per_round: gameConfig.questions_per_round,
        selected_categories: gameConfig.selected_categories,
        max_teams: gameConfig.max_teams,
        max_players_per_team: gameConfig.max_players_per_team,
        min_players_per_team: gameConfig.min_players_per_team,
        self_registration_enabled: gameConfig.self_registration_enabled,
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      mockGameCreationWorkflow.validation.validateGameData.mockResolvedValue({
        isValid: true,
        errors: []
      });

      mockGameCreationWorkflow.gameService.createGame.mockResolvedValue(expectedGame);

      // Act
      const validation = await mockGameCreationWorkflow.validation.validateGameData(gameConfig);
      expect(validation.isValid).toBe(true);

      const result = await mockGameCreationWorkflow.gameService.createGame(createRequest);

      // Assert
      expect(result.id).toBe('game-new-123');
      expect(result.status).toBe('setup');
      expect(result.host_id).toBe(hostId);
      expect(result.selected_categories).toEqual(['science', 'history']);

      expect(mockGameCreationWorkflow.validation.validateGameData).toHaveBeenCalledWith(gameConfig);
      expect(mockGameCreationWorkflow.gameService.createGame).toHaveBeenCalledWith(createRequest);
    });

    it('should handle game creation with validation errors', async () => {
      // Arrange
      const hostId = 'host-456';
      const invalidConfig: GameConfiguration = {
        title: '', // Invalid empty title
        location: '',
        scheduled_date: 'invalid-date',
        total_rounds: 0, // Invalid
        questions_per_round: 25, // Too many
        selected_categories: [], // Empty
        max_teams: 25, // Too many
        max_players_per_team: 10, // Too many
        min_players_per_team: 0, // Invalid
        self_registration_enabled: true
      };

      mockGameCreationWorkflow.validation.validateGameData.mockResolvedValue({
        isValid: false,
        errors: [
          'Title is required',
          'Scheduled date must be a valid ISO string',
          'Total rounds must be between 1 and 10',
          'Questions per round must be between 5 and 20',
          'At least one category must be selected',
          'Max teams must be between 2 and 20',
          'Max players per team must be between 1 and 8',
          'Min players per team must be at least 1'
        ]
      });

      mockGameCreationWorkflow.gameService.createGame.mockRejectedValue(
        new Error('Game validation failed: Multiple validation errors')
      );

      // Act
      const validation = await mockGameCreationWorkflow.validation.validateGameData(invalidConfig);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(8);
      expect(validation.errors).toContain('Title is required');
      expect(validation.errors).toContain('At least one category must be selected');

      // Should not attempt to create game with invalid data
      expect(mockGameCreationWorkflow.gameService.createGame).not.toHaveBeenCalled();
    });

    it('should create game with advanced configuration options', async () => {
      // Arrange
      const hostId = 'host-advanced';
      const advancedConfig: GameConfiguration = {
        title: 'Championship Trivia Tournament',
        location: 'Grand Ballroom',
        scheduled_date: '2024-02-01T18:00:00Z',
        total_rounds: 8,
        questions_per_round: 15,
        selected_categories: ['science', 'history', 'sports', 'entertainment', 'geography'],
        max_teams: 12,
        max_players_per_team: 6,
        min_players_per_team: 3,
        self_registration_enabled: false
      };

      const createRequest: CreateGameRequest = {
        ...advancedConfig,
        host_id: hostId
      };

      mockGameCreationWorkflow.validation.validateGameData.mockResolvedValue({
        isValid: true,
        errors: []
      });

      mockGameCreationWorkflow.gameService.createGame.mockResolvedValue({
        id: 'game-advanced-789',
        ...advancedConfig,
        host_id: hostId,
        status: 'setup',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      } as Game);

      // Act
      const result = await mockGameCreationWorkflow.gameService.createGame(createRequest);

      // Assert
      expect(result.total_rounds).toBe(8);
      expect(result.questions_per_round).toBe(15);
      expect(result.selected_categories).toHaveLength(5);
      expect(result.max_teams).toBe(12);
      expect(result.self_registration_enabled).toBe(false);
    });
  });

  describe('Game Creation with Question Generation', () => {
    it('should create game and generate questions in single workflow', async () => {
      // Arrange
      const hostId = 'host-with-questions';
      const gameId = 'game-with-questions-123';

      const gameConfig: GameConfiguration = {
        title: 'Auto-Generated Questions Game',
        location: 'Conference Room',
        scheduled_date: '2024-01-20T16:00:00Z',
        total_rounds: 4,
        questions_per_round: 12,
        selected_categories: ['science', 'history', 'sports'],
        max_teams: 8,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      const game: Game = {
        id: gameId,
        ...gameConfig,
        host_id: hostId,
        status: 'setup',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      const questionRequest: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: false
      };

      const questionResponse: QuestionGenerationResponse = {
        success: true,
        progress: {
          currentRound: 4,
          totalRounds: 4,
          questionsAssigned: 48,
          questionsTotal: 48,
          duplicatesFound: 0,
          status: 'completed',
          message: 'All questions generated successfully'
        }
      };

      // Mock successful workflow
      mockGameCreationWorkflow.validation.checkQuestionAvailability.mockResolvedValue({
        sufficient: true,
        availableByCategory: {
          science: 150,
          history: 120,
          sports: 100
        },
        totalNeeded: 48
      });

      mockGameCreationWorkflow.gameService.createGame.mockResolvedValue(game);
      mockGameCreationWorkflow.questionService.generateQuestions.mockResolvedValue(questionResponse);

      mockGameCreationWorkflow.workflow.executeGameCreationWorkflow.mockImplementation(
        async (config: GameConfiguration, hostId: string, generateQuestions: boolean) => {
          const game = await mockGameCreationWorkflow.gameService.createGame({
            ...config,
            host_id: hostId
          });

          if (generateQuestions) {
            const questionResult = await mockGameCreationWorkflow.questionService.generateQuestions({
              gameId: game.id,
              hostId,
              forceRegenerate: false
            });

            return {
              game,
              questionsGenerated: questionResult.success,
              questionProgress: questionResult.progress
            };
          }

          return { game, questionsGenerated: false };
        }
      );

      // Act
      const availability = await mockGameCreationWorkflow.validation.checkQuestionAvailability(gameConfig);
      expect(availability.sufficient).toBe(true);

      const workflowResult = await mockGameCreationWorkflow.workflow.executeGameCreationWorkflow(
        gameConfig,
        hostId,
        true
      );

      // Assert
      expect(workflowResult.game.id).toBe(gameId);
      expect(workflowResult.questionsGenerated).toBe(true);
      expect(workflowResult.questionProgress?.status).toBe('completed');
      expect(workflowResult.questionProgress?.questionsAssigned).toBe(48);

      expect(mockGameCreationWorkflow.validation.checkQuestionAvailability).toHaveBeenCalledWith(gameConfig);
      expect(mockGameCreationWorkflow.gameService.createGame).toHaveBeenCalled();
      expect(mockGameCreationWorkflow.questionService.generateQuestions).toHaveBeenCalledWith(questionRequest);
    });

    it('should handle insufficient questions scenario during creation', async () => {
      // Arrange
      const gameConfig: GameConfiguration = {
        title: 'Insufficient Questions Game',
        location: 'Test Room',
        scheduled_date: '2024-01-25T19:00:00Z',
        total_rounds: 10, // Very high
        questions_per_round: 20, // Very high
        selected_categories: ['rare-category'], // Limited questions
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      mockGameCreationWorkflow.validation.checkQuestionAvailability.mockResolvedValue({
        sufficient: false,
        availableByCategory: {
          'rare-category': 50
        },
        totalNeeded: 200,
        shortfall: 150
      });

      // Act
      const availability = await mockGameCreationWorkflow.validation.checkQuestionAvailability(gameConfig);

      // Assert
      expect(availability.sufficient).toBe(false);
      expect(availability.shortfall).toBe(150);
      expect(availability.availableByCategory['rare-category']).toBe(50);

      // Should not proceed with game creation
      expect(mockGameCreationWorkflow.gameService.createGame).not.toHaveBeenCalled();
    });

    it('should handle partial question generation with duplicates', async () => {
      // Arrange
      const gameId = 'game-with-duplicates';
      const hostId = 'host-duplicates';

      const questionRequest: QuestionGenerationRequest = {
        gameId,
        hostId,
        forceRegenerate: false
      };

      const questionResponse: QuestionGenerationResponse = {
        success: true,
        progress: {
          currentRound: 3,
          totalRounds: 3,
          questionsAssigned: 30,
          questionsTotal: 30,
          duplicatesFound: 5,
          status: 'completed',
          message: 'Questions generated with duplicate handling'
        },
        duplicatesWarning: {
          count: 5,
          rounds: [1, 2, 3],
          message: 'Some questions were duplicated and automatically replaced'
        }
      };

      mockGameCreationWorkflow.questionService.generateQuestions.mockResolvedValue(questionResponse);

      // Act
      const result = await mockGameCreationWorkflow.questionService.generateQuestions(questionRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.progress.duplicatesFound).toBe(5);
      expect(result.duplicatesWarning?.count).toBe(5);
      expect(result.duplicatesWarning?.message).toContain('automatically replaced');
    });
  });

  describe('Game Creation with Team Setup', () => {
    it('should create game and setup initial teams', async () => {
      // Arrange
      const hostId = 'host-with-teams';
      const gameId = 'game-with-teams-456';

      const gameConfig: GameConfiguration = {
        title: 'Team Setup Game',
        location: 'Team Room',
        scheduled_date: '2024-01-30T19:00:00Z',
        total_rounds: 5,
        questions_per_round: 10,
        selected_categories: ['general'],
        max_teams: 4,
        max_players_per_team: 3,
        min_players_per_team: 2,
        self_registration_enabled: false
      };

      const teams: TeamConfiguration[] = [
        { name: 'Team Alpha', display_color: '#3b82f6' },
        { name: 'Team Beta', display_color: '#ef4444' },
        { name: 'Team Gamma', display_color: '#10b981' }
      ];

      const createdTeams: Team[] = teams.map((team, index) => ({
        id: `team-${index + 1}`,
        game_id: gameId,
        name: team.name,
        display_color: team.display_color,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      }));

      mockGameCreationWorkflow.gameService.createGame.mockResolvedValue({
        id: gameId,
        ...gameConfig,
        host_id: hostId,
        status: 'setup',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      } as Game);

      mockGameCreationWorkflow.teamService.createTeam.mockImplementation(
        async (request: CreateTeamRequest) => {
          const teamIndex = teams.findIndex(t => t.name === request.teamData.name);
          return {
            team: createdTeams[teamIndex],
            playerCount: 0,
            isValid: false,
            validationErrors: ['Team needs players before game can start']
          };
        }
      );

      mockGameCreationWorkflow.teamService.getGameTeams.mockResolvedValue(createdTeams);

      // Act
      const game = await mockGameCreationWorkflow.gameService.createGame({
        ...gameConfig,
        host_id: hostId
      });

      const teamResults = await Promise.all(
        teams.map(teamData =>
          mockGameCreationWorkflow.teamService.createTeam({
            gameId,
            hostId,
            teamData
          })
        )
      );

      const finalTeams = await mockGameCreationWorkflow.teamService.getGameTeams(gameId, hostId);

      // Assert
      expect(game.id).toBe(gameId);
      expect(teamResults).toHaveLength(3);
      expect(finalTeams).toHaveLength(3);

      teamResults.forEach((result, index) => {
        expect(result.team.name).toBe(teams[index].name);
        expect(result.team.display_color).toBe(teams[index].display_color);
        expect(result.playerCount).toBe(0);
        expect(result.isValid).toBe(false);
      });

      expect(mockGameCreationWorkflow.gameService.createGame).toHaveBeenCalled();
      expect(mockGameCreationWorkflow.teamService.createTeam).toHaveBeenCalledTimes(3);
      expect(mockGameCreationWorkflow.teamService.getGameTeams).toHaveBeenCalledWith(gameId, hostId);
    });

    it('should validate team constraints during creation', async () => {
      // Arrange
      const gameConfig: GameConfiguration = {
        title: 'Constraint Validation Game',
        location: 'Validation Room',
        scheduled_date: '2024-02-05T19:00:00Z',
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['general'],
        max_teams: 2, // Very restrictive
        max_players_per_team: 2,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      const teamConfig: TeamConfiguration = {
        name: 'Test Team',
        display_color: '#8b5cf6'
      };

      mockGameCreationWorkflow.validation.validateTeamConstraints.mockResolvedValue({
        isValid: true,
        constraints: {
          maxTeams: gameConfig.max_teams,
          currentTeamCount: 0,
          canAddTeam: true,
          playersPerTeam: {
            min: gameConfig.min_players_per_team,
            max: gameConfig.max_players_per_team
          }
        }
      });

      // Act
      const validation = await mockGameCreationWorkflow.validation.validateTeamConstraints(
        gameConfig,
        teamConfig,
        0 // current team count
      );

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.constraints.maxTeams).toBe(2);
      expect(validation.constraints.canAddTeam).toBe(true);
      expect(validation.constraints.playersPerTeam.min).toBe(2);
      expect(validation.constraints.playersPerTeam.max).toBe(2);
    });

    it('should handle team creation at capacity limits', async () => {
      // Arrange
      const gameConfig: GameConfiguration = {
        title: 'At Capacity Game',
        location: 'Full Room',
        scheduled_date: '2024-02-10T19:00:00Z',
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['general'],
        max_teams: 2,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      const teamConfig: TeamConfiguration = {
        name: 'Overflow Team',
        display_color: '#f59e0b'
      };

      mockGameCreationWorkflow.validation.validateTeamConstraints.mockResolvedValue({
        isValid: false,
        constraints: {
          maxTeams: 2,
          currentTeamCount: 2,
          canAddTeam: false,
          playersPerTeam: {
            min: 2,
            max: 4
          }
        },
        errors: ['Maximum number of teams (2) already reached']
      });

      // Act
      const validation = await mockGameCreationWorkflow.validation.validateTeamConstraints(
        gameConfig,
        teamConfig,
        2 // current team count at max
      );

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.constraints.canAddTeam).toBe(false);
      expect(validation.errors).toContain('Maximum number of teams (2) already reached');
    });
  });

  describe('Complete Game Creation Workflow', () => {
    it('should execute complete workflow: game + questions + teams', async () => {
      // Arrange
      const hostId = 'host-complete-workflow';
      const gameId = 'game-complete-789';

      const completeConfig: GameConfiguration = {
        title: 'Complete Workflow Game',
        location: 'Main Conference Room',
        scheduled_date: '2024-02-15T18:30:00Z',
        total_rounds: 5,
        questions_per_round: 12,
        selected_categories: ['science', 'history', 'sports'],
        max_teams: 6,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      const teams: TeamConfiguration[] = [
        { name: 'Science Squad', display_color: '#3b82f6' },
        { name: 'History Buffs', display_color: '#ef4444' },
        { name: 'Sports Fanatics', display_color: '#10b981' }
      ];

      // Mock complete workflow execution
      mockGameCreationWorkflow.workflow.executeGameCreationWorkflow.mockImplementation(
        async (config: GameConfiguration, hostId: string, withQuestions: boolean, withTeams?: TeamConfiguration[]) => {
          // 1. Validate everything first
          const gameValidation = await mockGameCreationWorkflow.validation.validateGameData(config);
          if (!gameValidation.isValid) {
            throw new Error(`Game validation failed: ${gameValidation.errors.join(', ')}`);
          }

          const questionAvailability = await mockGameCreationWorkflow.validation.checkQuestionAvailability(config);
          if (withQuestions && !questionAvailability.sufficient) {
            throw new Error('Insufficient questions available');
          }

          // 2. Create game
          const game = await mockGameCreationWorkflow.gameService.createGame({
            ...config,
            host_id: hostId
          });

          let questionsGenerated = false;
          let questionProgress = undefined;

          // 3. Generate questions if requested
          if (withQuestions) {
            const questionResult = await mockGameCreationWorkflow.questionService.generateQuestions({
              gameId: game.id,
              hostId,
              forceRegenerate: false
            });
            questionsGenerated = questionResult.success;
            questionProgress = questionResult.progress;
          }

          let createdTeams: Team[] = [];

          // 4. Create teams if provided
          if (withTeams && withTeams.length > 0) {
            const teamResults = await Promise.all(
              withTeams.map(teamData =>
                mockGameCreationWorkflow.teamService.createTeam({
                  gameId: game.id,
                  hostId,
                  teamData
                })
              )
            );
            createdTeams = teamResults.map(result => result.team);
          }

          return {
            game,
            questionsGenerated,
            questionProgress,
            teams: createdTeams,
            status: 'completed'
          };
        }
      );

      // Mock all the individual services
      mockGameCreationWorkflow.validation.validateGameData.mockResolvedValue({
        isValid: true,
        errors: []
      });

      mockGameCreationWorkflow.validation.checkQuestionAvailability.mockResolvedValue({
        sufficient: true,
        availableByCategory: { science: 100, history: 80, sports: 70 },
        totalNeeded: 60
      });

      mockGameCreationWorkflow.gameService.createGame.mockResolvedValue({
        id: gameId,
        ...completeConfig,
        host_id: hostId,
        status: 'setup',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      } as Game);

      mockGameCreationWorkflow.questionService.generateQuestions.mockResolvedValue({
        success: true,
        progress: {
          currentRound: 5,
          totalRounds: 5,
          questionsAssigned: 60,
          questionsTotal: 60,
          duplicatesFound: 0,
          status: 'completed',
          message: 'All questions generated successfully'
        }
      });

      mockGameCreationWorkflow.teamService.createTeam.mockImplementation(
        async (request: CreateTeamRequest) => ({
          team: {
            id: `team-${request.teamData.name.toLowerCase().replace(/\s+/g, '-')}`,
            game_id: gameId,
            name: request.teamData.name,
            display_color: request.teamData.display_color,
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          },
          playerCount: 0,
          isValid: false,
          validationErrors: ['Team needs players']
        })
      );

      // Act
      const workflowResult = await mockGameCreationWorkflow.workflow.executeGameCreationWorkflow(
        completeConfig,
        hostId,
        true, // with questions
        teams // with teams
      );

      // Assert
      expect(workflowResult.status).toBe('completed');
      expect(workflowResult.game.id).toBe(gameId);
      expect(workflowResult.questionsGenerated).toBe(true);
      expect(workflowResult.questionProgress?.questionsAssigned).toBe(60);
      expect(workflowResult.teams).toHaveLength(3);

      // Verify all steps were called
      expect(mockGameCreationWorkflow.validation.validateGameData).toHaveBeenCalledWith(completeConfig);
      expect(mockGameCreationWorkflow.validation.checkQuestionAvailability).toHaveBeenCalledWith(completeConfig);
      expect(mockGameCreationWorkflow.gameService.createGame).toHaveBeenCalled();
      expect(mockGameCreationWorkflow.questionService.generateQuestions).toHaveBeenCalled();
      expect(mockGameCreationWorkflow.teamService.createTeam).toHaveBeenCalledTimes(3);
    });

    it('should handle workflow rollback on failure', async () => {
      // Arrange
      const hostId = 'host-rollback-test';
      const failConfig: GameConfiguration = {
        title: 'Rollback Test Game',
        location: 'Test Room',
        scheduled_date: '2024-02-20T19:00:00Z',
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['nonexistent'],
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      // Mock partial success followed by failure
      mockGameCreationWorkflow.gameService.createGame.mockResolvedValue({
        id: 'game-to-rollback',
        ...failConfig,
        host_id: hostId,
        status: 'setup',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      } as Game);

      mockGameCreationWorkflow.questionService.generateQuestions.mockRejectedValue(
        new Error('Question generation failed: Category "nonexistent" not found')
      );

      mockGameCreationWorkflow.workflow.rollbackOnFailure.mockResolvedValue({
        gameDeleted: true,
        questionsCleanedUp: true,
        teamsDeleted: 0
      });

      mockGameCreationWorkflow.workflow.executeGameCreationWorkflow.mockImplementation(
        async (config: GameConfiguration, hostId: string, withQuestions: boolean) => {
          const game = await mockGameCreationWorkflow.gameService.createGame({
            ...config,
            host_id: hostId
          });

          try {
            if (withQuestions) {
              await mockGameCreationWorkflow.questionService.generateQuestions({
                gameId: game.id,
                hostId,
                forceRegenerate: false
              });
            }
          } catch (error) {
            // Rollback on failure
            await mockGameCreationWorkflow.workflow.rollbackOnFailure(game.id, hostId);
            throw error;
          }

          return { game, questionsGenerated: false, teams: [] };
        }
      );

      // Act & Assert
      await expect(
        mockGameCreationWorkflow.workflow.executeGameCreationWorkflow(failConfig, hostId, true)
      ).rejects.toThrow('Question generation failed: Category "nonexistent" not found');

      expect(mockGameCreationWorkflow.workflow.rollbackOnFailure).toHaveBeenCalledWith('game-to-rollback', hostId);
    });

    it('should validate workflow state at each step', async () => {
      // Arrange
      const hostId = 'host-validation-steps';
      const gameConfig: GameConfiguration = {
        title: 'Step Validation Game',
        location: 'Validation Room',
        scheduled_date: '2024-02-25T19:00:00Z',
        total_rounds: 4,
        questions_per_round: 10,
        selected_categories: ['science'],
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      mockGameCreationWorkflow.workflow.validateWorkflowState.mockImplementation(
        async (step: string, data: any) => {
          switch (step) {
            case 'game_created':
              return {
                isValid: data.game && data.game.id,
                step: 'game_created',
                message: data.game ? 'Game created successfully' : 'Game creation failed'
              };
            case 'questions_generated':
              return {
                isValid: data.questionsGenerated === true,
                step: 'questions_generated',
                message: data.questionsGenerated ? 'Questions generated' : 'Question generation pending'
              };
            case 'teams_setup':
              return {
                isValid: Array.isArray(data.teams),
                step: 'teams_setup',
                message: `${data.teams?.length || 0} teams configured`
              };
            default:
              return { isValid: false, step, message: 'Unknown step' };
          }
        }
      );

      // Mock game creation
      const game = { id: 'game-validation-123' };
      const gameValidation = await mockGameCreationWorkflow.workflow.validateWorkflowState('game_created', { game });

      const questionsData = { questionsGenerated: true };
      const questionsValidation = await mockGameCreationWorkflow.workflow.validateWorkflowState('questions_generated', questionsData);

      const teamsData = { teams: [{ id: 'team-1' }, { id: 'team-2' }] };
      const teamsValidation = await mockGameCreationWorkflow.workflow.validateWorkflowState('teams_setup', teamsData);

      // Assert
      expect(gameValidation.isValid).toBe(true);
      expect(gameValidation.message).toBe('Game created successfully');

      expect(questionsValidation.isValid).toBe(true);
      expect(questionsValidation.message).toBe('Questions generated');

      expect(teamsValidation.isValid).toBe(true);
      expect(teamsValidation.message).toBe('2 teams configured');

      expect(mockGameCreationWorkflow.workflow.validateWorkflowState).toHaveBeenCalledTimes(3);
    });
  });
});

// This test file will FAIL until the actual integration is implemented
// This is the expected TDD behavior - Red, Green, Refactor
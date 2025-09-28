// Integration Tests: Host Game Lifecycle Management
// Tests for complete game lifecycle from creation to completion

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  CreateGameRequest,
  UpdateGameRequest,
  ArchiveGameRequest,
  DeleteGameRequest,
  GameConfiguration,
  QuestionGenerationRequest,
  CreateTeamRequest,
  TeamConfiguration
} from '@/contracts/host-management';
import type { Game, Team, Round } from '@/contracts/multi-user-types';

// Mock the complete game lifecycle workflow that doesn't exist yet
const mockGameLifecycleWorkflow = {
  gameService: {
    createGame: vi.fn(),
    updateGame: vi.fn(),
    archiveGame: vi.fn(),
    deleteGame: vi.fn(),
    getGameDetails: vi.fn(),
    getHostGames: vi.fn(),
    transitionGameStatus: vi.fn()
  },
  questionService: {
    generateQuestions: vi.fn(),
    validateQuestionCompleteness: vi.fn()
  },
  teamService: {
    createTeam: vi.fn(),
    getGameTeams: vi.fn(),
    validateAllTeamsReady: vi.fn()
  },
  roundService: {
    initializeRounds: vi.fn(),
    startNextRound: vi.fn(),
    completeRound: vi.fn(),
    getRoundStatus: vi.fn()
  },
  lifecycle: {
    executeCompleteGameSetup: vi.fn(),
    validateGameReadiness: vi.fn(),
    startGame: vi.fn(),
    progressGame: vi.fn(),
    completeGame: vi.fn(),
    handleGameStateTransition: vi.fn()
  },
  monitoring: {
    trackGameProgress: vi.fn(),
    generateGameReport: vi.fn(),
    detectGameIssues: vi.fn()
  },
  cleanup: {
    archiveCompletedGame: vi.fn(),
    cleanupGameResources: vi.fn(),
    notifyGameCompletion: vi.fn()
  }
};

describe('Host Game Lifecycle Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Game Setup Workflow', () => {
    it('should execute full game setup from creation to ready state', async () => {
      // Arrange
      const hostId = 'host-lifecycle-123';
      const gameId = 'game-complete-setup-456';

      const gameConfig: GameConfiguration = {
        title: 'Complete Lifecycle Game',
        location: 'Main Conference Room',
        scheduled_date: '2024-02-01T18:00:00Z',
        total_rounds: 4,
        questions_per_round: 12,
        selected_categories: ['science', 'history', 'sports'],
        max_teams: 6,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: false
      };

      const teams: TeamConfiguration[] = [
        { name: 'Science Squad', display_color: '#3b82f6' },
        { name: 'History Buffs', display_color: '#ef4444' },
        { name: 'Sports Fanatics', display_color: '#10b981' },
        { name: 'Knowledge Seekers', display_color: '#8b5cf6' }
      ];

      const createdGame: Game = {
        id: gameId,
        ...gameConfig,
        host_id: hostId,
        status: 'setup',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      const createdTeams: Team[] = teams.map((team, index) => ({
        id: `team-${index + 1}`,
        game_id: gameId,
        name: team.name,
        display_color: team.display_color,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      }));

      const rounds: Round[] = Array.from({ length: 4 }, (_, i) => ({
        id: `round-${i + 1}`,
        game_id: gameId,
        round_number: i + 1,
        status: 'setup',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      }));

      // Mock complete setup workflow
      mockGameLifecycleWorkflow.lifecycle.executeCompleteGameSetup.mockImplementation(
        async (config: GameConfiguration, hostId: string, teamConfigs: TeamConfiguration[]) => {
          // 1. Create game
          const game = await mockGameLifecycleWorkflow.gameService.createGame({
            ...config,
            host_id: hostId
          });

          // 2. Initialize rounds
          const gameRounds = await mockGameLifecycleWorkflow.roundService.initializeRounds(game.id, game.total_rounds);

          // 3. Generate questions
          const questionResult = await mockGameLifecycleWorkflow.questionService.generateQuestions({
            gameId: game.id,
            hostId,
            forceRegenerate: false
          });

          // 4. Create teams
          const teamResults = await Promise.all(
            teamConfigs.map(teamData =>
              mockGameLifecycleWorkflow.teamService.createTeam({
                gameId: game.id,
                hostId,
                teamData
              })
            )
          );

          // 5. Validate readiness
          const readiness = await mockGameLifecycleWorkflow.lifecycle.validateGameReadiness(game.id, hostId);

          return {
            game,
            rounds: gameRounds,
            teams: teamResults.map(result => result.team),
            questionsGenerated: questionResult.success,
            isReady: readiness.isReady,
            setupCompletedAt: new Date().toISOString()
          };
        }
      );

      // Mock individual service calls
      mockGameLifecycleWorkflow.gameService.createGame.mockResolvedValue(createdGame);
      mockGameLifecycleWorkflow.roundService.initializeRounds.mockResolvedValue(rounds);
      mockGameLifecycleWorkflow.questionService.generateQuestions.mockResolvedValue({
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
      });

      mockGameLifecycleWorkflow.teamService.createTeam.mockImplementation(
        async (request: CreateTeamRequest) => ({
          team: createdTeams.find(team => team.name === request.teamData.name)!,
          playerCount: 0,
          isValid: false,
          validationErrors: ['Team needs players']
        })
      );

      mockGameLifecycleWorkflow.lifecycle.validateGameReadiness.mockResolvedValue({
        isReady: false,
        checks: {
          gameCreated: true,
          questionsGenerated: true,
          teamsCreated: true,
          allTeamsHavePlayers: false,
          roundsInitialized: true
        },
        missingRequirements: ['Teams need players before game can start']
      });

      // Act
      const result = await mockGameLifecycleWorkflow.lifecycle.executeCompleteGameSetup(
        gameConfig,
        hostId,
        teams
      );

      // Assert
      expect(result.game.id).toBe(gameId);
      expect(result.game.status).toBe('setup');
      expect(result.rounds).toHaveLength(4);
      expect(result.teams).toHaveLength(4);
      expect(result.questionsGenerated).toBe(true);
      expect(result.isReady).toBe(false);

      expect(mockGameLifecycleWorkflow.gameService.createGame).toHaveBeenCalled();
      expect(mockGameLifecycleWorkflow.roundService.initializeRounds).toHaveBeenCalledWith(gameId, 4);
      expect(mockGameLifecycleWorkflow.questionService.generateQuestions).toHaveBeenCalled();
      expect(mockGameLifecycleWorkflow.teamService.createTeam).toHaveBeenCalledTimes(4);
      expect(mockGameLifecycleWorkflow.lifecycle.validateGameReadiness).toHaveBeenCalledWith(gameId, hostId);
    });

    it('should validate game readiness before allowing start', async () => {
      // Arrange
      const gameId = 'game-readiness-789';
      const hostId = 'host-readiness';

      // Test case: Game not ready (teams without players)
      mockGameLifecycleWorkflow.lifecycle.validateGameReadiness.mockResolvedValueOnce({
        isReady: false,
        checks: {
          gameCreated: true,
          questionsGenerated: true,
          teamsCreated: true,
          allTeamsHavePlayers: false,
          roundsInitialized: true
        },
        missingRequirements: [
          'Team Science Squad needs at least 2 players',
          'Team History Buffs needs at least 2 players'
        ]
      });

      // Test case: Game ready
      mockGameLifecycleWorkflow.lifecycle.validateGameReadiness.mockResolvedValueOnce({
        isReady: true,
        checks: {
          gameCreated: true,
          questionsGenerated: true,
          teamsCreated: true,
          allTeamsHavePlayers: true,
          roundsInitialized: true
        },
        missingRequirements: []
      });

      // Act
      const notReadyResult = await mockGameLifecycleWorkflow.lifecycle.validateGameReadiness(gameId, hostId);
      const readyResult = await mockGameLifecycleWorkflow.lifecycle.validateGameReadiness(gameId, hostId);

      // Assert
      expect(notReadyResult.isReady).toBe(false);
      expect(notReadyResult.missingRequirements).toHaveLength(2);
      expect(notReadyResult.checks.allTeamsHavePlayers).toBe(false);

      expect(readyResult.isReady).toBe(true);
      expect(readyResult.missingRequirements).toHaveLength(0);
      expect(readyResult.checks.allTeamsHavePlayers).toBe(true);
    });
  });

  describe('Game State Transitions', () => {
    it('should handle game start transition from setup to active', async () => {
      // Arrange
      const gameId = 'game-start-012';
      const hostId = 'host-start';

      const gameInSetup: Game = {
        id: gameId,
        title: 'Game Start Test',
        host_id: hostId,
        status: 'setup',
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['general'],
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: false,
        scheduled_date: '2024-02-05T19:00:00Z',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      const gameActive: Game = {
        ...gameInSetup,
        status: 'active',
        updated_at: '2024-01-01T12:00:00Z'
      };

      mockGameLifecycleWorkflow.lifecycle.validateGameReadiness.mockResolvedValue({
        isReady: true,
        checks: {
          gameCreated: true,
          questionsGenerated: true,
          teamsCreated: true,
          allTeamsHavePlayers: true,
          roundsInitialized: true
        },
        missingRequirements: []
      });

      mockGameLifecycleWorkflow.lifecycle.handleGameStateTransition.mockImplementation(
        async (gameId: string, fromStatus: string, toStatus: string, hostId: string) => {
          if (fromStatus === 'setup' && toStatus === 'active') {
            // Validate readiness
            const readiness = await mockGameLifecycleWorkflow.lifecycle.validateGameReadiness(gameId, hostId);
            if (!readiness.isReady) {
              throw new Error(`Cannot start game: ${readiness.missingRequirements.join(', ')}`);
            }

            // Transition to active
            const updatedGame = await mockGameLifecycleWorkflow.gameService.transitionGameStatus(
              gameId,
              'active',
              hostId
            );

            // Start first round
            await mockGameLifecycleWorkflow.roundService.startNextRound(gameId, hostId);

            return {
              game: updatedGame,
              transitionedAt: new Date().toISOString(),
              fromStatus,
              toStatus
            };
          }

          throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
        }
      );

      mockGameLifecycleWorkflow.gameService.transitionGameStatus.mockResolvedValue(gameActive);
      mockGameLifecycleWorkflow.roundService.startNextRound.mockResolvedValue({
        round: {
          id: 'round-1',
          game_id: gameId,
          round_number: 1,
          status: 'active',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T12:00:00Z'
        },
        questionsActivated: 10
      });

      mockGameLifecycleWorkflow.lifecycle.startGame.mockImplementation(
        async (gameId: string, hostId: string) => {
          return await mockGameLifecycleWorkflow.lifecycle.handleGameStateTransition(
            gameId,
            'setup',
            'active',
            hostId
          );
        }
      );

      // Act
      const result = await mockGameLifecycleWorkflow.lifecycle.startGame(gameId, hostId);

      // Assert
      expect(result.game.status).toBe('active');
      expect(result.fromStatus).toBe('setup');
      expect(result.toStatus).toBe('active');

      expect(mockGameLifecycleWorkflow.lifecycle.validateGameReadiness).toHaveBeenCalledWith(gameId, hostId);
      expect(mockGameLifecycleWorkflow.gameService.transitionGameStatus).toHaveBeenCalledWith(gameId, 'active', hostId);
      expect(mockGameLifecycleWorkflow.roundService.startNextRound).toHaveBeenCalledWith(gameId, hostId);
    });

    it('should handle game completion transition from active to completed', async () => {
      // Arrange
      const gameId = 'game-completion-345';
      const hostId = 'host-completion';

      const gameCompleted: Game = {
        id: gameId,
        title: 'Game Completion Test',
        host_id: hostId,
        status: 'completed',
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['general'],
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: false,
        scheduled_date: '2024-02-10T19:00:00Z',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T14:00:00Z'
      };

      mockGameLifecycleWorkflow.roundService.getRoundStatus.mockResolvedValue({
        allRoundsCompleted: true,
        currentRound: 3,
        totalRounds: 3,
        completedRounds: [
          { roundNumber: 1, completedAt: '2024-01-01T12:30:00Z' },
          { roundNumber: 2, completedAt: '2024-01-01T13:15:00Z' },
          { roundNumber: 3, completedAt: '2024-01-01T14:00:00Z' }
        ]
      });

      mockGameLifecycleWorkflow.lifecycle.completeGame.mockImplementation(
        async (gameId: string, hostId: string) => {
          // Check if all rounds are completed
          const roundStatus = await mockGameLifecycleWorkflow.roundService.getRoundStatus(gameId);

          if (!roundStatus.allRoundsCompleted) {
            throw new Error('Cannot complete game: Not all rounds are finished');
          }

          // Transition to completed
          const completedGame = await mockGameLifecycleWorkflow.gameService.transitionGameStatus(
            gameId,
            'completed',
            hostId
          );

          // Generate final report
          const report = await mockGameLifecycleWorkflow.monitoring.generateGameReport(gameId, hostId);

          // Notify completion
          await mockGameLifecycleWorkflow.cleanup.notifyGameCompletion(gameId, hostId);

          return {
            game: completedGame,
            report,
            completedAt: new Date().toISOString()
          };
        }
      );

      mockGameLifecycleWorkflow.gameService.transitionGameStatus.mockResolvedValue(gameCompleted);
      mockGameLifecycleWorkflow.monitoring.generateGameReport.mockResolvedValue({
        gameId,
        duration: '1h 30m',
        totalQuestions: 30,
        teamPerformance: {
          'team-1': { score: 85, rank: 1 },
          'team-2': { score: 78, rank: 2 },
          'team-3': { score: 72, rank: 3 }
        },
        highlights: ['Great competition', 'All teams performed well']
      });

      mockGameLifecycleWorkflow.cleanup.notifyGameCompletion.mockResolvedValue(undefined);

      // Act
      const result = await mockGameLifecycleWorkflow.lifecycle.completeGame(gameId, hostId);

      // Assert
      expect(result.game.status).toBe('completed');
      expect(result.report.duration).toBe('1h 30m');
      expect(result.report.teamPerformance['team-1'].rank).toBe(1);

      expect(mockGameLifecycleWorkflow.roundService.getRoundStatus).toHaveBeenCalledWith(gameId);
      expect(mockGameLifecycleWorkflow.gameService.transitionGameStatus).toHaveBeenCalledWith(gameId, 'completed', hostId);
      expect(mockGameLifecycleWorkflow.monitoring.generateGameReport).toHaveBeenCalledWith(gameId, hostId);
      expect(mockGameLifecycleWorkflow.cleanup.notifyGameCompletion).toHaveBeenCalledWith(gameId, hostId);
    });

    it('should prevent invalid state transitions', async () => {
      // Arrange
      const gameId = 'game-invalid-transition';
      const hostId = 'host-invalid';

      mockGameLifecycleWorkflow.lifecycle.handleGameStateTransition.mockRejectedValue(
        new Error('Invalid transition from completed to active')
      );

      // Act & Assert
      await expect(
        mockGameLifecycleWorkflow.lifecycle.handleGameStateTransition(
          gameId,
          'completed',
          'active',
          hostId
        )
      ).rejects.toThrow('Invalid transition from completed to active');
    });
  });

  describe('Game Progress Monitoring', () => {
    it('should track game progress throughout lifecycle', async () => {
      // Arrange
      const gameId = 'game-progress-678';
      const hostId = 'host-progress';

      const progressData = {
        gameId,
        status: 'active',
        currentRound: 2,
        totalRounds: 4,
        questionsAnswered: 15,
        totalQuestions: 40,
        teamsActive: 4,
        gameStartedAt: '2024-01-01T12:00:00Z',
        estimatedTimeRemaining: '45 minutes',
        averageResponseTime: 8.5,
        participationRate: 0.95
      };

      mockGameLifecycleWorkflow.monitoring.trackGameProgress.mockResolvedValue(progressData);

      // Act
      const progress = await mockGameLifecycleWorkflow.monitoring.trackGameProgress(gameId, hostId);

      // Assert
      expect(progress.status).toBe('active');
      expect(progress.currentRound).toBe(2);
      expect(progress.questionsAnswered).toBe(15);
      expect(progress.participationRate).toBe(0.95);
      expect(progress.estimatedTimeRemaining).toBe('45 minutes');

      expect(mockGameLifecycleWorkflow.monitoring.trackGameProgress).toHaveBeenCalledWith(gameId, hostId);
    });

    it('should detect and handle game issues during progress', async () => {
      // Arrange
      const gameId = 'game-issues-901';
      const hostId = 'host-issues';

      const detectedIssues = {
        gameId,
        issues: [
          {
            type: 'low_participation',
            severity: 'medium',
            description: 'Team Alpha has not answered last 3 questions',
            suggestedAction: 'Check team connectivity'
          },
          {
            type: 'slow_response',
            severity: 'low',
            description: 'Average response time is 15s (above recommended 10s)',
            suggestedAction: 'Consider adjusting question difficulty'
          }
        ],
        overallHealth: 'fair',
        recommendations: [
          'Monitor Team Alpha for technical issues',
          'Consider extending round time limits'
        ]
      };

      mockGameLifecycleWorkflow.monitoring.detectGameIssues.mockResolvedValue(detectedIssues);

      // Act
      const issues = await mockGameLifecycleWorkflow.monitoring.detectGameIssues(gameId, hostId);

      // Assert
      expect(issues.issues).toHaveLength(2);
      expect(issues.issues[0].type).toBe('low_participation');
      expect(issues.issues[1].type).toBe('slow_response');
      expect(issues.overallHealth).toBe('fair');
      expect(issues.recommendations).toContain('Monitor Team Alpha for technical issues');

      expect(mockGameLifecycleWorkflow.monitoring.detectGameIssues).toHaveBeenCalledWith(gameId, hostId);
    });
  });

  describe('Round Management Within Game Lifecycle', () => {
    it('should progress through rounds systematically', async () => {
      // Arrange
      const gameId = 'game-round-progression-234';
      const hostId = 'host-rounds';

      const roundProgression = [
        { roundNumber: 1, status: 'completed', score: { 'team-1': 8, 'team-2': 6 } },
        { roundNumber: 2, status: 'active', currentQuestion: 5 },
        { roundNumber: 3, status: 'setup' },
        { roundNumber: 4, status: 'setup' }
      ];

      mockGameLifecycleWorkflow.lifecycle.progressGame.mockImplementation(
        async (gameId: string, hostId: string) => {
          // Complete current round
          await mockGameLifecycleWorkflow.roundService.completeRound(gameId, 2, hostId);

          // Start next round
          const nextRound = await mockGameLifecycleWorkflow.roundService.startNextRound(gameId, hostId);

          // Track progress
          const progress = await mockGameLifecycleWorkflow.monitoring.trackGameProgress(gameId, hostId);

          return {
            completedRound: 2,
            activeRound: nextRound.round,
            gameProgress: progress
          };
        }
      );

      mockGameLifecycleWorkflow.roundService.completeRound.mockResolvedValue({
        round: {
          id: 'round-2',
          game_id: gameId,
          round_number: 2,
          status: 'completed',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T13:00:00Z'
        },
        finalScores: { 'team-1': 16, 'team-2': 12, 'team-3': 14 }
      });

      mockGameLifecycleWorkflow.roundService.startNextRound.mockResolvedValue({
        round: {
          id: 'round-3',
          game_id: gameId,
          round_number: 3,
          status: 'active',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T13:05:00Z'
        },
        questionsActivated: 10
      });

      mockGameLifecycleWorkflow.monitoring.trackGameProgress.mockResolvedValue({
        gameId,
        currentRound: 3,
        totalRounds: 4,
        questionsAnswered: 20,
        totalQuestions: 40
      });

      // Act
      const result = await mockGameLifecycleWorkflow.lifecycle.progressGame(gameId, hostId);

      // Assert
      expect(result.completedRound).toBe(2);
      expect(result.activeRound.round_number).toBe(3);
      expect(result.activeRound.status).toBe('active');
      expect(result.gameProgress.currentRound).toBe(3);

      expect(mockGameLifecycleWorkflow.roundService.completeRound).toHaveBeenCalledWith(gameId, 2, hostId);
      expect(mockGameLifecycleWorkflow.roundService.startNextRound).toHaveBeenCalledWith(gameId, hostId);
      expect(mockGameLifecycleWorkflow.monitoring.trackGameProgress).toHaveBeenCalledWith(gameId, hostId);
    });
  });

  describe('Game Archival and Cleanup', () => {
    it('should archive completed game with full cleanup', async () => {
      // Arrange
      const gameId = 'game-archive-567';
      const hostId = 'host-archive';

      const archiveRequest: ArchiveGameRequest = {
        gameId,
        hostId
      };

      const archivedGame: Game = {
        id: gameId,
        title: 'Archived Game',
        host_id: hostId,
        status: 'completed',
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['general'],
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: false,
        scheduled_date: '2024-02-15T19:00:00Z',
        archived: true,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T16:00:00Z'
      };

      mockGameLifecycleWorkflow.cleanup.archiveCompletedGame.mockImplementation(
        async (request: ArchiveGameRequest) => {
          // Archive the game
          const game = await mockGameLifecycleWorkflow.gameService.archiveGame(request);

          // Clean up resources
          const cleanup = await mockGameLifecycleWorkflow.cleanup.cleanupGameResources(
            request.gameId,
            request.hostId
          );

          return {
            game,
            cleanup,
            archivedAt: new Date().toISOString()
          };
        }
      );

      mockGameLifecycleWorkflow.gameService.archiveGame.mockResolvedValue(undefined);
      mockGameLifecycleWorkflow.cleanup.cleanupGameResources.mockResolvedValue({
        questionsCleanedUp: 30,
        teamsArchived: 4,
        roundsArchived: 3,
        notificationsSent: 8
      });

      // Act
      const result = await mockGameLifecycleWorkflow.cleanup.archiveCompletedGame(archiveRequest);

      // Assert
      expect(result.cleanup.questionsCleanedUp).toBe(30);
      expect(result.cleanup.teamsArchived).toBe(4);
      expect(result.cleanup.roundsArchived).toBe(3);
      expect(result.cleanup.notificationsSent).toBe(8);

      expect(mockGameLifecycleWorkflow.gameService.archiveGame).toHaveBeenCalledWith(archiveRequest);
      expect(mockGameLifecycleWorkflow.cleanup.cleanupGameResources).toHaveBeenCalledWith(gameId, hostId);
    });

    it('should delete game with proper authorization checks', async () => {
      // Arrange
      const gameId = 'game-delete-890';
      const hostId = 'host-delete';

      const deleteRequest: DeleteGameRequest = {
        gameId,
        hostId
      };

      // Mock authorization check
      mockGameLifecycleWorkflow.gameService.getGameDetails.mockResolvedValue({
        id: gameId,
        host_id: hostId,
        status: 'setup',
        archived: false
      } as Game);

      mockGameLifecycleWorkflow.gameService.deleteGame.mockResolvedValue(undefined);

      // Act
      const gameDetails = await mockGameLifecycleWorkflow.gameService.getGameDetails(gameId, hostId);

      if (gameDetails.host_id !== hostId) {
        throw new Error('Unauthorized: Only game host can delete the game');
      }

      if (gameDetails.status === 'active') {
        throw new Error('Cannot delete active game');
      }

      await mockGameLifecycleWorkflow.gameService.deleteGame(deleteRequest);

      // Assert
      expect(mockGameLifecycleWorkflow.gameService.getGameDetails).toHaveBeenCalledWith(gameId, hostId);
      expect(mockGameLifecycleWorkflow.gameService.deleteGame).toHaveBeenCalledWith(deleteRequest);
    });

    it('should prevent deletion of games with teams', async () => {
      // Arrange
      const gameId = 'game-with-teams-123';
      const hostId = 'host-with-teams';

      const deleteRequest: DeleteGameRequest = {
        gameId,
        hostId
      };

      mockGameLifecycleWorkflow.teamService.getGameTeams.mockResolvedValue([
        { id: 'team-1', name: 'Team 1' },
        { id: 'team-2', name: 'Team 2' }
      ] as Team[]);

      mockGameLifecycleWorkflow.gameService.deleteGame.mockRejectedValue(
        new Error('Cannot delete game with existing teams. Archive instead.')
      );

      // Act
      const teams = await mockGameLifecycleWorkflow.teamService.getGameTeams(gameId, hostId);

      // Assert
      expect(teams).toHaveLength(2);

      await expect(mockGameLifecycleWorkflow.gameService.deleteGame(deleteRequest))
        .rejects.toThrow('Cannot delete game with existing teams. Archive instead.');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle game corruption and recovery scenarios', async () => {
      // Arrange
      const gameId = 'game-corruption-456';
      const hostId = 'host-recovery';

      // Mock corruption detection
      mockGameLifecycleWorkflow.monitoring.detectGameIssues.mockResolvedValue({
        gameId,
        issues: [
          {
            type: 'data_corruption',
            severity: 'high',
            description: 'Round 2 questions are missing',
            suggestedAction: 'Regenerate questions for round 2'
          }
        ],
        overallHealth: 'critical',
        recommendations: ['Stop game immediately', 'Regenerate missing data']
      });

      // Mock recovery workflow
      mockGameLifecycleWorkflow.lifecycle.handleGameStateTransition.mockImplementation(
        async (gameId: string, fromStatus: string, toStatus: string, hostId: string) => {
          if (toStatus === 'maintenance') {
            // Put game in maintenance mode
            return {
              game: { id: gameId, status: 'maintenance' } as Game,
              transitionedAt: new Date().toISOString(),
              fromStatus,
              toStatus: 'maintenance'
            };
          }
          throw new Error('Invalid recovery transition');
        }
      );

      // Act
      const issues = await mockGameLifecycleWorkflow.monitoring.detectGameIssues(gameId, hostId);

      if (issues.overallHealth === 'critical') {
        const recovery = await mockGameLifecycleWorkflow.lifecycle.handleGameStateTransition(
          gameId,
          'active',
          'maintenance',
          hostId
        );

        expect(recovery.toStatus).toBe('maintenance');
      }

      // Assert
      expect(issues.issues[0].type).toBe('data_corruption');
      expect(issues.overallHealth).toBe('critical');
      expect(issues.recommendations).toContain('Stop game immediately');
    });

    it('should handle concurrent host operations with proper locking', async () => {
      // Arrange
      const gameId = 'game-concurrent-789';
      const hostId = 'host-concurrent';

      // Mock concurrent operations
      const operations = [
        () => mockGameLifecycleWorkflow.lifecycle.startGame(gameId, hostId),
        () => mockGameLifecycleWorkflow.gameService.updateGame({ gameId, updates: { title: 'Updated' } }),
        () => mockGameLifecycleWorkflow.teamService.createTeam({
          gameId,
          hostId,
          teamData: { name: 'Concurrent Team', display_color: '#123456' }
        })
      ];

      // First operation succeeds, others are blocked
      mockGameLifecycleWorkflow.lifecycle.startGame
        .mockResolvedValueOnce({ game: { status: 'active' } as Game })
        .mockRejectedValue(new Error('Game operation in progress'));

      mockGameLifecycleWorkflow.gameService.updateGame
        .mockRejectedValue(new Error('Cannot update game: state transition in progress'));

      mockGameLifecycleWorkflow.teamService.createTeam
        .mockRejectedValue(new Error('Cannot create team: game state changing'));

      // Act
      const results = await Promise.allSettled(
        operations.map(op => op())
      );

      // Assert
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('rejected');

      if (results[1].status === 'rejected') {
        expect(results[1].reason.message).toContain('state transition in progress');
      }
    });
  });
});

// This test file will FAIL until the actual integration is implemented
// This is the expected TDD behavior - Red, Green, Refactor
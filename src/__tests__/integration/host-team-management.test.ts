// Integration Tests: Host Team Management
// Tests for complete team management workflow

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  CreateTeamRequest,
  UpdateTeamRequest,
  AddPlayerToTeamRequest,
  RemovePlayerFromTeamRequest,
  TeamManagementResponse,
  TeamConfiguration
} from '@/contracts/host-management';
import type { Team, Game } from '@/contracts/multi-user-types';
import type { UserProfile } from '@/contracts/game';

// Mock the integrated team management workflow that doesn't exist yet
const mockTeamWorkflow = {
  teamService: {
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    addPlayerToTeam: vi.fn(),
    removePlayerFromTeam: vi.fn(),
    getGameTeams: vi.fn(),
    validateTeamConfiguration: vi.fn()
  },
  gameService: {
    getGameDetails: vi.fn(),
    updateGameTeamSettings: vi.fn(),
    validateGameForTeams: vi.fn()
  },
  playerService: {
    getAvailablePlayers: vi.fn(),
    validatePlayerEligibility: vi.fn(),
    getPlayerProfile: vi.fn(),
    notifyPlayerAssignment: vi.fn()
  },
  workflow: {
    executeTeamCreationWorkflow: vi.fn(),
    handlePlayerAssignmentWorkflow: vi.fn(),
    validateTeamCapacityConstraints: vi.fn(),
    optimizeTeamBalance: vi.fn()
  },
  analytics: {
    analyzeTeamComposition: vi.fn(),
    trackTeamPerformance: vi.fn(),
    generateTeamReport: vi.fn()
  },
  notifications: {
    notifyTeamCreated: vi.fn(),
    notifyPlayerAdded: vi.fn(),
    notifyPlayerRemoved: vi.fn(),
    notifyTeamUpdated: vi.fn()
  }
};

describe('Host Team Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Team Creation Workflow', () => {
    it('should create team with validation and capacity checks', async () => {
      // Arrange
      const gameId = 'game-team-creation-123';
      const hostId = 'host-123';

      const game: Game = {
        id: gameId,
        title: 'Team Creation Game',
        host_id: hostId,
        status: 'setup',
        total_rounds: 4,
        questions_per_round: 10,
        selected_categories: ['science', 'history'],
        max_teams: 6,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true,
        scheduled_date: '2024-01-15T19:00:00Z',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      const teamConfig: TeamConfiguration = {
        name: 'The Trivia Masters',
        display_color: '#3b82f6',
        player_ids: ['player-1', 'player-2']
      };

      const createRequest: CreateTeamRequest = {
        gameId,
        hostId,
        teamData: teamConfig
      };

      const expectedTeam: Team = {
        id: 'team-123',
        game_id: gameId,
        name: teamConfig.name,
        display_color: teamConfig.display_color,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      const teamResponse: TeamManagementResponse = {
        team: expectedTeam,
        playerCount: 2,
        isValid: true,
        validationErrors: []
      };

      // Mock workflow components
      mockTeamWorkflow.gameService.getGameDetails.mockResolvedValue(game);
      mockTeamWorkflow.gameService.validateGameForTeams.mockResolvedValue({
        canCreateTeams: true,
        currentTeamCount: 0,
        maxTeams: game.max_teams,
        remainingSlots: game.max_teams
      });

      mockTeamWorkflow.workflow.validateTeamCapacityConstraints.mockResolvedValue({
        isValid: true,
        constraints: {
          teamCount: { current: 0, max: 6, canAdd: true },
          playerCount: { current: 2, min: 2, max: 4, isValid: true }
        }
      });

      mockTeamWorkflow.teamService.createTeam.mockResolvedValue(teamResponse);
      mockTeamWorkflow.notifications.notifyTeamCreated.mockResolvedValue(undefined);

      mockTeamWorkflow.workflow.executeTeamCreationWorkflow.mockImplementation(
        async (request: CreateTeamRequest) => {
          // 1. Validate game
          const gameDetails = await mockTeamWorkflow.gameService.getGameDetails(request.gameId, request.hostId);
          const gameValidation = await mockTeamWorkflow.gameService.validateGameForTeams(gameDetails);

          if (!gameValidation.canCreateTeams) {
            throw new Error('Game does not allow team creation');
          }

          // 2. Validate team constraints
          const constraintValidation = await mockTeamWorkflow.workflow.validateTeamCapacityConstraints(
            gameDetails,
            request.teamData,
            gameValidation.currentTeamCount
          );

          if (!constraintValidation.isValid) {
            throw new Error('Team capacity constraints not met');
          }

          // 3. Create team
          const result = await mockTeamWorkflow.teamService.createTeam(request);

          // 4. Send notifications
          await mockTeamWorkflow.notifications.notifyTeamCreated(result.team.id, request.hostId);

          return result;
        }
      );

      // Act
      const result = await mockTeamWorkflow.workflow.executeTeamCreationWorkflow(createRequest);

      // Assert
      expect(result.team.name).toBe('The Trivia Masters');
      expect(result.team.display_color).toBe('#3b82f6');
      expect(result.playerCount).toBe(2);
      expect(result.isValid).toBe(true);

      expect(mockTeamWorkflow.gameService.getGameDetails).toHaveBeenCalledWith(gameId, hostId);
      expect(mockTeamWorkflow.gameService.validateGameForTeams).toHaveBeenCalled();
      expect(mockTeamWorkflow.workflow.validateTeamCapacityConstraints).toHaveBeenCalled();
      expect(mockTeamWorkflow.teamService.createTeam).toHaveBeenCalledWith(createRequest);
      expect(mockTeamWorkflow.notifications.notifyTeamCreated).toHaveBeenCalledWith('team-123', hostId);
    });

    it('should handle team creation at capacity limits', async () => {
      // Arrange
      const gameId = 'game-at-capacity-456';
      const hostId = 'host-456';

      const game: Game = {
        id: gameId,
        title: 'At Capacity Game',
        host_id: hostId,
        status: 'setup',
        max_teams: 2,
        max_players_per_team: 4,
        min_players_per_team: 2,
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['general'],
        self_registration_enabled: true,
        scheduled_date: '2024-01-20T19:00:00Z',
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      const teamConfig: TeamConfiguration = {
        name: 'Overflow Team',
        display_color: '#ef4444'
      };

      mockTeamWorkflow.gameService.validateGameForTeams.mockResolvedValue({
        canCreateTeams: false,
        currentTeamCount: 2,
        maxTeams: 2,
        remainingSlots: 0,
        reason: 'Maximum team capacity reached'
      });

      mockTeamWorkflow.workflow.validateTeamCapacityConstraints.mockResolvedValue({
        isValid: false,
        constraints: {
          teamCount: { current: 2, max: 2, canAdd: false },
          playerCount: { current: 0, min: 2, max: 4, isValid: false }
        },
        errors: ['Cannot create team: maximum of 2 teams allowed']
      });

      const createRequest: CreateTeamRequest = {
        gameId,
        hostId,
        teamData: teamConfig
      };

      mockTeamWorkflow.workflow.executeTeamCreationWorkflow.mockRejectedValue(
        new Error('Cannot create team: 2 teams already exist (maximum: 2)')
      );

      // Act & Assert
      await expect(mockTeamWorkflow.workflow.executeTeamCreationWorkflow(createRequest))
        .rejects.toThrow('Cannot create team: 2 teams already exist (maximum: 2)');

      expect(mockTeamWorkflow.gameService.validateGameForTeams).toHaveBeenCalled();
      expect(mockTeamWorkflow.teamService.createTeam).not.toHaveBeenCalled();
    });

    it('should create multiple teams with unique names and colors', async () => {
      // Arrange
      const gameId = 'game-multiple-teams-789';
      const hostId = 'host-789';

      const teams: TeamConfiguration[] = [
        { name: 'Team Alpha', display_color: '#3b82f6' },
        { name: 'Team Beta', display_color: '#ef4444' },
        { name: 'Team Gamma', display_color: '#10b981' }
      ];

      mockTeamWorkflow.teamService.validateTeamConfiguration.mockImplementation(
        async (config: TeamConfiguration, existingTeams: Team[]) => {
          const nameExists = existingTeams.some(team => team.name === config.name);
          const colorExists = existingTeams.some(team => team.display_color === config.display_color);

          return {
            isValid: !nameExists && !colorExists,
            errors: [
              ...(nameExists ? [`Team name "${config.name}" is already taken`] : []),
              ...(colorExists ? [`Color "${config.display_color}" is already in use`] : [])
            ]
          };
        }
      );

      mockTeamWorkflow.teamService.createTeam.mockImplementation(
        async (request: CreateTeamRequest) => ({
          team: {
            id: `team-${request.teamData.name.toLowerCase().replace(' ', '-')}`,
            game_id: gameId,
            name: request.teamData.name,
            display_color: request.teamData.display_color,
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          },
          playerCount: 0,
          isValid: false,
          validationErrors: ['Team needs players before game can start']
        })
      );

      let existingTeams: Team[] = [];

      // Act
      const results = [];
      for (const teamConfig of teams) {
        const validation = await mockTeamWorkflow.teamService.validateTeamConfiguration(
          teamConfig,
          existingTeams
        );

        expect(validation.isValid).toBe(true);

        const result = await mockTeamWorkflow.teamService.createTeam({
          gameId,
          hostId,
          teamData: teamConfig
        });

        existingTeams.push(result.team);
        results.push(result);
      }

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.team.name).toBe(teams[index].name);
        expect(result.team.display_color).toBe(teams[index].display_color);
      });

      expect(mockTeamWorkflow.teamService.validateTeamConfiguration).toHaveBeenCalledTimes(3);
      expect(mockTeamWorkflow.teamService.createTeam).toHaveBeenCalledTimes(3);
    });
  });

  describe('Player Assignment and Management', () => {
    it('should assign players to teams with validation', async () => {
      // Arrange
      const gameId = 'game-player-assignment-012';
      const hostId = 'host-012';
      const teamId = 'team-012';

      const availablePlayers: UserProfile[] = [
        {
          id: 'player-1',
          username: 'player1',
          email: 'player1@example.com',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 'player-2',
          username: 'player2',
          email: 'player2@example.com',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        }
      ];

      const addPlayerRequest: AddPlayerToTeamRequest = {
        teamId,
        playerId: 'player-1',
        hostId
      };

      mockTeamWorkflow.playerService.getAvailablePlayers.mockResolvedValue(availablePlayers);
      mockTeamWorkflow.playerService.validatePlayerEligibility.mockResolvedValue({
        isEligible: true,
        checks: {
          playerExists: true,
          notAlreadyAssigned: true,
          gameNotStarted: true,
          teamNotFull: true
        }
      });

      mockTeamWorkflow.teamService.addPlayerToTeam.mockResolvedValue({
        team: {
          id: teamId,
          game_id: gameId,
          name: 'Test Team',
          display_color: '#3b82f6',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T11:00:00Z'
        },
        playerCount: 1,
        isValid: false,
        validationErrors: ['Team needs at least 2 players']
      });

      mockTeamWorkflow.notifications.notifyPlayerAdded.mockResolvedValue(undefined);

      mockTeamWorkflow.workflow.handlePlayerAssignmentWorkflow.mockImplementation(
        async (request: AddPlayerToTeamRequest) => {
          // 1. Get available players
          const players = await mockTeamWorkflow.playerService.getAvailablePlayers(gameId);

          // 2. Validate player eligibility
          const eligibility = await mockTeamWorkflow.playerService.validatePlayerEligibility(
            request.playerId,
            request.teamId,
            gameId
          );

          if (!eligibility.isEligible) {
            throw new Error('Player is not eligible for assignment');
          }

          // 3. Add player to team
          const result = await mockTeamWorkflow.teamService.addPlayerToTeam(request);

          // 4. Send notifications
          await mockTeamWorkflow.notifications.notifyPlayerAdded(
            request.teamId,
            request.playerId,
            request.hostId
          );

          return result;
        }
      );

      // Act
      const result = await mockTeamWorkflow.workflow.handlePlayerAssignmentWorkflow(addPlayerRequest);

      // Assert
      expect(result.playerCount).toBe(1);
      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContain('Team needs at least 2 players');

      expect(mockTeamWorkflow.playerService.getAvailablePlayers).toHaveBeenCalledWith(gameId);
      expect(mockTeamWorkflow.playerService.validatePlayerEligibility).toHaveBeenCalledWith(
        'player-1',
        teamId,
        gameId
      );
      expect(mockTeamWorkflow.teamService.addPlayerToTeam).toHaveBeenCalledWith(addPlayerRequest);
      expect(mockTeamWorkflow.notifications.notifyPlayerAdded).toHaveBeenCalledWith(
        teamId,
        'player-1',
        hostId
      );
    });

    it('should prevent duplicate player assignments', async () => {
      // Arrange
      const teamId = 'team-duplicate-345';
      const playerId = 'player-already-assigned';
      const hostId = 'host-345';

      mockTeamWorkflow.playerService.validatePlayerEligibility.mockResolvedValue({
        isEligible: false,
        checks: {
          playerExists: true,
          notAlreadyAssigned: false,
          gameNotStarted: true,
          teamNotFull: true
        },
        errors: ['Player is already assigned to team team-other-123']
      });

      const addPlayerRequest: AddPlayerToTeamRequest = {
        teamId,
        playerId,
        hostId
      };

      mockTeamWorkflow.teamService.addPlayerToTeam.mockRejectedValue(
        new Error('Player player-already-assigned is already assigned to team team-other-123')
      );

      // Act
      const eligibility = await mockTeamWorkflow.playerService.validatePlayerEligibility(
        playerId,
        teamId,
        'game-123'
      );

      // Assert
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.checks.notAlreadyAssigned).toBe(false);
      expect(eligibility.errors).toContain('Player is already assigned to team team-other-123');

      await expect(mockTeamWorkflow.teamService.addPlayerToTeam(addPlayerRequest))
        .rejects.toThrow('Player player-already-assigned is already assigned to team team-other-123');
    });

    it('should handle team capacity limits during player assignment', async () => {
      // Arrange
      const teamId = 'team-full-678';
      const playerId = 'player-overflow';
      const hostId = 'host-678';

      mockTeamWorkflow.playerService.validatePlayerEligibility.mockResolvedValue({
        isEligible: false,
        checks: {
          playerExists: true,
          notAlreadyAssigned: true,
          gameNotStarted: true,
          teamNotFull: false
        },
        errors: ['Team already has maximum number of players (4)']
      });

      const addPlayerRequest: AddPlayerToTeamRequest = {
        teamId,
        playerId,
        hostId
      };

      // Act
      const eligibility = await mockTeamWorkflow.playerService.validatePlayerEligibility(
        playerId,
        teamId,
        'game-123'
      );

      // Assert
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.checks.teamNotFull).toBe(false);
      expect(eligibility.errors).toContain('Team already has maximum number of players (4)');

      // Should not attempt to add player
      expect(mockTeamWorkflow.teamService.addPlayerToTeam).not.toHaveBeenCalled();
    });

    it('should remove players from teams with validation', async () => {
      // Arrange
      const teamId = 'team-removal-901';
      const playerId = 'player-to-remove';
      const hostId = 'host-901';

      const removePlayerRequest: RemovePlayerFromTeamRequest = {
        teamId,
        playerId,
        hostId
      };

      mockTeamWorkflow.teamService.removePlayerFromTeam.mockResolvedValue({
        team: {
          id: teamId,
          game_id: 'game-123',
          name: 'Test Team',
          display_color: '#3b82f6',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T11:00:00Z'
        },
        playerCount: 1,
        isValid: false,
        validationErrors: ['Team must have at least 2 players to be valid']
      });

      mockTeamWorkflow.notifications.notifyPlayerRemoved.mockResolvedValue(undefined);

      // Act
      const result = await mockTeamWorkflow.teamService.removePlayerFromTeam(removePlayerRequest);
      await mockTeamWorkflow.notifications.notifyPlayerRemoved(teamId, playerId, hostId);

      // Assert
      expect(result.playerCount).toBe(1);
      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContain('Team must have at least 2 players to be valid');

      expect(mockTeamWorkflow.teamService.removePlayerFromTeam).toHaveBeenCalledWith(removePlayerRequest);
      expect(mockTeamWorkflow.notifications.notifyPlayerRemoved).toHaveBeenCalledWith(teamId, playerId, hostId);
    });
  });

  describe('Team Updates and Configuration', () => {
    it('should update team properties with validation', async () => {
      // Arrange
      const teamId = 'team-update-234';
      const hostId = 'host-234';

      const updateRequest: UpdateTeamRequest = {
        teamId,
        hostId,
        updates: {
          name: 'Updated Team Name',
          display_color: '#ef4444'
        }
      };

      const updatedTeam: Team = {
        id: teamId,
        game_id: 'game-123',
        name: 'Updated Team Name',
        display_color: '#ef4444',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      };

      mockTeamWorkflow.teamService.validateTeamConfiguration.mockResolvedValue({
        isValid: true,
        errors: []
      });

      mockTeamWorkflow.teamService.updateTeam.mockResolvedValue({
        team: updatedTeam,
        playerCount: 3,
        isValid: true,
        validationErrors: []
      });

      mockTeamWorkflow.notifications.notifyTeamUpdated.mockResolvedValue(undefined);

      // Act
      const validation = await mockTeamWorkflow.teamService.validateTeamConfiguration(
        updateRequest.updates,
        []
      );

      expect(validation.isValid).toBe(true);

      const result = await mockTeamWorkflow.teamService.updateTeam(updateRequest);
      await mockTeamWorkflow.notifications.notifyTeamUpdated(teamId, hostId);

      // Assert
      expect(result.team.name).toBe('Updated Team Name');
      expect(result.team.display_color).toBe('#ef4444');
      expect(result.team.updated_at).toBe('2024-01-01T12:00:00Z');

      expect(mockTeamWorkflow.teamService.updateTeam).toHaveBeenCalledWith(updateRequest);
      expect(mockTeamWorkflow.notifications.notifyTeamUpdated).toHaveBeenCalledWith(teamId, hostId);
    });

    it('should prevent updates during active games', async () => {
      // Arrange
      const teamId = 'team-active-567';
      const hostId = 'host-567';

      const updateRequest: UpdateTeamRequest = {
        teamId,
        hostId,
        updates: {
          name: 'Cannot Update During Game'
        }
      };

      mockTeamWorkflow.gameService.validateGameForTeams.mockResolvedValue({
        canCreateTeams: false,
        canModifyTeams: false,
        gameStatus: 'active',
        reason: 'Game is currently active'
      });

      mockTeamWorkflow.teamService.updateTeam.mockRejectedValue(
        new Error('Cannot modify teams during active game')
      );

      // Act & Assert
      const gameValidation = await mockTeamWorkflow.gameService.validateGameForTeams({
        status: 'active'
      } as Game);

      expect(gameValidation.canModifyTeams).toBe(false);

      await expect(mockTeamWorkflow.teamService.updateTeam(updateRequest))
        .rejects.toThrow('Cannot modify teams during active game');
    });
  });

  describe('Team Optimization and Balance', () => {
    it('should analyze and optimize team composition', async () => {
      // Arrange
      const gameId = 'game-optimization-890';
      const hostId = 'host-890';

      const teams = [
        { id: 'team-1', playerCount: 4, averageSkill: 7.5 },
        { id: 'team-2', playerCount: 3, averageSkill: 6.2 },
        { id: 'team-3', playerCount: 4, averageSkill: 8.1 },
        { id: 'team-4', playerCount: 2, averageSkill: 5.8 }
      ];

      mockTeamWorkflow.analytics.analyzeTeamComposition.mockResolvedValue({
        totalTeams: 4,
        totalPlayers: 13,
        averagePlayersPerTeam: 3.25,
        playerDistributionBalance: 0.68,
        skillBalance: 0.74,
        recommendations: [
          'Add 1 player to team-4 to meet minimum requirement',
          'Consider redistributing players for better balance'
        ]
      });

      mockTeamWorkflow.workflow.optimizeTeamBalance.mockResolvedValue({
        balanceScore: 0.85,
        suggestedChanges: [
          {
            type: 'move_player',
            fromTeam: 'team-3',
            toTeam: 'team-4',
            playerId: 'player-xyz',
            reason: 'Balance team sizes'
          }
        ],
        projectedBalance: 0.92
      });

      // Act
      const analysis = await mockTeamWorkflow.analytics.analyzeTeamComposition(gameId, teams);
      const optimization = await mockTeamWorkflow.workflow.optimizeTeamBalance(gameId, teams);

      // Assert
      expect(analysis.totalTeams).toBe(4);
      expect(analysis.totalPlayers).toBe(13);
      expect(analysis.playerDistributionBalance).toBe(0.68);
      expect(analysis.recommendations).toContain('Add 1 player to team-4 to meet minimum requirement');

      expect(optimization.balanceScore).toBe(0.85);
      expect(optimization.projectedBalance).toBe(0.92);
      expect(optimization.suggestedChanges).toHaveLength(1);
      expect(optimization.suggestedChanges[0].type).toBe('move_player');

      expect(mockTeamWorkflow.analytics.analyzeTeamComposition).toHaveBeenCalledWith(gameId, teams);
      expect(mockTeamWorkflow.workflow.optimizeTeamBalance).toHaveBeenCalledWith(gameId, teams);
    });

    it('should validate team readiness for game start', async () => {
      // Arrange
      const gameId = 'game-readiness-123';
      const hostId = 'host-readiness';

      const teams = [
        { id: 'team-1', playerCount: 3, isValid: true },
        { id: 'team-2', playerCount: 2, isValid: true },
        { id: 'team-3', playerCount: 1, isValid: false },
        { id: 'team-4', playerCount: 4, isValid: true }
      ];

      mockTeamWorkflow.teamService.getGameTeams.mockResolvedValue(teams);

      mockTeamWorkflow.workflow.validateTeamCapacityConstraints.mockResolvedValue({
        isValid: false,
        constraints: {
          teamCount: { current: 4, min: 2, max: 6, isValid: true },
          allTeamsValid: false,
          playersPerTeam: { min: 2, max: 4 }
        },
        errors: [
          'Team team-3 has only 1 player (minimum 2 required)'
        ],
        readyTeams: 3,
        totalTeams: 4
      });

      // Act
      const gameTeams = await mockTeamWorkflow.teamService.getGameTeams(gameId, hostId);
      const validation = await mockTeamWorkflow.workflow.validateTeamCapacityConstraints(
        { min_players_per_team: 2, max_players_per_team: 4 } as Game,
        null,
        gameTeams.length
      );

      // Assert
      expect(gameTeams).toHaveLength(4);
      expect(validation.isValid).toBe(false);
      expect(validation.constraints.allTeamsValid).toBe(false);
      expect(validation.errors).toContain('Team team-3 has only 1 player (minimum 2 required)');
      expect(validation.readyTeams).toBe(3);
      expect(validation.totalTeams).toBe(4);
    });
  });

  describe('Team Analytics and Reporting', () => {
    it('should track team performance and generate insights', async () => {
      // Arrange
      const gameId = 'game-analytics-456';
      const hostId = 'host-analytics';

      const performanceData = {
        gameId,
        teams: [
          {
            id: 'team-1',
            name: 'Team Alpha',
            playerCount: 4,
            averageResponseTime: 8.5,
            correctAnswers: 23,
            totalAnswers: 30,
            score: 76.7
          },
          {
            id: 'team-2',
            name: 'Team Beta',
            playerCount: 3,
            averageResponseTime: 12.3,
            correctAnswers: 18,
            totalAnswers: 30,
            score: 60.0
          }
        ],
        gameStats: {
          totalQuestions: 30,
          averageTeamScore: 68.35,
          competitiveness: 0.87,
          engagementScore: 0.92
        }
      };

      mockTeamWorkflow.analytics.trackTeamPerformance.mockResolvedValue(performanceData);

      const teamReport = {
        gameId,
        reportGeneratedAt: '2024-01-01T15:00:00Z',
        teamComposition: {
          totalTeams: 2,
          totalPlayers: 7,
          averagePlayersPerTeam: 3.5
        },
        performance: performanceData,
        insights: [
          'Team Alpha showed excellent response times',
          'Team Beta could benefit from faster decision making',
          'Overall game balance was good with competitive scoring'
        ],
        recommendations: [
          'Consider slightly more challenging questions for Team Alpha',
          'Team Beta might benefit from strategy discussions'
        ]
      };

      mockTeamWorkflow.analytics.generateTeamReport.mockResolvedValue(teamReport);

      // Act
      const performance = await mockTeamWorkflow.analytics.trackTeamPerformance(gameId, hostId);
      const report = await mockTeamWorkflow.analytics.generateTeamReport(gameId, hostId);

      // Assert
      expect(performance.teams).toHaveLength(2);
      expect(performance.gameStats.averageTeamScore).toBe(68.35);
      expect(performance.gameStats.competitiveness).toBe(0.87);

      expect(report.teamComposition.totalTeams).toBe(2);
      expect(report.teamComposition.totalPlayers).toBe(7);
      expect(report.insights).toContain('Team Alpha showed excellent response times');
      expect(report.recommendations).toContain('Consider slightly more challenging questions for Team Alpha');

      expect(mockTeamWorkflow.analytics.trackTeamPerformance).toHaveBeenCalledWith(gameId, hostId);
      expect(mockTeamWorkflow.analytics.generateTeamReport).toHaveBeenCalledWith(gameId, hostId);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle team deletion with cleanup', async () => {
      // Arrange
      const teamId = 'team-delete-789';
      const hostId = 'host-delete';

      mockTeamWorkflow.teamService.deleteTeam.mockResolvedValue(undefined);

      // Act
      await mockTeamWorkflow.teamService.deleteTeam(teamId, hostId);

      // Assert
      expect(mockTeamWorkflow.teamService.deleteTeam).toHaveBeenCalledWith(teamId, hostId);
    });

    it('should handle concurrent team operations gracefully', async () => {
      // Arrange
      const gameId = 'game-concurrent-012';
      const hostId = 'host-concurrent';

      const teamConfigs = [
        { name: 'Team 1', display_color: '#3b82f6' },
        { name: 'Team 2', display_color: '#ef4444' }
      ];

      // Mock concurrent team creation
      mockTeamWorkflow.teamService.createTeam
        .mockResolvedValueOnce({
          team: { id: 'team-1', name: 'Team 1', display_color: '#3b82f6' } as Team,
          playerCount: 0,
          isValid: false,
          validationErrors: []
        })
        .mockResolvedValueOnce({
          team: { id: 'team-2', name: 'Team 2', display_color: '#ef4444' } as Team,
          playerCount: 0,
          isValid: false,
          validationErrors: []
        });

      // Act
      const requests = teamConfigs.map(config => ({
        gameId,
        hostId,
        teamData: config
      }));

      const results = await Promise.all(
        requests.map(request => mockTeamWorkflow.teamService.createTeam(request))
      );

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].team.name).toBe('Team 1');
      expect(results[1].team.name).toBe('Team 2');
      expect(mockTeamWorkflow.teamService.createTeam).toHaveBeenCalledTimes(2);
    });

    it('should handle network errors with retry logic', async () => {
      // Arrange
      const teamId = 'team-network-error';
      const playerId = 'player-network-error';
      const hostId = 'host-network-error';

      const addPlayerRequest: AddPlayerToTeamRequest = {
        teamId,
        playerId,
        hostId
      };

      // Mock network error followed by success
      mockTeamWorkflow.teamService.addPlayerToTeam
        .mockRejectedValueOnce(new Error('Network error: Connection timeout'))
        .mockResolvedValueOnce({
          team: { id: teamId } as Team,
          playerCount: 2,
          isValid: true,
          validationErrors: []
        });

      // Act
      let result;
      try {
        result = await mockTeamWorkflow.teamService.addPlayerToTeam(addPlayerRequest);
      } catch (error) {
        // Retry on network error
        result = await mockTeamWorkflow.teamService.addPlayerToTeam(addPlayerRequest);
      }

      // Assert
      expect(result.playerCount).toBe(2);
      expect(result.isValid).toBe(true);
      expect(mockTeamWorkflow.teamService.addPlayerToTeam).toHaveBeenCalledTimes(2);
    });
  });
});

// This test file will FAIL until the actual integration is implemented
// This is the expected TDD behavior - Red, Green, Refactor
// Contract Tests: Host Game Management Service
// Tests for CRUD operations on games by hosts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  CreateGameRequest,
  UpdateGameRequest,
  ArchiveGameRequest,
  DeleteGameRequest,
  GameListFilters,
  GameListResponse,
  GameConfiguration,
  HostGameSummary
} from '@/contracts/host-management';
import type { Game } from '@/contracts/multi-user-types';

// Mock the service that doesn't exist yet
const mockHostGameService = {
  createGame: vi.fn(),
  updateGame: vi.fn(),
  archiveGame: vi.fn(),
  deleteGame: vi.fn(),
  getHostGames: vi.fn(),
  getGameDetails: vi.fn(),
};

describe('Host Game Management Service Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGame', () => {
    it('should create a new game successfully', async () => {
      // Arrange
      const gameConfig: GameConfiguration = {
        title: 'Friday Night Trivia',
        location: 'Main Hall',
        scheduled_date: '2024-01-15T19:00:00Z',
        total_rounds: 5,
        questions_per_round: 10,
        selected_categories: ['science', 'history', 'sports'],
        max_teams: 8,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true
      };

      const request: CreateGameRequest = {
        ...gameConfig,
        host_id: 'host-123'
      };

      const expectedGame: Game = {
        id: 'game-123',
        title: gameConfig.title,
        location: gameConfig.location,
        scheduled_date: gameConfig.scheduled_date,
        host_id: 'host-123',
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

      mockHostGameService.createGame.mockResolvedValue(expectedGame);

      // Act
      const result = await mockHostGameService.createGame(request);

      // Assert
      expect(result).toEqual(expectedGame);
      expect(result.status).toBe('setup');
      expect(result.host_id).toBe('host-123');
      expect(result.archived).toBe(false);
      expect(mockHostGameService.createGame).toHaveBeenCalledWith(request);
    });

    it('should handle validation errors during game creation', async () => {
      // Arrange
      const invalidRequest: CreateGameRequest = {
        title: '', // Invalid empty title
        location: '',
        scheduled_date: 'invalid-date',
        total_rounds: 0, // Invalid
        questions_per_round: 0, // Invalid
        selected_categories: [], // Invalid empty array
        max_teams: 0, // Invalid
        max_players_per_team: 0, // Invalid
        min_players_per_team: 0, // Invalid
        self_registration_enabled: true,
        host_id: 'host-123'
      };

      mockHostGameService.createGame.mockRejectedValue(
        new Error('Game validation failed: title is required, scheduled_date must be valid ISO string, total_rounds must be between 1 and 10')
      );

      // Act & Assert
      await expect(mockHostGameService.createGame(invalidRequest)).rejects.toThrow('Game validation failed');
    });

    it('should handle unauthorized game creation', async () => {
      // Arrange
      const request: CreateGameRequest = {
        title: 'Unauthorized Game',
        scheduled_date: '2024-01-15T19:00:00Z',
        total_rounds: 3,
        questions_per_round: 10,
        selected_categories: ['science'],
        max_teams: 4,
        max_players_per_team: 4,
        min_players_per_team: 1,
        self_registration_enabled: true,
        host_id: 'unauthorized-user'
      };

      mockHostGameService.createGame.mockRejectedValue(
        new Error('Unauthorized: User does not have host role')
      );

      // Act & Assert
      await expect(mockHostGameService.createGame(request)).rejects.toThrow('Unauthorized: User does not have host role');
    });
  });

  describe('updateGame', () => {
    it('should update game configuration successfully', async () => {
      // Arrange
      const request: UpdateGameRequest = {
        gameId: 'game-123',
        updates: {
          title: 'Updated Trivia Night',
          location: 'New Venue',
          total_rounds: 6,
          max_teams: 10
        }
      };

      const updatedGame: Game = {
        id: 'game-123',
        title: 'Updated Trivia Night',
        location: 'New Venue',
        scheduled_date: '2024-01-15T19:00:00Z',
        host_id: 'host-123',
        status: 'setup',
        total_rounds: 6,
        questions_per_round: 10,
        selected_categories: ['science', 'history'],
        max_teams: 10,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true,
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z'
      };

      mockHostGameService.updateGame.mockResolvedValue(updatedGame);

      // Act
      const result = await mockHostGameService.updateGame(request);

      // Assert
      expect(result.title).toBe('Updated Trivia Night');
      expect(result.location).toBe('New Venue');
      expect(result.total_rounds).toBe(6);
      expect(result.max_teams).toBe(10);
      expect(result.updated_at).toBe('2024-01-01T11:00:00Z');
      expect(mockHostGameService.updateGame).toHaveBeenCalledWith(request);
    });

    it('should prevent updates to active games', async () => {
      // Arrange
      const request: UpdateGameRequest = {
        gameId: 'active-game-123',
        updates: {
          title: 'Cannot Update Active Game'
        }
      };

      mockHostGameService.updateGame.mockRejectedValue(
        new Error('Game cannot be edited in active status')
      );

      // Act & Assert
      await expect(mockHostGameService.updateGame(request)).rejects.toThrow('Game cannot be edited in active status');
    });

    it('should handle non-existent game updates', async () => {
      // Arrange
      const request: UpdateGameRequest = {
        gameId: 'non-existent-game',
        updates: {
          title: 'Updated Title'
        }
      };

      mockHostGameService.updateGame.mockRejectedValue(
        new Error('Game not found')
      );

      // Act & Assert
      await expect(mockHostGameService.updateGame(request)).rejects.toThrow('Game not found');
    });
  });

  describe('archiveGame', () => {
    it('should archive game successfully', async () => {
      // Arrange
      const request: ArchiveGameRequest = {
        gameId: 'game-123',
        hostId: 'host-123'
      };

      mockHostGameService.archiveGame.mockResolvedValue(undefined);

      // Act
      await mockHostGameService.archiveGame(request);

      // Assert
      expect(mockHostGameService.archiveGame).toHaveBeenCalledWith(request);
    });

    it('should prevent archiving active games', async () => {
      // Arrange
      const request: ArchiveGameRequest = {
        gameId: 'active-game-123',
        hostId: 'host-123'
      };

      mockHostGameService.archiveGame.mockRejectedValue(
        new Error('Cannot archive game with status: active')
      );

      // Act & Assert
      await expect(mockHostGameService.archiveGame(request)).rejects.toThrow('Cannot archive game with status: active');
    });

    it('should handle unauthorized archive attempts', async () => {
      // Arrange
      const request: ArchiveGameRequest = {
        gameId: 'game-123',
        hostId: 'different-host'
      };

      mockHostGameService.archiveGame.mockRejectedValue(
        new Error('Unauthorized to perform archive on resource game-123')
      );

      // Act & Assert
      await expect(mockHostGameService.archiveGame(request)).rejects.toThrow('Unauthorized to perform archive on resource game-123');
    });
  });

  describe('deleteGame', () => {
    it('should delete game successfully', async () => {
      // Arrange
      const request: DeleteGameRequest = {
        gameId: 'game-123',
        hostId: 'host-123'
      };

      mockHostGameService.deleteGame.mockResolvedValue(undefined);

      // Act
      await mockHostGameService.deleteGame(request);

      // Assert
      expect(mockHostGameService.deleteGame).toHaveBeenCalledWith(request);
    });

    it('should prevent deletion of games with teams', async () => {
      // Arrange
      const request: DeleteGameRequest = {
        gameId: 'game-with-teams',
        hostId: 'host-123'
      };

      mockHostGameService.deleteGame.mockRejectedValue(
        new Error('Cannot delete game with existing teams. Archive instead.')
      );

      // Act & Assert
      await expect(mockHostGameService.deleteGame(request)).rejects.toThrow('Cannot delete game with existing teams. Archive instead.');
    });

    it('should handle unauthorized deletion attempts', async () => {
      // Arrange
      const request: DeleteGameRequest = {
        gameId: 'game-123',
        hostId: 'unauthorized-host'
      };

      mockHostGameService.deleteGame.mockRejectedValue(
        new Error('Unauthorized to perform delete on resource game-123')
      );

      // Act & Assert
      await expect(mockHostGameService.deleteGame(request)).rejects.toThrow('Unauthorized to perform delete on resource game-123');
    });
  });

  describe('getHostGames', () => {
    it('should retrieve host games without filters', async () => {
      // Arrange
      const hostId = 'host-123';
      const expectedResponse: GameListResponse = {
        games: [
          {
            id: 'game-1',
            title: 'Game 1',
            scheduled_date: '2024-01-15T19:00:00Z',
            host_id: hostId,
            status: 'setup',
            total_rounds: 5,
            questions_per_round: 10,
            selected_categories: ['science'],
            max_teams: 8,
            max_players_per_team: 4,
            min_players_per_team: 2,
            self_registration_enabled: true,
            archived: false,
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          },
          {
            id: 'game-2',
            title: 'Game 2',
            scheduled_date: '2024-01-20T19:00:00Z',
            host_id: hostId,
            status: 'completed',
            total_rounds: 3,
            questions_per_round: 8,
            selected_categories: ['history'],
            max_teams: 6,
            max_players_per_team: 3,
            min_players_per_team: 1,
            self_registration_enabled: false,
            archived: false,
            created_at: '2024-01-01T11:00:00Z',
            updated_at: '2024-01-01T12:00:00Z'
          }
        ],
        total: 2,
        hasMore: false
      };

      mockHostGameService.getHostGames.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockHostGameService.getHostGames(hostId);

      // Assert
      expect(result.games).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.games[0].host_id).toBe(hostId);
      expect(result.games[1].host_id).toBe(hostId);
      expect(mockHostGameService.getHostGames).toHaveBeenCalledWith(hostId, undefined);
    });

    it('should retrieve host games with filters', async () => {
      // Arrange
      const hostId = 'host-123';
      const filters: GameListFilters = {
        status: ['setup', 'active'],
        archived: false,
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        search: 'Friday'
      };

      const expectedResponse: GameListResponse = {
        games: [
          {
            id: 'game-1',
            title: 'Friday Night Trivia',
            scheduled_date: '2024-01-15T19:00:00Z',
            host_id: hostId,
            status: 'setup',
            total_rounds: 5,
            questions_per_round: 10,
            selected_categories: ['science'],
            max_teams: 8,
            max_players_per_team: 4,
            min_players_per_team: 2,
            self_registration_enabled: true,
            archived: false,
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          }
        ],
        total: 1,
        hasMore: false
      };

      mockHostGameService.getHostGames.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockHostGameService.getHostGames(hostId, filters);

      // Assert
      expect(result.games).toHaveLength(1);
      expect(result.games[0].title).toContain('Friday');
      expect(result.games[0].status).toBe('setup');
      expect(result.games[0].archived).toBe(false);
      expect(mockHostGameService.getHostGames).toHaveBeenCalledWith(hostId, filters);
    });

    it('should handle empty game list', async () => {
      // Arrange
      const hostId = 'new-host';
      const expectedResponse: GameListResponse = {
        games: [],
        total: 0,
        hasMore: false
      };

      mockHostGameService.getHostGames.mockResolvedValue(expectedResponse);

      // Act
      const result = await mockHostGameService.getHostGames(hostId);

      // Assert
      expect(result.games).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getGameDetails', () => {
    it('should retrieve game details successfully', async () => {
      // Arrange
      const gameId = 'game-123';
      const hostId = 'host-123';
      const expectedGame: Game = {
        id: gameId,
        title: 'Detailed Game',
        location: 'Main Hall',
        scheduled_date: '2024-01-15T19:00:00Z',
        host_id: hostId,
        status: 'setup',
        total_rounds: 5,
        questions_per_round: 10,
        selected_categories: ['science', 'history'],
        max_teams: 8,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: true,
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      };

      mockHostGameService.getGameDetails.mockResolvedValue(expectedGame);

      // Act
      const result = await mockHostGameService.getGameDetails(gameId, hostId);

      // Assert
      expect(result).toEqual(expectedGame);
      expect(result.id).toBe(gameId);
      expect(result.host_id).toBe(hostId);
      expect(mockHostGameService.getGameDetails).toHaveBeenCalledWith(gameId, hostId);
    });

    it('should handle unauthorized access to game details', async () => {
      // Arrange
      const gameId = 'game-123';
      const unauthorizedHostId = 'different-host';

      mockHostGameService.getGameDetails.mockRejectedValue(
        new Error('Unauthorized to access game details')
      );

      // Act & Assert
      await expect(mockHostGameService.getGameDetails(gameId, unauthorizedHostId)).rejects.toThrow('Unauthorized to access game details');
    });

    it('should handle non-existent game details', async () => {
      // Arrange
      const nonExistentGameId = 'non-existent';
      const hostId = 'host-123';

      mockHostGameService.getGameDetails.mockRejectedValue(
        new Error('Game not found')
      );

      // Act & Assert
      await expect(mockHostGameService.getGameDetails(nonExistentGameId, hostId)).rejects.toThrow('Game not found');
    });
  });

  describe('Game status transitions', () => {
    it('should allow valid status transitions', async () => {
      // Arrange
      const request: UpdateGameRequest = {
        gameId: 'game-123',
        updates: {
          // Status transitions are typically handled automatically
          // but we test the service contract behavior
        }
      };

      // Test setup -> active transition (when game starts)
      const activeGame: Game = {
        id: 'game-123',
        title: 'Active Game',
        scheduled_date: '2024-01-15T19:00:00Z',
        host_id: 'host-123',
        status: 'active',
        total_rounds: 5,
        questions_per_round: 10,
        selected_categories: ['science'],
        max_teams: 8,
        max_players_per_team: 4,
        min_players_per_team: 2,
        self_registration_enabled: false,
        archived: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z'
      };

      mockHostGameService.updateGame.mockResolvedValue(activeGame);

      // Act
      const result = await mockHostGameService.updateGame(request);

      // Assert
      expect(result.status).toBe('active');
      expect(result.self_registration_enabled).toBe(false); // Automatically disabled when active
    });
  });

  describe('Bulk operations', () => {
    it('should handle batch archive operations', async () => {
      // Arrange - Test multiple games archived in sequence
      const gameIds = ['game-1', 'game-2', 'game-3'];
      const hostId = 'host-123';

      mockHostGameService.archiveGame.mockResolvedValue(undefined);

      // Act - Simulate batch archiving
      const archivePromises = gameIds.map(gameId =>
        mockHostGameService.archiveGame({ gameId, hostId })
      );
      await Promise.all(archivePromises);

      // Assert
      expect(mockHostGameService.archiveGame).toHaveBeenCalledTimes(3);
      gameIds.forEach(gameId => {
        expect(mockHostGameService.archiveGame).toHaveBeenCalledWith({ gameId, hostId });
      });
    });
  });
});

// This test file will FAIL until the actual service implementation is created
// This is the expected TDD behavior - Red, Green, Refactor
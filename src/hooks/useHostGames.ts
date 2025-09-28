import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  HostGame,
  HostDashboardData,
  CreateGameRequest,
  UpdateGameRequest,
  HostGameService
} from '@/contracts/host-management';

interface UseHostGamesOptions {
  gameService: HostGameService;
  userId: string;
  autoFetch?: boolean;
  refreshInterval?: number;
}

interface UseHostGamesReturn {
  // Data
  games: HostGame[];
  dashboardData: HostDashboardData | null;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;

  // Actions
  fetchGames: () => Promise<void>;
  fetchDashboardData: () => Promise<void>;
  createGame: (gameData: CreateGameRequest) => Promise<HostGame>;
  updateGame: (gameId: string, updates: UpdateGameRequest) => Promise<HostGame>;
  deleteGame: (gameId: string) => Promise<void>;
  archiveGame: (gameId: string) => Promise<void>;
  refreshAll: () => Promise<void>;

  // Computed values
  activeGames: HostGame[];
  setupGames: HostGame[];
  completedGames: HostGame[];
  archivedGames: HostGame[];
}

export function useHostGames({
  gameService,
  userId,
  autoFetch = true,
  refreshInterval
}: UseHostGamesOptions): UseHostGamesReturn {
  // State
  const [games, setGames] = useState<HostGame[]>([]);
  const [dashboardData, setDashboardData] = useState<HostDashboardData | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const gamesByStatus = useMemo(() => {
    const active = games.filter(game => game.status === 'active');
    const setup = games.filter(game => game.status === 'setup');
    const completed = games.filter(game => game.status === 'completed');
    const archived = games.filter(game => game.archived === true);

    return {
      active,
      setup,
      completed,
      archived
    };
  }, [games]);

  // Clear error helper
  const clearError = useCallback(() => setError(null), []);

  // Fetch games
  const fetchGames = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    clearError();

    try {
      const hostGames = await gameService.getHostGames(userId);
      setGames(hostGames);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch games';
      setError(errorMessage);
      console.error('Failed to fetch host games:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gameService, userId, clearError]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!userId) return;

    try {
      const data = await gameService.getHostDashboard(userId);
      setDashboardData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Failed to fetch dashboard data:', err);
    }
  }, [gameService, userId]);

  // Create game
  const createGame = useCallback(async (gameData: CreateGameRequest): Promise<HostGame> => {
    setIsCreating(true);
    clearError();

    try {
      const newGame = await gameService.createGame(gameData);
      setGames(prev => [newGame, ...prev]);

      // Refresh dashboard data to update stats
      await fetchDashboardData();

      return newGame;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create game';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [gameService, clearError, fetchDashboardData]);

  // Update game
  const updateGame = useCallback(async (gameId: string, updates: UpdateGameRequest): Promise<HostGame> => {
    setIsUpdating(true);
    clearError();

    try {
      const updatedGame = await gameService.updateGame(gameId, updates);
      setGames(prev => prev.map(game =>
        game.id === gameId ? updatedGame : game
      ));

      // Refresh dashboard data if status changed
      if (updates.status) {
        await fetchDashboardData();
      }

      return updatedGame;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update game';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [gameService, clearError, fetchDashboardData]);

  // Delete game
  const deleteGame = useCallback(async (gameId: string): Promise<void> => {
    setIsDeleting(true);
    clearError();

    try {
      await gameService.deleteGame(gameId);
      setGames(prev => prev.filter(game => game.id !== gameId));

      // Refresh dashboard data to update stats
      await fetchDashboardData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete game';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [gameService, clearError, fetchDashboardData]);

  // Archive game
  const archiveGame = useCallback(async (gameId: string): Promise<void> => {
    try {
      await updateGame(gameId, { archived: true });
    } catch (err) {
      throw err;
    }
  }, [updateGame]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchGames(),
      fetchDashboardData()
    ]);
  }, [fetchGames, fetchDashboardData]);

  // Auto-fetch on mount and user change
  useEffect(() => {
    if (autoFetch && userId) {
      refreshAll();
    }
  }, [autoFetch, userId, refreshAll]);

  // Set up refresh interval
  useEffect(() => {
    if (!refreshInterval || !userId) return;

    const interval = setInterval(refreshAll, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, userId, refreshAll]);

  return {
    // Data
    games,
    dashboardData,

    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,

    // Error state
    error,

    // Actions
    fetchGames,
    fetchDashboardData,
    createGame,
    updateGame,
    deleteGame,
    archiveGame,
    refreshAll,

    // Computed values
    activeGames: gamesByStatus.active,
    setupGames: gamesByStatus.setup,
    completedGames: gamesByStatus.completed,
    archivedGames: gamesByStatus.archived
  };
}

export default useHostGames;
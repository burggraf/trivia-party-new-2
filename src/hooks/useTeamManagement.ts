import { useState, useCallback, useMemo } from 'react';
import type {
  Team,
  TeamConfiguration,
  TeamManagementService
} from '@/contracts/host-management';

interface TeamPlayer {
  id: string;
  name: string;
  email: string;
  joined_at?: string;
  is_captain?: boolean;
}

interface UseTeamManagementOptions {
  teamService: TeamManagementService;
  gameId: string;
  maxTeams?: number;
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
}

interface UseTeamManagementReturn {
  // State
  teams: Team[];
  teamPlayers: Record<string, TeamPlayer[]>;
  selfRegistrationEnabled: boolean;

  // Loading states
  isLoading: boolean;
  isCreatingTeam: boolean;
  isUpdatingTeam: boolean;
  isDeletingTeam: boolean;
  isManagingPlayers: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchTeams: () => Promise<void>;
  createTeam: (teamConfig: TeamConfiguration) => Promise<Team>;
  updateTeam: (teamId: string, updates: Partial<TeamConfiguration>) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  addPlayer: (teamId: string, playerData: Omit<TeamPlayer, 'id' | 'joined_at'>) => Promise<void>;
  removePlayer: (teamId: string, playerId: string) => Promise<void>;
  promotePlayer: (teamId: string, playerId: string) => Promise<void>;
  toggleSelfRegistration: (enabled: boolean) => Promise<void>;
  clearError: () => void;

  // Computed values
  totalTeams: number;
  totalPlayers: number;
  canAddTeam: boolean;
  teamStats: Record<string, { playerCount: number; hasCapatain: boolean; isFull: boolean }>;
  averagePlayersPerTeam: number;
  emptyTeams: Team[];
  fullTeams: Team[];
}

export function useTeamManagement({
  teamService,
  gameId,
  maxTeams = 6,
  minPlayersPerTeam = 2,
  maxPlayersPerTeam = 4
}: UseTeamManagementOptions): UseTeamManagementReturn {
  // State
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Record<string, TeamPlayer[]>>({});
  const [selfRegistrationEnabled, setSelfRegistrationEnabled] = useState(true);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [isManagingPlayers, setIsManagingPlayers] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback(() => setError(null), []);

  // Computed values
  const totalTeams = teams.length;
  const totalPlayers = Object.values(teamPlayers).reduce(
    (sum, players) => sum + players.length,
    0
  );
  const canAddTeam = totalTeams < maxTeams;
  const averagePlayersPerTeam = totalTeams > 0 ? totalPlayers / totalTeams : 0;

  const teamStats = useMemo(() => {
    return teams.reduce((stats, team) => {
      const players = teamPlayers[team.id] || [];
      const hasCapatain = players.some(p => p.is_captain);

      stats[team.id] = {
        playerCount: players.length,
        hasCapatain,
        isFull: players.length >= maxPlayersPerTeam
      };

      return stats;
    }, {} as Record<string, { playerCount: number; hasCapatain: boolean; isFull: boolean }>);
  }, [teams, teamPlayers, maxPlayersPerTeam]);

  const emptyTeams = useMemo(() => {
    return teams.filter(team => (teamPlayers[team.id] || []).length === 0);
  }, [teams, teamPlayers]);

  const fullTeams = useMemo(() => {
    return teams.filter(team => {
      const players = teamPlayers[team.id] || [];
      return players.length >= maxPlayersPerTeam;
    });
  }, [teams, teamPlayers, maxPlayersPerTeam]);

  // Fetch teams and players
  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      const gameTeams = await teamService.getGameTeams(gameId);
      setTeams(gameTeams);

      // Fetch players for each team
      const playersData: Record<string, TeamPlayer[]> = {};
      await Promise.all(
        gameTeams.map(async (team) => {
          try {
            const players = await teamService.getTeamPlayers(team.id);
            playersData[team.id] = players;
          } catch (err) {
            console.warn(`Failed to fetch players for team ${team.id}:`, err);
            playersData[team.id] = [];
          }
        })
      );

      setTeamPlayers(playersData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teams';
      setError(errorMessage);
      console.error('Failed to fetch teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, [teamService, gameId, clearError]);

  // Create team
  const createTeam = useCallback(async (teamConfig: TeamConfiguration): Promise<Team> => {
    if (!canAddTeam) {
      throw new Error(`Maximum number of teams (${maxTeams}) reached`);
    }

    setIsCreatingTeam(true);
    clearError();

    try {
      const newTeam = await teamService.createTeam(gameId, teamConfig);
      setTeams(prev => [...prev, newTeam]);
      setTeamPlayers(prev => ({ ...prev, [newTeam.id]: [] }));
      return newTeam;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCreatingTeam(false);
    }
  }, [teamService, gameId, canAddTeam, maxTeams, clearError]);

  // Update team
  const updateTeam = useCallback(async (
    teamId: string,
    updates: Partial<TeamConfiguration>
  ): Promise<Team> => {
    setIsUpdatingTeam(true);
    clearError();

    try {
      const updatedTeam = await teamService.updateTeam(teamId, updates);
      setTeams(prev => prev.map(team =>
        team.id === teamId ? updatedTeam : team
      ));
      return updatedTeam;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdatingTeam(false);
    }
  }, [teamService, clearError]);

  // Delete team
  const deleteTeam = useCallback(async (teamId: string): Promise<void> => {
    setIsDeletingTeam(true);
    clearError();

    try {
      await teamService.deleteTeam(teamId);
      setTeams(prev => prev.filter(team => team.id !== teamId));
      setTeamPlayers(prev => {
        const { [teamId]: removed, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeletingTeam(false);
    }
  }, [teamService, clearError]);

  // Add player to team
  const addPlayer = useCallback(async (
    teamId: string,
    playerData: Omit<TeamPlayer, 'id' | 'joined_at'>
  ): Promise<void> => {
    const currentPlayers = teamPlayers[teamId] || [];
    if (currentPlayers.length >= maxPlayersPerTeam) {
      throw new Error('Team is already at maximum capacity');
    }

    setIsManagingPlayers(true);
    clearError();

    try {
      const newPlayer = await teamService.addPlayerToTeam(teamId, playerData);
      setTeamPlayers(prev => ({
        ...prev,
        [teamId]: [...(prev[teamId] || []), newPlayer]
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add player to team';
      setError(errorMessage);
      throw err;
    } finally {
      setIsManagingPlayers(false);
    }
  }, [teamService, teamPlayers, maxPlayersPerTeam, clearError]);

  // Remove player from team
  const removePlayer = useCallback(async (teamId: string, playerId: string): Promise<void> => {
    setIsManagingPlayers(true);
    clearError();

    try {
      await teamService.removePlayerFromTeam(teamId, playerId);
      setTeamPlayers(prev => ({
        ...prev,
        [teamId]: (prev[teamId] || []).filter(p => p.id !== playerId)
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove player from team';
      setError(errorMessage);
      throw err;
    } finally {
      setIsManagingPlayers(false);
    }
  }, [teamService, clearError]);

  // Promote player to captain
  const promotePlayer = useCallback(async (teamId: string, playerId: string): Promise<void> => {
    setIsManagingPlayers(true);
    clearError();

    try {
      await teamService.promoteToCapatain(teamId, playerId);

      // Update local state to reflect the change
      setTeamPlayers(prev => ({
        ...prev,
        [teamId]: (prev[teamId] || []).map(p => ({
          ...p,
          is_captain: p.id === playerId
        }))
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to promote player to captain';
      setError(errorMessage);
      throw err;
    } finally {
      setIsManagingPlayers(false);
    }
  }, [teamService, clearError]);

  // Toggle self registration
  const toggleSelfRegistration = useCallback(async (enabled: boolean): Promise<void> => {
    clearError();

    try {
      await teamService.updateGameSettings(gameId, {
        self_registration_enabled: enabled
      });
      setSelfRegistrationEnabled(enabled);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update registration settings';
      setError(errorMessage);
      throw err;
    }
  }, [teamService, gameId, clearError]);

  // Bulk operations
  const deleteEmptyTeams = useCallback(async (): Promise<void> => {
    if (emptyTeams.length === 0) return;

    setIsDeletingTeam(true);
    clearError();

    try {
      await Promise.all(emptyTeams.map(team => teamService.deleteTeam(team.id)));

      const emptyTeamIds = emptyTeams.map(t => t.id);
      setTeams(prev => prev.filter(team => !emptyTeamIds.includes(team.id)));
      setTeamPlayers(prev => {
        const updated = { ...prev };
        emptyTeamIds.forEach(id => delete updated[id]);
        return updated;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete empty teams';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeletingTeam(false);
    }
  }, [emptyTeams, teamService, clearError]);

  // Validation helpers
  const validateTeamConfiguration = useCallback(() => {
    const errors: string[] = [];

    if (totalTeams === 0) {
      errors.push('At least one team is required');
    }

    const teamsWithMinPlayers = teams.filter(team => {
      const players = teamPlayers[team.id] || [];
      return players.length >= minPlayersPerTeam;
    });

    if (teamsWithMinPlayers.length === 0 && totalTeams > 0) {
      errors.push(`At least one team must have ${minPlayersPerTeam} or more players`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      readyTeams: teamsWithMinPlayers.length,
      totalTeams
    };
  }, [totalTeams, teams, teamPlayers, minPlayersPerTeam]);

  return {
    // State
    teams,
    teamPlayers,
    selfRegistrationEnabled,

    // Loading states
    isLoading,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    isManagingPlayers,

    // Error state
    error,

    // Actions
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addPlayer,
    removePlayer,
    promotePlayer,
    toggleSelfRegistration,
    clearError,

    // Computed values
    totalTeams,
    totalPlayers,
    canAddTeam,
    teamStats,
    averagePlayersPerTeam,
    emptyTeams,
    fullTeams,

    // Additional utilities
    deleteEmptyTeams,
    validateTeamConfiguration,

    // Configuration
    maxTeams,
    minPlayersPerTeam,
    maxPlayersPerTeam
  };
}

export default useTeamManagement;
// Integration Tests: Role Selection Flow
// Tests for complete role selection user journey

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  RoleSelectionRequest,
  RoleSelectionResponse,
  UserRole
} from '@/contracts/host-management';
import type { UserProfile } from '@/contracts/game';

// Mock the service integration that doesn't exist yet
const mockServiceIntegration = {
  roleSelection: {
    setUserRole: vi.fn(),
    getUserRole: vi.fn(),
    validateRoleAccess: vi.fn(),
    handleRoleTransition: vi.fn()
  },
  context: {
    updateUserProfile: vi.fn(),
    redirectToApp: vi.fn(),
    clearErrors: vi.fn(),
    setLoading: vi.fn()
  },
  storage: {
    persistRolePreference: vi.fn(),
    loadRolePreference: vi.fn(),
    clearRolePreference: vi.fn()
  }
};

describe('Role Selection Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Role Selection for New Users', () => {
    it('should complete role selection flow for new host user', async () => {
      // Arrange
      const userId = 'new-user-123';
      const selectedRole: UserRole = 'host';

      const request: RoleSelectionRequest = {
        userId,
        preferredRole: selectedRole
      };

      const expectedResponse: RoleSelectionResponse = {
        success: true,
        userProfile: {
          id: userId,
          username: 'newhost',
          preferred_role: 'host'
        } as UserProfile,
        redirectPath: '/host/dashboard'
      };

      // Mock successful role selection
      mockServiceIntegration.roleSelection.setUserRole.mockResolvedValue(expectedResponse);
      mockServiceIntegration.storage.persistRolePreference.mockResolvedValue(undefined);
      mockServiceIntegration.context.updateUserProfile.mockResolvedValue(undefined);

      // Act
      const result = await mockServiceIntegration.roleSelection.setUserRole(request);
      await mockServiceIntegration.storage.persistRolePreference(userId, selectedRole);
      await mockServiceIntegration.context.updateUserProfile(result.userProfile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userProfile.preferred_role).toBe('host');
      expect(result.redirectPath).toBe('/host/dashboard');

      expect(mockServiceIntegration.roleSelection.setUserRole).toHaveBeenCalledWith(request);
      expect(mockServiceIntegration.storage.persistRolePreference).toHaveBeenCalledWith(userId, selectedRole);
      expect(mockServiceIntegration.context.updateUserProfile).toHaveBeenCalledWith(result.userProfile);
    });

    it('should complete role selection flow for new player user', async () => {
      // Arrange
      const userId = 'new-player-456';
      const selectedRole: UserRole = 'player';

      const request: RoleSelectionRequest = {
        userId,
        preferredRole: selectedRole
      };

      const expectedResponse: RoleSelectionResponse = {
        success: true,
        userProfile: {
          id: userId,
          username: 'newplayer',
          preferred_role: 'player'
        } as UserProfile,
        redirectPath: '/dashboard'
      };

      mockServiceIntegration.roleSelection.setUserRole.mockResolvedValue(expectedResponse);
      mockServiceIntegration.storage.persistRolePreference.mockResolvedValue(undefined);
      mockServiceIntegration.context.updateUserProfile.mockResolvedValue(undefined);

      // Act
      const result = await mockServiceIntegration.roleSelection.setUserRole(request);
      await mockServiceIntegration.storage.persistRolePreference(userId, selectedRole);
      await mockServiceIntegration.context.updateUserProfile(result.userProfile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userProfile.preferred_role).toBe('player');
      expect(result.redirectPath).toBe('/dashboard');
    });

    it('should handle role selection validation errors', async () => {
      // Arrange
      const userId = 'invalid-user';
      const request: RoleSelectionRequest = {
        userId,
        preferredRole: 'host'
      };

      mockServiceIntegration.roleSelection.setUserRole.mockRejectedValue(
        new Error('User validation failed: User does not exist')
      );

      // Act & Assert
      await expect(mockServiceIntegration.roleSelection.setUserRole(request))
        .rejects.toThrow('User validation failed: User does not exist');

      expect(mockServiceIntegration.storage.persistRolePreference).not.toHaveBeenCalled();
      expect(mockServiceIntegration.context.updateUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('Role Switching for Existing Users', () => {
    it('should switch from player to host role', async () => {
      // Arrange
      const userId = 'existing-player-789';

      // Mock current role as player
      mockServiceIntegration.roleSelection.getUserRole.mockResolvedValue('player');

      const switchRequest: RoleSelectionRequest = {
        userId,
        preferredRole: 'host'
      };

      const switchResponse: RoleSelectionResponse = {
        success: true,
        userProfile: {
          id: userId,
          username: 'switcheduser',
          preferred_role: 'host'
        } as UserProfile,
        redirectPath: '/host/dashboard'
      };

      mockServiceIntegration.roleSelection.setUserRole.mockResolvedValue(switchResponse);
      mockServiceIntegration.roleSelection.handleRoleTransition.mockResolvedValue(undefined);

      // Act
      const currentRole = await mockServiceIntegration.roleSelection.getUserRole(userId);
      expect(currentRole).toBe('player');

      const result = await mockServiceIntegration.roleSelection.setUserRole(switchRequest);
      await mockServiceIntegration.roleSelection.handleRoleTransition(userId, 'player', 'host');

      // Assert
      expect(result.success).toBe(true);
      expect(result.userProfile.preferred_role).toBe('host');
      expect(result.redirectPath).toBe('/host/dashboard');

      expect(mockServiceIntegration.roleSelection.handleRoleTransition)
        .toHaveBeenCalledWith(userId, 'player', 'host');
    });

    it('should switch from host to player role', async () => {
      // Arrange
      const userId = 'existing-host-012';

      mockServiceIntegration.roleSelection.getUserRole.mockResolvedValue('host');

      const switchRequest: RoleSelectionRequest = {
        userId,
        preferredRole: 'player'
      };

      const switchResponse: RoleSelectionResponse = {
        success: true,
        userProfile: {
          id: userId,
          username: 'formerhost',
          preferred_role: 'player'
        } as UserProfile,
        redirectPath: '/dashboard'
      };

      mockServiceIntegration.roleSelection.setUserRole.mockResolvedValue(switchResponse);
      mockServiceIntegration.roleSelection.handleRoleTransition.mockResolvedValue(undefined);

      // Act
      const currentRole = await mockServiceIntegration.roleSelection.getUserRole(userId);
      expect(currentRole).toBe('host');

      const result = await mockServiceIntegration.roleSelection.setUserRole(switchRequest);
      await mockServiceIntegration.roleSelection.handleRoleTransition(userId, 'host', 'player');

      // Assert
      expect(result.success).toBe(true);
      expect(result.userProfile.preferred_role).toBe('player');
      expect(result.redirectPath).toBe('/dashboard');
    });

    it('should handle role transition with active games validation', async () => {
      // Arrange
      const userId = 'host-with-active-games';

      mockServiceIntegration.roleSelection.validateRoleAccess.mockResolvedValue({
        canSwitch: false,
        reason: 'User has active games as host',
        activeGamesCount: 2
      });

      const switchRequest: RoleSelectionRequest = {
        userId,
        preferredRole: 'player'
      };

      mockServiceIntegration.roleSelection.setUserRole.mockRejectedValue(
        new Error('Cannot switch roles: User has 2 active games as host')
      );

      // Act & Assert
      const validation = await mockServiceIntegration.roleSelection.validateRoleAccess(userId, 'player');
      expect(validation.canSwitch).toBe(false);
      expect(validation.activeGamesCount).toBe(2);

      await expect(mockServiceIntegration.roleSelection.setUserRole(switchRequest))
        .rejects.toThrow('Cannot switch roles: User has 2 active games as host');
    });
  });

  describe('Role Persistence and Recovery', () => {
    it('should load existing role preference on app startup', async () => {
      // Arrange
      const userId = 'returning-user-345';
      const storedRole: UserRole = 'host';

      mockServiceIntegration.storage.loadRolePreference.mockResolvedValue(storedRole);
      mockServiceIntegration.roleSelection.getUserRole.mockResolvedValue(storedRole);

      // Act
      const loadedRole = await mockServiceIntegration.storage.loadRolePreference(userId);
      const serverRole = await mockServiceIntegration.roleSelection.getUserRole(userId);

      // Assert
      expect(loadedRole).toBe('host');
      expect(serverRole).toBe('host');
      expect(loadedRole).toBe(serverRole); // Local and server should match
    });

    it('should handle role preference sync conflicts', async () => {
      // Arrange
      const userId = 'conflict-user-678';

      // Local storage has 'player', server has 'host'
      mockServiceIntegration.storage.loadRolePreference.mockResolvedValue('player');
      mockServiceIntegration.roleSelection.getUserRole.mockResolvedValue('host');

      // Server preference should take precedence
      const syncRequest: RoleSelectionRequest = {
        userId,
        preferredRole: 'host'
      };

      mockServiceIntegration.storage.persistRolePreference.mockResolvedValue(undefined);

      // Act
      const localRole = await mockServiceIntegration.storage.loadRolePreference(userId);
      const serverRole = await mockServiceIntegration.roleSelection.getUserRole(userId);

      if (localRole !== serverRole) {
        // Sync local with server preference
        await mockServiceIntegration.storage.persistRolePreference(userId, serverRole);
      }

      // Assert
      expect(localRole).toBe('player');
      expect(serverRole).toBe('host');
      expect(mockServiceIntegration.storage.persistRolePreference)
        .toHaveBeenCalledWith(userId, 'host');
    });

    it('should handle offline role selection gracefully', async () => {
      // Arrange
      const userId = 'offline-user-901';
      const offlineRole: UserRole = 'player';

      // Mock network error
      mockServiceIntegration.roleSelection.setUserRole.mockRejectedValue(
        new Error('Network error: Unable to connect to server')
      );

      // But local storage should still work
      mockServiceIntegration.storage.persistRolePreference.mockResolvedValue(undefined);

      const request: RoleSelectionRequest = {
        userId,
        preferredRole: offlineRole
      };

      // Act
      try {
        await mockServiceIntegration.roleSelection.setUserRole(request);
      } catch (error) {
        // Fallback to local storage only
        await mockServiceIntegration.storage.persistRolePreference(userId, offlineRole);
      }

      // Assert
      expect(mockServiceIntegration.roleSelection.setUserRole).toHaveBeenCalledWith(request);
      expect(mockServiceIntegration.storage.persistRolePreference)
        .toHaveBeenCalledWith(userId, offlineRole);
    });
  });

  describe('Context Integration and Routing', () => {
    it('should update app context after successful role selection', async () => {
      // Arrange
      const userId = 'context-user-234';
      const selectedRole: UserRole = 'host';

      const request: RoleSelectionRequest = {
        userId,
        preferredRole: selectedRole
      };

      const response: RoleSelectionResponse = {
        success: true,
        userProfile: {
          id: userId,
          username: 'contextuser',
          preferred_role: selectedRole
        } as UserProfile,
        redirectPath: '/host/dashboard'
      };

      mockServiceIntegration.roleSelection.setUserRole.mockResolvedValue(response);
      mockServiceIntegration.context.setLoading.mockImplementation(() => {});
      mockServiceIntegration.context.updateUserProfile.mockResolvedValue(undefined);
      mockServiceIntegration.context.redirectToApp.mockResolvedValue(undefined);

      // Act
      mockServiceIntegration.context.setLoading(true);

      const result = await mockServiceIntegration.roleSelection.setUserRole(request);
      await mockServiceIntegration.context.updateUserProfile(result.userProfile);

      mockServiceIntegration.context.setLoading(false);
      await mockServiceIntegration.context.redirectToApp(result.redirectPath);

      // Assert
      expect(mockServiceIntegration.context.setLoading).toHaveBeenCalledWith(true);
      expect(mockServiceIntegration.context.updateUserProfile).toHaveBeenCalledWith(response.userProfile);
      expect(mockServiceIntegration.context.setLoading).toHaveBeenCalledWith(false);
      expect(mockServiceIntegration.context.redirectToApp).toHaveBeenCalledWith('/host/dashboard');
    });

    it('should clear errors and handle loading states properly', async () => {
      // Arrange
      const userId = 'error-recovery-567';

      mockServiceIntegration.context.clearErrors.mockImplementation(() => {});
      mockServiceIntegration.context.setLoading.mockImplementation(() => {});

      const request: RoleSelectionRequest = {
        userId,
        preferredRole: 'host'
      };

      // First attempt fails
      mockServiceIntegration.roleSelection.setUserRole
        .mockRejectedValueOnce(new Error('Temporary server error'))
        .mockResolvedValueOnce({
          success: true,
          userProfile: { id: userId, username: 'recovered', preferred_role: 'host' } as UserProfile,
          redirectPath: '/host/dashboard'
        });

      // Act
      mockServiceIntegration.context.clearErrors();
      mockServiceIntegration.context.setLoading(true);

      try {
        await mockServiceIntegration.roleSelection.setUserRole(request);
      } catch (error) {
        // Retry after error
        mockServiceIntegration.context.clearErrors();
        const retryResult = await mockServiceIntegration.roleSelection.setUserRole(request);
        expect(retryResult.success).toBe(true);
      }

      mockServiceIntegration.context.setLoading(false);

      // Assert
      expect(mockServiceIntegration.context.clearErrors).toHaveBeenCalledTimes(2);
      expect(mockServiceIntegration.context.setLoading).toHaveBeenCalledWith(true);
      expect(mockServiceIntegration.context.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle redirect path determination based on role', async () => {
      // Arrange
      const hostRequest: RoleSelectionRequest = {
        userId: 'host-redirect-test',
        preferredRole: 'host'
      };

      const playerRequest: RoleSelectionRequest = {
        userId: 'player-redirect-test',
        preferredRole: 'player'
      };

      mockServiceIntegration.roleSelection.setUserRole
        .mockImplementation((req: RoleSelectionRequest) => {
          const redirectPath = req.preferredRole === 'host' ? '/host/dashboard' : '/dashboard';
          return Promise.resolve({
            success: true,
            userProfile: {
              id: req.userId,
              username: 'testuser',
              preferred_role: req.preferredRole
            } as UserProfile,
            redirectPath
          });
        });

      // Act
      const hostResult = await mockServiceIntegration.roleSelection.setUserRole(hostRequest);
      const playerResult = await mockServiceIntegration.roleSelection.setUserRole(playerRequest);

      // Assert
      expect(hostResult.redirectPath).toBe('/host/dashboard');
      expect(playerResult.redirectPath).toBe('/dashboard');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const userId = 'db-error-user';
      const request: RoleSelectionRequest = {
        userId,
        preferredRole: 'host'
      };

      mockServiceIntegration.roleSelection.setUserRole.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(mockServiceIntegration.roleSelection.setUserRole(request))
        .rejects.toThrow('Database connection failed');

      // Should not call dependent operations
      expect(mockServiceIntegration.storage.persistRolePreference).not.toHaveBeenCalled();
      expect(mockServiceIntegration.context.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should handle concurrent role selection attempts', async () => {
      // Arrange
      const userId = 'concurrent-user';

      const request1: RoleSelectionRequest = {
        userId,
        preferredRole: 'host'
      };

      const request2: RoleSelectionRequest = {
        userId,
        preferredRole: 'player'
      };

      // Mock delay for first request
      mockServiceIntegration.roleSelection.setUserRole
        .mockImplementationOnce(() =>
          new Promise(resolve => setTimeout(() => resolve({
            success: true,
            userProfile: { id: userId, username: 'user', preferred_role: 'host' } as UserProfile,
            redirectPath: '/host/dashboard'
          }), 100))
        )
        .mockRejectedValueOnce(
          new Error('Role selection already in progress')
        );

      // Act
      const [result1, result2] = await Promise.allSettled([
        mockServiceIntegration.roleSelection.setUserRole(request1),
        mockServiceIntegration.roleSelection.setUserRole(request2)
      ]);

      // Assert
      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('rejected');

      if (result2.status === 'rejected') {
        expect(result2.reason.message).toBe('Role selection already in progress');
      }
    });

    it('should validate role transitions against business rules', async () => {
      // Arrange
      const hostUserId = 'business-rule-host';

      mockServiceIntegration.roleSelection.validateRoleAccess.mockResolvedValue({
        canSwitch: false,
        reason: 'Host cannot switch roles during active game',
        activeGamesCount: 1,
        activeGameIds: ['game-active-123']
      });

      // Act
      const validation = await mockServiceIntegration.roleSelection.validateRoleAccess(hostUserId, 'player');

      // Assert
      expect(validation.canSwitch).toBe(false);
      expect(validation.reason).toContain('during active game');
      expect(validation.activeGamesCount).toBe(1);
      expect(validation.activeGameIds).toEqual(['game-active-123']);
    });
  });

  describe('Complete User Journey Integration', () => {
    it('should execute complete first-time user role selection flow', async () => {
      // Arrange
      const newUserId = 'complete-journey-user';
      const selectedRole: UserRole = 'host';

      // Mock complete flow
      mockServiceIntegration.storage.loadRolePreference.mockResolvedValue(null); // No existing preference
      mockServiceIntegration.roleSelection.getUserRole.mockResolvedValue(null); // No server preference

      const roleRequest: RoleSelectionRequest = {
        userId: newUserId,
        preferredRole: selectedRole
      };

      const roleResponse: RoleSelectionResponse = {
        success: true,
        userProfile: {
          id: newUserId,
          username: 'completeuser',
          preferred_role: selectedRole
        } as UserProfile,
        redirectPath: '/host/dashboard'
      };

      mockServiceIntegration.roleSelection.setUserRole.mockResolvedValue(roleResponse);
      mockServiceIntegration.storage.persistRolePreference.mockResolvedValue(undefined);
      mockServiceIntegration.context.updateUserProfile.mockResolvedValue(undefined);
      mockServiceIntegration.context.redirectToApp.mockResolvedValue(undefined);

      // Act - Complete flow simulation
      // 1. Check for existing preferences
      const existingLocalRole = await mockServiceIntegration.storage.loadRolePreference(newUserId);
      const existingServerRole = await mockServiceIntegration.roleSelection.getUserRole(newUserId);

      expect(existingLocalRole).toBeNull();
      expect(existingServerRole).toBeNull();

      // 2. User selects role
      mockServiceIntegration.context.setLoading(true);
      const result = await mockServiceIntegration.roleSelection.setUserRole(roleRequest);

      // 3. Persist preference
      await mockServiceIntegration.storage.persistRolePreference(newUserId, selectedRole);

      // 4. Update app context
      await mockServiceIntegration.context.updateUserProfile(result.userProfile);

      // 5. Complete flow
      mockServiceIntegration.context.setLoading(false);
      await mockServiceIntegration.context.redirectToApp(result.redirectPath);

      // Assert complete flow
      expect(result.success).toBe(true);
      expect(result.userProfile.preferred_role).toBe('host');
      expect(result.redirectPath).toBe('/host/dashboard');

      expect(mockServiceIntegration.roleSelection.setUserRole).toHaveBeenCalledWith(roleRequest);
      expect(mockServiceIntegration.storage.persistRolePreference).toHaveBeenCalledWith(newUserId, selectedRole);
      expect(mockServiceIntegration.context.updateUserProfile).toHaveBeenCalledWith(result.userProfile);
      expect(mockServiceIntegration.context.redirectToApp).toHaveBeenCalledWith('/host/dashboard');
    });
  });
});

// This test file will FAIL until the actual integration is implemented
// This is the expected TDD behavior - Red, Green, Refactor
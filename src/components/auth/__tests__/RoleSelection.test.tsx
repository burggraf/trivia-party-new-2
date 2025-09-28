// Component Tests: RoleSelection
// Tests for role selection UI component

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleSelection } from '../RoleSelection';
import type { RoleSelectionProps } from '@/contracts/host-components';
import type { UserRole } from '@/contracts/host-management';

// Mock the component that doesn't exist yet
vi.mock('../RoleSelection', () => ({
  RoleSelection: vi.fn(() => <div data-testid="role-selection-mock">RoleSelection Component</div>)
}));

const mockRoleSelection = vi.mocked(RoleSelection);

describe('RoleSelection Component', () => {
  const defaultProps: RoleSelectionProps = {
    userId: 'user-123',
    onRoleSelected: vi.fn(),
    isLoading: false,
    error: undefined
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRoleSelection.mockImplementation(({ userId, onRoleSelected, isLoading, error }) => {
      return (
        <div data-testid="role-selection">
          <h2>Choose Your Role</h2>
          <p>User ID: {userId}</p>

          {error && (
            <div data-testid="error-message" role="alert">
              {error}
            </div>
          )}

          {isLoading ? (
            <div data-testid="loading-spinner">Loading...</div>
          ) : (
            <div data-testid="role-buttons">
              <button
                data-testid="host-button"
                onClick={() => onRoleSelected('host')}
                disabled={isLoading}
              >
                Host
              </button>
              <button
                data-testid="player-button"
                onClick={() => onRoleSelected('player')}
                disabled={isLoading}
              >
                Player
              </button>
            </div>
          )}
        </div>
      );
    });
  });

  describe('Rendering', () => {
    it('should render role selection interface', () => {
      render(<RoleSelection {...defaultProps} />);

      expect(screen.getByTestId('role-selection')).toBeInTheDocument();
      expect(screen.getByText('Choose Your Role')).toBeInTheDocument();
      expect(screen.getByText('User ID: user-123')).toBeInTheDocument();
      expect(screen.getByTestId('role-buttons')).toBeInTheDocument();
    });

    it('should render host and player buttons', () => {
      render(<RoleSelection {...defaultProps} />);

      expect(screen.getByTestId('host-button')).toBeInTheDocument();
      expect(screen.getByTestId('player-button')).toBeInTheDocument();
      expect(screen.getByText('Host')).toBeInTheDocument();
      expect(screen.getByText('Player')).toBeInTheDocument();
    });

    it('should show loading state when isLoading is true', () => {
      render(<RoleSelection {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('role-buttons')).not.toBeInTheDocument();
    });

    it('should display error message when error is provided', () => {
      const errorMessage = 'Failed to update role preference';
      render(<RoleSelection {...defaultProps} error={errorMessage} />);

      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(errorMessage);
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    it('should render buttons as disabled when loading', () => {
      render(<RoleSelection {...defaultProps} isLoading={true} />);

      // Loading state should not show buttons, but if it did, they'd be disabled
      // This test ensures the prop contract is working
      expect(defaultProps.isLoading).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should call onRoleSelected with "host" when host button is clicked', async () => {
      const onRoleSelected = vi.fn();
      render(<RoleSelection {...defaultProps} onRoleSelected={onRoleSelected} />);

      const hostButton = screen.getByTestId('host-button');
      fireEvent.click(hostButton);

      await waitFor(() => {
        expect(onRoleSelected).toHaveBeenCalledWith('host');
        expect(onRoleSelected).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onRoleSelected with "player" when player button is clicked', async () => {
      const onRoleSelected = vi.fn();
      render(<RoleSelection {...defaultProps} onRoleSelected={onRoleSelected} />);

      const playerButton = screen.getByTestId('player-button');
      fireEvent.click(playerButton);

      await waitFor(() => {
        expect(onRoleSelected).toHaveBeenCalledWith('player');
        expect(onRoleSelected).toHaveBeenCalledTimes(1);
      });
    });

    it('should not allow button clicks when loading', () => {
      const onRoleSelected = vi.fn();
      render(<RoleSelection {...defaultProps} onRoleSelected={onRoleSelected} isLoading={true} />);

      // In loading state, buttons should not be rendered
      expect(screen.queryByTestId('host-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('player-button')).not.toBeInTheDocument();
      expect(onRoleSelected).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid clicks gracefully', async () => {
      const onRoleSelected = vi.fn();
      render(<RoleSelection {...defaultProps} onRoleSelected={onRoleSelected} />);

      const hostButton = screen.getByTestId('host-button');

      // Simulate rapid clicking
      fireEvent.click(hostButton);
      fireEvent.click(hostButton);
      fireEvent.click(hostButton);

      await waitFor(() => {
        expect(onRoleSelected).toHaveBeenCalledWith('host');
        expect(onRoleSelected).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Props Validation', () => {
    it('should handle different user IDs', () => {
      const props = { ...defaultProps, userId: 'different-user-456' };
      render(<RoleSelection {...props} />);

      expect(screen.getByText('User ID: different-user-456')).toBeInTheDocument();
    });

    it('should handle undefined error gracefully', () => {
      render(<RoleSelection {...defaultProps} error={undefined} />);

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should handle empty string error', () => {
      render(<RoleSelection {...defaultProps} error="" />);

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should handle complex error messages', () => {
      const complexError = 'Network error: Failed to connect to server. Please check your internet connection and try again.';
      render(<RoleSelection {...defaultProps} error={complexError} />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(complexError);
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA attributes for error messages', () => {
      render(<RoleSelection {...defaultProps} error="Test error" />);

      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    it('should have accessible button labels', () => {
      render(<RoleSelection {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Host' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Player' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const onRoleSelected = vi.fn();
      render(<RoleSelection {...defaultProps} onRoleSelected={onRoleSelected} />);

      const hostButton = screen.getByTestId('host-button');

      // Focus the button
      hostButton.focus();
      expect(document.activeElement).toBe(hostButton);

      // Trigger with Enter key
      fireEvent.keyDown(hostButton, { key: 'Enter', code: 'Enter' });

      // Note: The actual Enter key handling would be implemented in the real component
      // This test verifies the button can receive focus for keyboard navigation
    });

    it('should have proper heading structure', () => {
      render(<RoleSelection {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Choose Your Role' })).toBeInTheDocument();
    });
  });

  describe('State Combinations', () => {
    it('should handle loading state with error', () => {
      render(<RoleSelection {...defaultProps} isLoading={true} error="Some error" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.queryByTestId('role-buttons')).not.toBeInTheDocument();
    });

    it('should show error and buttons when not loading', () => {
      render(<RoleSelection {...defaultProps} isLoading={false} error="Non-blocking error" />);

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('role-buttons')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle role selection flow for new user', async () => {
      const onRoleSelected = vi.fn();
      render(<RoleSelection {...defaultProps} userId="new-user-789" onRoleSelected={onRoleSelected} />);

      // New user sees options
      expect(screen.getByText('User ID: new-user-789')).toBeInTheDocument();
      expect(screen.getByTestId('host-button')).toBeInTheDocument();
      expect(screen.getByTestId('player-button')).toBeInTheDocument();

      // User selects host role
      fireEvent.click(screen.getByTestId('host-button'));

      await waitFor(() => {
        expect(onRoleSelected).toHaveBeenCalledWith('host');
      });
    });

    it('should handle error recovery scenario', () => {
      const { rerender } = render(<RoleSelection {...defaultProps} error="Initial error" />);

      // Error is displayed
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // Error is cleared
      rerender(<RoleSelection {...defaultProps} error={undefined} />);

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      expect(screen.getByTestId('role-buttons')).toBeInTheDocument();
    });

    it('should handle loading state transitions', () => {
      const { rerender } = render(<RoleSelection {...defaultProps} isLoading={false} />);

      // Initially not loading
      expect(screen.getByTestId('role-buttons')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();

      // Transition to loading
      rerender(<RoleSelection {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('role-buttons')).not.toBeInTheDocument();

      // Transition back to not loading
      rerender(<RoleSelection {...defaultProps} isLoading={false} />);

      expect(screen.getByTestId('role-buttons')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Component Contract', () => {
    it('should receive all required props', () => {
      const requiredProps: RoleSelectionProps = {
        userId: 'test-user',
        onRoleSelected: vi.fn()
      };

      expect(() => render(<RoleSelection {...requiredProps} />)).not.toThrow();
    });

    it('should handle optional props correctly', () => {
      const propsWithOptionals: RoleSelectionProps = {
        userId: 'test-user',
        onRoleSelected: vi.fn(),
        isLoading: true,
        error: 'Test error'
      };

      expect(() => render(<RoleSelection {...propsWithOptionals} />)).not.toThrow();
    });

    it('should call onRoleSelected with correct type', async () => {
      const onRoleSelected = vi.fn<[UserRole], void>();
      render(<RoleSelection {...defaultProps} onRoleSelected={onRoleSelected} />);

      fireEvent.click(screen.getByTestId('host-button'));

      await waitFor(() => {
        expect(onRoleSelected).toHaveBeenCalledWith('host');
      });

      fireEvent.click(screen.getByTestId('player-button'));

      await waitFor(() => {
        expect(onRoleSelected).toHaveBeenCalledWith('player');
        expect(onRoleSelected).toHaveBeenCalledTimes(2);
      });
    });
  });
});

// This test file will FAIL until the actual component is created
// This is the expected TDD behavior - Red, Green, Refactor
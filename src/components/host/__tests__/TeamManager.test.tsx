// Component Tests: TeamManager
// Tests for team management UI component

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamManager } from '../TeamManager';
import type { TeamManagerProps, TeamConfiguration } from '@/contracts/host-components';
import type { Team } from '@/contracts/multi-user-types';

// Real component test - no mocking needed

describe('TeamManager Component', () => {
  const sampleTeams: Team[] = [
    {
      id: 'team-1',
      game_id: 'game-123',
      name: 'Team Alpha',
      display_color: '#3b82f6',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 'team-2',
      game_id: 'game-123',
      name: 'Team Beta',
      display_color: '#ef4444',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 'team-3',
      game_id: 'game-123',
      name: 'Team Gamma',
      display_color: '#10b981',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ];

  const defaultProps: TeamManagerProps = {
    gameId: 'game-123',
    teams: sampleTeams,
    maxTeams: 8,
    minPlayersPerTeam: 2,
    maxPlayersPerTeam: 4,
    selfRegistrationEnabled: true,
    onCreateTeam: vi.fn(),
    onUpdateTeam: vi.fn(),
    onDeleteTeam: vi.fn(),
    onToggleSelfRegistration: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render team manager header with game info', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByTestId('manager-header')).toBeInTheDocument();
      expect(screen.getByText('Team Management - Game game-123')).toBeInTheDocument();
      expect(screen.getByTestId('team-stats')).toBeInTheDocument();
    });

    it('should display team statistics correctly', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByText('Teams: 3/8')).toBeInTheDocument();
      expect(screen.getByText('Players per team: 2-4')).toBeInTheDocument();
    });

    it('should render self-registration toggle', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByTestId('registration-controls')).toBeInTheDocument();
      expect(screen.getByTestId('self-registration-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('self-registration-checkbox')).toBeChecked();
    });

    it('should render teams section with correct count', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByTestId('teams-section')).toBeInTheDocument();
      expect(screen.getByText('Teams (3)')).toBeInTheDocument();
      expect(screen.getByTestId('add-team-button')).toBeInTheDocument();
    });

    it('should render all team cards', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByTestId('team-card-team-1')).toBeInTheDocument();
      expect(screen.getByTestId('team-card-team-2')).toBeInTheDocument();
      expect(screen.getByTestId('team-card-team-3')).toBeInTheDocument();
    });

    it('should display team information correctly', () => {
      render(<TeamManager {...defaultProps} />);

      const team1Card = screen.getByTestId('team-card-team-1');
      expect(team1Card).toHaveTextContent('Team Alpha');
      expect(team1Card).toHaveTextContent('0/4 players');

      const colorIndicator = team1Card.querySelector('[data-testid="team-color-indicator"]');
      expect(colorIndicator).toHaveStyle('background-color: #3b82f6');
    });

    it('should show loading state when isLoading is true', () => {
      render(<TeamManager {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading teams...')).toBeInTheDocument();
      expect(screen.queryByTestId('teams-section')).not.toBeInTheDocument();
    });
  });

  describe('Self-Registration Toggle', () => {
    it('should call onToggleSelfRegistration when checkbox is clicked', async () => {
      const onToggleSelfRegistration = vi.fn();
      render(<TeamManager {...defaultProps} onToggleSelfRegistration={onToggleSelfRegistration} />);

      const checkbox = screen.getByTestId('self-registration-checkbox');
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(onToggleSelfRegistration).toHaveBeenCalledWith(false);
        expect(onToggleSelfRegistration).toHaveBeenCalledTimes(1);
      });
    });

    it('should reflect current self-registration state', () => {
      render(<TeamManager {...defaultProps} selfRegistrationEnabled={false} />);

      expect(screen.getByTestId('self-registration-checkbox')).not.toBeChecked();
    });

    it('should handle multiple toggle clicks', async () => {
      const onToggleSelfRegistration = vi.fn();
      render(<TeamManager {...defaultProps} onToggleSelfRegistration={onToggleSelfRegistration} />);

      const checkbox = screen.getByTestId('self-registration-checkbox');
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(onToggleSelfRegistration).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Team Creation', () => {
    it('should show create form when add team button is clicked', async () => {
      render(<TeamManager {...defaultProps} />);

      const addButton = screen.getByTestId('add-team-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-team-form')).toBeInTheDocument();
        expect(screen.getByTestId('team-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('team-color-input')).toBeInTheDocument();
      });
    });

    it('should call onCreateTeam when save button is clicked', async () => {
      const onCreateTeam = vi.fn();
      render(<TeamManager {...defaultProps} onCreateTeam={onCreateTeam} />);

      fireEvent.click(screen.getByTestId('add-team-button'));
      await waitFor(() => {});

      fireEvent.click(screen.getByTestId('save-team-button'));

      await waitFor(() => {
        expect(onCreateTeam).toHaveBeenCalledWith({
          name: 'New Team',
          display_color: '#8b5cf6'
        });
        expect(onCreateTeam).toHaveBeenCalledTimes(1);
      });
    });

    it('should hide create form when cancel is clicked', async () => {
      render(<TeamManager {...defaultProps} />);

      fireEvent.click(screen.getByTestId('add-team-button'));
      await waitFor(() => {
        expect(screen.getByTestId('create-team-form')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('cancel-create-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('create-team-form')).not.toBeInTheDocument();
      });
    });

    it('should hide add team button when max teams reached', () => {
      const maxTeamsProps = {
        ...defaultProps,
        maxTeams: 3,
        teams: sampleTeams
      };

      render(<TeamManager {...maxTeamsProps} />);

      expect(screen.queryByTestId('add-team-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('max-teams-warning')).toBeInTheDocument();
      expect(screen.getByText('Maximum number of teams (3) reached.')).toBeInTheDocument();
    });
  });

  describe('Team Editing', () => {
    it('should show edit form when edit button is clicked', async () => {
      render(<TeamManager {...defaultProps} />);

      const editButton = screen.getByTestId('edit-team-button-team-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-form-team-1')).toBeInTheDocument();
        expect(screen.getByTestId('edit-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('edit-color-input')).toBeInTheDocument();
      });
    });

    it('should call onUpdateTeam when save edit button is clicked', async () => {
      const onUpdateTeam = vi.fn();
      render(<TeamManager {...defaultProps} onUpdateTeam={onUpdateTeam} />);

      fireEvent.click(screen.getByTestId('edit-team-button-team-1'));
      await waitFor(() => {});

      fireEvent.click(screen.getByTestId('save-edit-button-team-1'));

      await waitFor(() => {
        expect(onUpdateTeam).toHaveBeenCalledWith('team-1', {
          name: 'Updated Team Name'
        });
        expect(onUpdateTeam).toHaveBeenCalledTimes(1);
      });
    });

    it('should hide edit form when cancel edit is clicked', async () => {
      render(<TeamManager {...defaultProps} />);

      fireEvent.click(screen.getByTestId('edit-team-button-team-1'));
      await waitFor(() => {
        expect(screen.getByTestId('edit-form-team-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('cancel-edit-button-team-1'));

      await waitFor(() => {
        expect(screen.queryByTestId('edit-form-team-1')).not.toBeInTheDocument();
      });
    });

    it('should pre-populate edit form with current team data', async () => {
      render(<TeamManager {...defaultProps} />);

      fireEvent.click(screen.getByTestId('edit-team-button-team-1'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('edit-name-input');
        const colorInput = screen.getByTestId('edit-color-input');

        expect(nameInput).toHaveValue('Team Alpha');
        expect(colorInput).toHaveValue('#3b82f6');
      });
    });
  });

  describe('Team Deletion', () => {
    it('should call onDeleteTeam when delete button is clicked', async () => {
      const onDeleteTeam = vi.fn();
      render(<TeamManager {...defaultProps} onDeleteTeam={onDeleteTeam} />);

      const deleteButton = screen.getByTestId('delete-team-button-team-1');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(onDeleteTeam).toHaveBeenCalledWith('team-1');
        expect(onDeleteTeam).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle multiple team deletions', async () => {
      const onDeleteTeam = vi.fn();
      render(<TeamManager {...defaultProps} onDeleteTeam={onDeleteTeam} />);

      fireEvent.click(screen.getByTestId('delete-team-button-team-1'));
      fireEvent.click(screen.getByTestId('delete-team-button-team-2'));

      await waitFor(() => {
        expect(onDeleteTeam).toHaveBeenCalledTimes(2);
        expect(onDeleteTeam).toHaveBeenNthCalledWith(1, 'team-1');
        expect(onDeleteTeam).toHaveBeenNthCalledWith(2, 'team-2');
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no teams exist', () => {
      render(<TeamManager {...defaultProps} teams={[]} />);

      expect(screen.getByTestId('empty-teams')).toBeInTheDocument();
      expect(screen.getByText('No teams created yet.')).toBeInTheDocument();
      expect(screen.getByText('Click "Add Team" to create the first team.')).toBeInTheDocument();
    });

    it('should show teams count as 0 when empty', () => {
      render(<TeamManager {...defaultProps} teams={[]} />);

      expect(screen.getByText('Teams (0)')).toBeInTheDocument();
      expect(screen.getByText('Teams: 0/8')).toBeInTheDocument();
    });

    it('should still show add team button when empty', () => {
      render(<TeamManager {...defaultProps} teams={[]} />);

      expect(screen.getByTestId('add-team-button')).toBeInTheDocument();
    });
  });

  describe('Player Management', () => {
    it('should show manage players button for each team', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByTestId('manage-players-button-team-1')).toBeInTheDocument();
      expect(screen.getByTestId('manage-players-button-team-2')).toBeInTheDocument();
      expect(screen.getByTestId('manage-players-button-team-3')).toBeInTheDocument();
    });

    it('should display current player count for teams', () => {
      render(<TeamManager {...defaultProps} />);

      // All teams show 0 players in mock implementation
      const team1Card = screen.getByTestId('team-card-team-1');
      expect(team1Card).toHaveTextContent('0/4 players');
    });
  });

  describe('Team Capacity Management', () => {
    it('should show warning when at max teams', () => {
      const atCapacityProps = {
        ...defaultProps,
        maxTeams: 3
      };

      render(<TeamManager {...atCapacityProps} />);

      expect(screen.getByTestId('max-teams-warning')).toBeInTheDocument();
      expect(screen.queryByTestId('add-team-button')).not.toBeInTheDocument();
    });

    it('should handle different team limits', () => {
      const limitedProps = {
        ...defaultProps,
        maxTeams: 5,
        teams: sampleTeams.slice(0, 2)
      };

      render(<TeamManager {...limitedProps} />);

      expect(screen.getByText('Teams: 2/5')).toBeInTheDocument();
      expect(screen.getByTestId('add-team-button')).toBeInTheDocument();
      expect(screen.queryByTestId('max-teams-warning')).not.toBeInTheDocument();
    });

    it('should update capacity display when teams change', () => {
      const { rerender } = render(<TeamManager {...defaultProps} />);

      expect(screen.getByText('Teams: 3/8')).toBeInTheDocument();

      const updatedProps = {
        ...defaultProps,
        teams: sampleTeams.slice(0, 1)
      };

      rerender(<TeamManager {...updatedProps} />);

      expect(screen.getByText('Teams: 1/8')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should have accessible form labels', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByTestId('self-registration-toggle')).toBeInTheDocument();
    });

    it('should have accessible buttons with clear labels', () => {
      render(<TeamManager {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Add Team' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(3);
      expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(3);
    });

    it('should provide accessible color indicators', () => {
      render(<TeamManager {...defaultProps} />);

      const colorIndicators = screen.getAllByTestId('team-color-indicator');
      expect(colorIndicators).toHaveLength(3);

      colorIndicators.forEach(indicator => {
        expect(indicator).toHaveStyle('background-color: rgb(59, 130, 246)');
      });
    });
  });

  describe('Component Contract', () => {
    it('should receive all required props', () => {
      const requiredProps: TeamManagerProps = {
        gameId: 'test-game',
        teams: sampleTeams,
        maxTeams: 8,
        minPlayersPerTeam: 2,
        maxPlayersPerTeam: 4,
        selfRegistrationEnabled: true,
        onCreateTeam: vi.fn(),
        onUpdateTeam: vi.fn(),
        onDeleteTeam: vi.fn(),
        onToggleSelfRegistration: vi.fn()
      };

      expect(() => render(<TeamManager {...requiredProps} />)).not.toThrow();
    });

    it('should handle optional isLoading prop', () => {
      const propsWithLoading: TeamManagerProps = {
        ...defaultProps,
        isLoading: true
      };

      expect(() => render(<TeamManager {...propsWithLoading} />)).not.toThrow();
    });

    it('should call callbacks with correct parameters', async () => {
      const callbacks = {
        onCreateTeam: vi.fn<[TeamConfiguration], void>(),
        onUpdateTeam: vi.fn<[string, Partial<TeamConfiguration>], void>(),
        onDeleteTeam: vi.fn<[string], void>(),
        onToggleSelfRegistration: vi.fn<[boolean], void>()
      };

      render(<TeamManager {...defaultProps} {...callbacks} />);

      // Test create team callback
      fireEvent.click(screen.getByTestId('add-team-button'));
      await waitFor(() => {});
      fireEvent.click(screen.getByTestId('save-team-button'));

      await waitFor(() => {
        expect(callbacks.onCreateTeam).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            display_color: expect.any(String)
          })
        );
      });

      // Test delete callback
      fireEvent.click(screen.getByTestId('delete-team-button-team-1'));

      await waitFor(() => {
        expect(callbacks.onDeleteTeam).toHaveBeenCalledWith('team-1');
      });

      // Test toggle callback
      fireEvent.click(screen.getByTestId('self-registration-checkbox'));

      await waitFor(() => {
        expect(callbacks.onToggleSelfRegistration).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('State Management', () => {
    it('should update display when teams prop changes', () => {
      const { rerender } = render(<TeamManager {...defaultProps} />);

      expect(screen.getByText('Teams (3)')).toBeInTheDocument();
      expect(screen.getByTestId('team-card-team-3')).toBeInTheDocument();

      const updatedTeams = sampleTeams.slice(0, 2);
      rerender(<TeamManager {...defaultProps} teams={updatedTeams} />);

      expect(screen.getByText('Teams (2)')).toBeInTheDocument();
      expect(screen.queryByTestId('team-card-team-3')).not.toBeInTheDocument();
    });

    it('should transition between loading states', () => {
      const { rerender } = render(<TeamManager {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      rerender(<TeamManager {...defaultProps} isLoading={false} />);

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('teams-section')).toBeInTheDocument();
    });

    it('should maintain form state during interactions', async () => {
      render(<TeamManager {...defaultProps} />);

      // Open create form
      fireEvent.click(screen.getByTestId('add-team-button'));
      await waitFor(() => {
        expect(screen.getByTestId('create-team-form')).toBeInTheDocument();
      });

      // The form should remain open until explicitly closed
      expect(screen.getByTestId('team-name-input')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle team with long name', () => {
      const longNameTeams: Team[] = [
        {
          ...sampleTeams[0],
          name: 'This is a very long team name that might cause layout issues if not handled properly'
        }
      ];

      render(<TeamManager {...defaultProps} teams={longNameTeams} />);

      expect(screen.getByText('This is a very long team name that might cause layout issues if not handled properly')).toBeInTheDocument();
    });

    it('should handle extreme team limits', () => {
      const extremeProps = {
        ...defaultProps,
        maxTeams: 1,
        minPlayersPerTeam: 1,
        maxPlayersPerTeam: 1,
        teams: [sampleTeams[0]]
      };

      render(<TeamManager {...extremeProps} />);

      expect(screen.getByText('Teams: 1/1')).toBeInTheDocument();
      expect(screen.getByText('Players per team: 1-1')).toBeInTheDocument();
      expect(screen.getByTestId('max-teams-warning')).toBeInTheDocument();
    });

    it('should handle invalid color values gracefully', () => {
      const invalidColorTeams: Team[] = [
        {
          ...sampleTeams[0],
          display_color: 'invalid-color'
        }
      ];

      render(<TeamManager {...defaultProps} teams={invalidColorTeams} />);

      const colorIndicator = screen.getByTestId('team-color-indicator');
      expect(colorIndicator).toHaveStyle('background-color: invalid-color');
    });
  });
});

// This test file will FAIL until the actual component is created
// This is the expected TDD behavior - Red, Green, Refactor
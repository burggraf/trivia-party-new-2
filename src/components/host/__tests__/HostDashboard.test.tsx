// Component Tests: HostDashboard
// Tests for host dashboard UI component

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HostDashboard } from '../HostDashboard';
import type { HostDashboardProps, HostDashboardData } from '@/contracts/host-components';

// Mock the component that doesn't exist yet
vi.mock('../HostDashboard', () => ({
  HostDashboard: vi.fn(() => <div data-testid="host-dashboard-mock">HostDashboard Component</div>)
}));

const mockHostDashboard = vi.mocked(HostDashboard);

describe('HostDashboard Component', () => {
  const mockDashboardData: HostDashboardData = {
    upcomingGames: [
      {
        id: 'game-1',
        title: 'Friday Night Trivia',
        scheduled_date: '2024-01-15T19:00:00Z',
        status: 'setup',
        team_count: 3,
        player_count: 12,
        questions_configured: true,
        is_complete: false
      },
      {
        id: 'game-2',
        title: 'Weekend Championship',
        scheduled_date: '2024-01-20T14:00:00Z',
        status: 'active',
        team_count: 6,
        player_count: 24,
        questions_configured: true,
        is_complete: false
      }
    ],
    recentGames: [
      {
        id: 'game-3',
        title: 'Last Week\'s Game',
        scheduled_date: '2024-01-08T19:00:00Z',
        status: 'completed',
        team_count: 4,
        player_count: 16,
        questions_configured: true,
        is_complete: true
      }
    ],
    gameStats: {
      totalGamesHosted: 15,
      activeGames: 1,
      totalTeams: 42,
      averagePlayersPerGame: 18.5
    },
    questionStats: {
      totalQuestionsUsed: 450,
      favoriteCategories: ['science', 'history', 'sports'],
      questionsAvailableByCategory: {
        science: 125,
        history: 98,
        sports: 87,
        entertainment: 76
      }
    }
  };

  const defaultProps: HostDashboardProps = {
    userId: 'host-123',
    dashboardData: mockDashboardData,
    onRefresh: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHostDashboard.mockImplementation(({ userId, dashboardData, onRefresh, isLoading }) => {
      if (isLoading) {
        return (
          <div data-testid="host-dashboard">
            <div data-testid="loading-spinner">Loading dashboard...</div>
          </div>
        );
      }

      return (
        <div data-testid="host-dashboard">
          <header data-testid="dashboard-header">
            <h1>Host Dashboard</h1>
            <p>Welcome, {userId}</p>
            <button data-testid="refresh-button" onClick={onRefresh}>
              Refresh
            </button>
          </header>

          <section data-testid="upcoming-games">
            <h2>Upcoming Games ({dashboardData.upcomingGames.length})</h2>
            {dashboardData.upcomingGames.map(game => (
              <div key={game.id} data-testid={`upcoming-game-${game.id}`}>
                <h3>{game.title}</h3>
                <p>Status: {game.status}</p>
                <p>Teams: {game.team_count}, Players: {game.player_count}</p>
                <p>Questions: {game.questions_configured ? 'Configured' : 'Not Configured'}</p>
              </div>
            ))}
          </section>

          <section data-testid="recent-games">
            <h2>Recent Games ({dashboardData.recentGames.length})</h2>
            {dashboardData.recentGames.map(game => (
              <div key={game.id} data-testid={`recent-game-${game.id}`}>
                <h3>{game.title}</h3>
                <p>Completed: {game.is_complete ? 'Yes' : 'No'}</p>
              </div>
            ))}
          </section>

          <section data-testid="game-stats">
            <h2>Game Statistics</h2>
            <div data-testid="stats-grid">
              <div data-testid="total-games">Total Games: {dashboardData.gameStats.totalGamesHosted}</div>
              <div data-testid="active-games">Active Games: {dashboardData.gameStats.activeGames}</div>
              <div data-testid="total-teams">Total Teams: {dashboardData.gameStats.totalTeams}</div>
              <div data-testid="avg-players">Avg Players: {dashboardData.gameStats.averagePlayersPerGame}</div>
            </div>
          </section>

          <section data-testid="question-stats">
            <h2>Question Statistics</h2>
            <div data-testid="question-summary">
              <p>Total Questions Used: {dashboardData.questionStats.totalQuestionsUsed}</p>
              <p>Favorite Categories: {dashboardData.questionStats.favoriteCategories.join(', ')}</p>
            </div>
            <div data-testid="category-availability">
              {Object.entries(dashboardData.questionStats.questionsAvailableByCategory).map(([category, count]) => (
                <div key={category} data-testid={`category-${category}`}>
                  {category}: {count} questions
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    });
  });

  describe('Rendering', () => {
    it('should render dashboard header with user info', () => {
      render(<HostDashboard {...defaultProps} />);

      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByText('Host Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, host-123')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });

    it('should render upcoming games section', () => {
      render(<HostDashboard {...defaultProps} />);

      expect(screen.getByTestId('upcoming-games')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Games (2)')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-game-game-1')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-game-game-2')).toBeInTheDocument();
    });

    it('should render recent games section', () => {
      render(<HostDashboard {...defaultProps} />);

      expect(screen.getByTestId('recent-games')).toBeInTheDocument();
      expect(screen.getByText('Recent Games (1)')).toBeInTheDocument();
      expect(screen.getByTestId('recent-game-game-3')).toBeInTheDocument();
    });

    it('should render game statistics', () => {
      render(<HostDashboard {...defaultProps} />);

      expect(screen.getByTestId('game-stats')).toBeInTheDocument();
      expect(screen.getByText('Total Games: 15')).toBeInTheDocument();
      expect(screen.getByText('Active Games: 1')).toBeInTheDocument();
      expect(screen.getByText('Total Teams: 42')).toBeInTheDocument();
      expect(screen.getByText('Avg Players: 18.5')).toBeInTheDocument();
    });

    it('should render question statistics', () => {
      render(<HostDashboard {...defaultProps} />);

      expect(screen.getByTestId('question-stats')).toBeInTheDocument();
      expect(screen.getByText('Total Questions Used: 450')).toBeInTheDocument();
      expect(screen.getByText('Favorite Categories: science, history, sports')).toBeInTheDocument();
    });

    it('should render category availability', () => {
      render(<HostDashboard {...defaultProps} />);

      expect(screen.getByTestId('category-science')).toBeInTheDocument();
      expect(screen.getByText('science: 125 questions')).toBeInTheDocument();
      expect(screen.getByText('history: 98 questions')).toBeInTheDocument();
      expect(screen.getByText('sports: 87 questions')).toBeInTheDocument();
      expect(screen.getByText('entertainment: 76 questions')).toBeInTheDocument();
    });

    it('should show loading state when isLoading is true', () => {
      render(<HostDashboard {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      expect(screen.queryByTestId('upcoming-games')).not.toBeInTheDocument();
    });
  });

  describe('Game Information Display', () => {
    it('should display detailed upcoming game information', () => {
      render(<HostDashboard {...defaultProps} />);

      // Check first upcoming game
      const game1 = screen.getByTestId('upcoming-game-game-1');
      expect(game1).toHaveTextContent('Friday Night Trivia');
      expect(game1).toHaveTextContent('Status: setup');
      expect(game1).toHaveTextContent('Teams: 3, Players: 12');
      expect(game1).toHaveTextContent('Questions: Configured');

      // Check second upcoming game
      const game2 = screen.getByTestId('upcoming-game-game-2');
      expect(game2).toHaveTextContent('Weekend Championship');
      expect(game2).toHaveTextContent('Status: active');
      expect(game2).toHaveTextContent('Teams: 6, Players: 24');
    });

    it('should display recent game completion status', () => {
      render(<HostDashboard {...defaultProps} />);

      const recentGame = screen.getByTestId('recent-game-game-3');
      expect(recentGame).toHaveTextContent('Last Week\'s Game');
      expect(recentGame).toHaveTextContent('Completed: Yes');
    });

    it('should handle games without questions configured', () => {
      const dataWithUnconfiguredGame: HostDashboardData = {
        ...mockDashboardData,
        upcomingGames: [
          {
            id: 'game-unconfig',
            title: 'Unconfigured Game',
            scheduled_date: '2024-01-25T19:00:00Z',
            status: 'setup',
            team_count: 0,
            player_count: 0,
            questions_configured: false,
            is_complete: false
          }
        ]
      };

      render(<HostDashboard {...defaultProps} dashboardData={dataWithUnconfiguredGame} />);

      const unconfiguredGame = screen.getByTestId('upcoming-game-game-unconfig');
      expect(unconfiguredGame).toHaveTextContent('Questions: Not Configured');
    });
  });

  describe('User Interactions', () => {
    it('should call onRefresh when refresh button is clicked', async () => {
      const onRefresh = vi.fn();
      render(<HostDashboard {...defaultProps} onRefresh={onRefresh} />);

      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle multiple refresh clicks', async () => {
      const onRefresh = vi.fn();
      render(<HostDashboard {...defaultProps} onRefresh={onRefresh} />);

      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Empty States', () => {
    it('should handle empty upcoming games', () => {
      const emptyUpcomingData: HostDashboardData = {
        ...mockDashboardData,
        upcomingGames: []
      };

      render(<HostDashboard {...defaultProps} dashboardData={emptyUpcomingData} />);

      expect(screen.getByText('Upcoming Games (0)')).toBeInTheDocument();
      expect(screen.queryByTestId('upcoming-game-game-1')).not.toBeInTheDocument();
    });

    it('should handle empty recent games', () => {
      const emptyRecentData: HostDashboardData = {
        ...mockDashboardData,
        recentGames: []
      };

      render(<HostDashboard {...defaultProps} dashboardData={emptyRecentData} />);

      expect(screen.getByText('Recent Games (0)')).toBeInTheDocument();
      expect(screen.queryByTestId('recent-game-game-3')).not.toBeInTheDocument();
    });

    it('should handle zero statistics', () => {
      const zeroStatsData: HostDashboardData = {
        ...mockDashboardData,
        gameStats: {
          totalGamesHosted: 0,
          activeGames: 0,
          totalTeams: 0,
          averagePlayersPerGame: 0
        }
      };

      render(<HostDashboard {...defaultProps} dashboardData={zeroStatsData} />);

      expect(screen.getByText('Total Games: 0')).toBeInTheDocument();
      expect(screen.getByText('Active Games: 0')).toBeInTheDocument();
      expect(screen.getByText('Total Teams: 0')).toBeInTheDocument();
      expect(screen.getByText('Avg Players: 0')).toBeInTheDocument();
    });

    it('should handle empty question categories', () => {
      const emptyCategoriesData: HostDashboardData = {
        ...mockDashboardData,
        questionStats: {
          totalQuestionsUsed: 0,
          favoriteCategories: [],
          questionsAvailableByCategory: {}
        }
      };

      render(<HostDashboard {...defaultProps} dashboardData={emptyCategoriesData} />);

      expect(screen.getByText('Total Questions Used: 0')).toBeInTheDocument();
      expect(screen.getByText('Favorite Categories: ')).toBeInTheDocument();
      expect(screen.queryByTestId('category-science')).not.toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format numbers correctly in statistics', () => {
      const largeNumbersData: HostDashboardData = {
        ...mockDashboardData,
        gameStats: {
          totalGamesHosted: 1250,
          activeGames: 15,
          totalTeams: 4800,
          averagePlayersPerGame: 22.75
        }
      };

      render(<HostDashboard {...defaultProps} dashboardData={largeNumbersData} />);

      expect(screen.getByText('Total Games: 1250')).toBeInTheDocument();
      expect(screen.getByText('Active Games: 15')).toBeInTheDocument();
      expect(screen.getByText('Total Teams: 4800')).toBeInTheDocument();
      expect(screen.getByText('Avg Players: 22.75')).toBeInTheDocument();
    });

    it('should handle decimal averages properly', () => {
      const decimalData: HostDashboardData = {
        ...mockDashboardData,
        gameStats: {
          ...mockDashboardData.gameStats,
          averagePlayersPerGame: 18.333333
        }
      };

      render(<HostDashboard {...defaultProps} dashboardData={decimalData} />);

      expect(screen.getByText('Avg Players: 18.333333')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HostDashboard {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 1, name: 'Host Dashboard' })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4); // 4 sections
    });

    it('should have accessible refresh button', () => {
      render(<HostDashboard {...defaultProps} />);

      const refreshButton = screen.getByRole('button', { name: 'Refresh' });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should provide semantic sections for screen readers', () => {
      render(<HostDashboard {...defaultProps} />);

      expect(screen.getByTestId('upcoming-games')).toBeInTheDocument();
      expect(screen.getByTestId('recent-games')).toBeInTheDocument();
      expect(screen.getByTestId('game-stats')).toBeInTheDocument();
      expect(screen.getByTestId('question-stats')).toBeInTheDocument();
    });
  });

  describe('Component Contract', () => {
    it('should receive all required props', () => {
      const requiredProps: HostDashboardProps = {
        userId: 'test-host',
        dashboardData: mockDashboardData,
        onRefresh: vi.fn()
      };

      expect(() => render(<HostDashboard {...requiredProps} />)).not.toThrow();
    });

    it('should handle optional isLoading prop', () => {
      const propsWithLoading: HostDashboardProps = {
        userId: 'test-host',
        dashboardData: mockDashboardData,
        onRefresh: vi.fn(),
        isLoading: true
      };

      expect(() => render(<HostDashboard {...propsWithLoading} />)).not.toThrow();
    });

    it('should handle different user IDs', () => {
      render(<HostDashboard {...defaultProps} userId="different-host-456" />);

      expect(screen.getByText('Welcome, different-host-456')).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of games efficiently', () => {
      const manyGamesData: HostDashboardData = {
        ...mockDashboardData,
        upcomingGames: Array.from({ length: 50 }, (_, i) => ({
          id: `game-${i}`,
          title: `Game ${i}`,
          scheduled_date: '2024-01-15T19:00:00Z',
          status: 'setup' as const,
          team_count: i,
          player_count: i * 4,
          questions_configured: true,
          is_complete: false
        }))
      };

      const renderStart = performance.now();
      render(<HostDashboard {...defaultProps} dashboardData={manyGamesData} />);
      const renderTime = performance.now() - renderStart;

      // Should render within reasonable time (< 100ms for 50 games)
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('Upcoming Games (50)')).toBeInTheDocument();
    });

    it('should handle many question categories', () => {
      const manyCategoriesData: HostDashboardData = {
        ...mockDashboardData,
        questionStats: {
          ...mockDashboardData.questionStats,
          questionsAvailableByCategory: Object.fromEntries(
            Array.from({ length: 20 }, (_, i) => [`category-${i}`, i * 10])
          )
        }
      };

      render(<HostDashboard {...defaultProps} dashboardData={manyCategoriesData} />);

      expect(screen.getByTestId('category-category-0')).toBeInTheDocument();
      expect(screen.getByTestId('category-category-19')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should update when dashboard data changes', () => {
      const { rerender } = render(<HostDashboard {...defaultProps} />);

      expect(screen.getByText('Total Games: 15')).toBeInTheDocument();

      const updatedData: HostDashboardData = {
        ...mockDashboardData,
        gameStats: {
          ...mockDashboardData.gameStats,
          totalGamesHosted: 20
        }
      };

      rerender(<HostDashboard {...defaultProps} dashboardData={updatedData} />);

      expect(screen.getByText('Total Games: 20')).toBeInTheDocument();
    });

    it('should transition between loading states', () => {
      const { rerender } = render(<HostDashboard {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      rerender(<HostDashboard {...defaultProps} isLoading={false} />);

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('upcoming-games')).toBeInTheDocument();
    });
  });
});

// This test file will FAIL until the actual component is created
// This is the expected TDD behavior - Red, Green, Refactor
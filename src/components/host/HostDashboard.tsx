import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Plus, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import type { HostDashboardProps } from '@/contracts/host-components';

export const HostDashboard = memo(function HostDashboard({ userId, dashboardData, onRefresh, isLoading }: HostDashboardProps) {
  if (isLoading) {
    return (
      <div data-testid="host-dashboard" className="flex items-center justify-center min-h-64">
        <div data-testid="loading-spinner" className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Handle case when dashboardData is null or undefined
  if (!dashboardData) {
    return (
      <div data-testid="host-dashboard" className="space-y-6">
        {/* Dashboard Header */}
        <header data-testid="dashboard-header" className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Host Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {userId}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              data-testid="refresh-button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Game
            </Button>
          </div>
        </header>

        {/* Error/Empty State */}
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <BarChart3 className="w-16 h-16 text-muted-foreground opacity-50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Dashboard Unavailable</h2>
                <p className="text-muted-foreground max-w-md">
                  Unable to load dashboard data. This might be because the database is not fully set up yet.
                </p>
              </div>
              <Button onClick={onRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      setup: 'secondary',
      active: 'default',
      completed: 'outline'
    } as const;
    return variants[status as keyof typeof variants] || 'secondary';
  };

  return (
    <div data-testid="host-dashboard" className="space-y-6">
      {/* Dashboard Header */}
      <header data-testid="dashboard-header" className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Host Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {userId}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            data-testid="refresh-button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link to="/host/games/new">
              <Plus className="h-4 w-4 mr-2" />
              New Game
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div data-testid="total-games" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="font-medium">Total Games: {dashboardData.gameStats.totalGamesHosted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div data-testid="active-games" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Active Games</p>
                <p className="font-medium">Active Games: {dashboardData.gameStats.activeGames}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div data-testid="total-teams" className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="font-medium">Total Teams: {dashboardData.gameStats.totalTeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div data-testid="avg-players" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Players</p>
                <p className="font-medium">Avg Players: {dashboardData.gameStats.averagePlayersPerGame}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Games */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="upcoming-games">
              Upcoming Games ({dashboardData.upcomingGames.length})
            </CardTitle>
            <CardDescription>
              Games scheduled or in setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.upcomingGames.length === 0 ? (
              <p className="text-muted-foreground">No upcoming games</p>
            ) : (
              dashboardData.upcomingGames.map(game => (
                <div
                  key={game.id}
                  data-testid={`upcoming-game-${game.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">{game.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Status: {game.status}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Teams: {game.team_count}, Players: {game.player_count}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Questions: {game.questions_configured ? 'Configured' : 'Not Configured'}
                    </p>
                  </div>
                  <Badge variant={getStatusBadge(game.status)}>
                    {game.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Games */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="recent-games">
              Recent Games ({dashboardData.recentGames.length})
            </CardTitle>
            <CardDescription>
              Recently completed games
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentGames.length === 0 ? (
              <p className="text-muted-foreground">No recent games</p>
            ) : (
              dashboardData.recentGames.map(game => (
                <div
                  key={game.id}
                  data-testid={`recent-game-${game.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">{game.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Completed: {game.is_complete ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {game.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Statistics */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="game-stats">Game Statistics</CardTitle>
            <CardDescription>
              Your hosting performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div data-testid="stats-grid" className="grid grid-cols-2 gap-4 text-center">
              <div data-testid="total-games" className="p-3 border rounded-lg">
                <p className="text-2xl font-bold">{dashboardData.gameStats.totalGamesHosted}</p>
                <p className="text-sm text-muted-foreground">Total Games</p>
              </div>
              <div data-testid="active-games" className="p-3 border rounded-lg">
                <p className="text-2xl font-bold">{dashboardData.gameStats.activeGames}</p>
                <p className="text-sm text-muted-foreground">Active Games</p>
              </div>
              <div data-testid="total-teams" className="p-3 border rounded-lg">
                <p className="text-2xl font-bold">{dashboardData.gameStats.totalTeams}</p>
                <p className="text-sm text-muted-foreground">Total Teams</p>
              </div>
              <div data-testid="avg-players" className="p-3 border rounded-lg">
                <p className="text-2xl font-bold">{dashboardData.gameStats.averagePlayersPerGame}</p>
                <p className="text-sm text-muted-foreground">Avg Players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Statistics */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="question-stats">Question Statistics</CardTitle>
            <CardDescription>
              Your question usage and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div data-testid="question-summary" className="space-y-2">
              <p>
                <span className="font-medium">Total Questions Used:</span>{' '}
                {dashboardData.questionStats.totalQuestionsUsed}
              </p>
              <p>
                <span className="font-medium">Favorite Categories:</span>{' '}
                {dashboardData.questionStats.favoriteCategories.join(', ')}
              </p>
            </div>

            <Separator />

            <div data-testid="category-availability" className="space-y-2">
              <h4 className="font-medium">Available Questions by Category</h4>
              {Object.entries(dashboardData.questionStats.questionsAvailableByCategory).map(([category, count]) => (
                <div
                  key={category}
                  data-testid={`category-${category}`}
                  className="flex justify-between items-center"
                >
                  <span className="capitalize">{category}</span>
                  <Badge variant="secondary">{count} questions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default HostDashboard;
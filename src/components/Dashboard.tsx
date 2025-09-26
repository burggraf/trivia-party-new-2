import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PausedGameCard } from '@/components/game/PausedGameCard';
import {
  Gamepad2,
  Trophy,
  Target,
  TrendingUp,
  Play,
  BarChart3,
  Clock,
  Award,
  Loader2
} from 'lucide-react';

export function Dashboard() {
  const { state: authState } = useAuth();
  const { state: gameState, loadUserProfile, loadGameHistory } = useGame();

  useEffect(() => {
    if (authState.user?.id) {
      loadUserProfile(authState.user.id);
      loadGameHistory(authState.user.id);
    }
  }, [authState.user?.id, loadUserProfile, loadGameHistory]);

  const profile = gameState.userProfile;
  const recentGames = gameState.gameHistory.slice(0, 3);
  const overallAccuracy = profile?.total_questions_answered
    ? Math.round((profile.total_correct_answers / profile.total_questions_answered) * 100)
    : 0;

  const hasPlayedGames = (profile?.total_games_played || 0) > 0;

  // Get games that can be resumed (paused or in_progress, up to 3 most recent)
  // Only show games from the last 24 hours to avoid showing very old abandoned games
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const resumableGames = gameState.gameHistory
    .filter(game => {
      const isResumableStatus = game.status === 'paused' || game.status === 'in_progress';
      const isRecent = new Date(game.updated_at) > oneDayAgo;
      return isResumableStatus && isRecent;
    })
    .slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {gameState.error && (
        <Alert variant="destructive">
          <AlertDescription>{gameState.error}</AlertDescription>
        </Alert>
      )}

      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
            <Gamepad2 className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold">
            Welcome back{profile?.username ? `, ${profile.username}` : ''}!
          </h1>
          <p className="text-xl text-muted-foreground">
            Ready for your next trivia challenge?
          </p>
        </div>
      </div>

      {/* Resumable Games Section */}
      {resumableGames.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-amber-700 dark:text-amber-400">
              Continue Playing
            </h2>
            <p className="text-muted-foreground">
              You have {resumableGames.length} game{resumableGames.length > 1 ? 's' : ''} waiting for you
            </p>
          </div>
          <div className="space-y-3">
            {resumableGames.map((game) => (
              <PausedGameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg" className="flex-1 sm:flex-none">
          <Link to="/game/setup">
            <Play className="w-5 h-5 mr-2" />
            Start New Game
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-none">
          <Link to="/profile">
            <BarChart3 className="w-5 h-5 mr-2" />
            View Stats
          </Link>
        </Button>
      </div>

      {/* Statistics Overview */}
      {gameState.loading && !profile ? (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : hasPlayedGames ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Played</CardTitle>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.total_games_played || 0}</div>
              <p className="text-xs text-muted-foreground">
                Keep it up!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAccuracy}%</div>
              <p className="text-xs text-muted-foreground">
                {profile?.total_correct_answers || 0} of {profile?.total_questions_answered || 0} correct
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.total_correct_answers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Points earned
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Gamepad2 className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-4">Start Your Trivia Journey</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't played any games yet. Start your first trivia game to begin tracking your progress and see your statistics here!
            </p>
            <Button asChild size="lg">
              <Link to="/game/setup">
                <Play className="w-5 h-5 mr-2" />
                Play Your First Game
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Games */}
      {hasPlayedGames && recentGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Recent Games
            </CardTitle>
            <CardDescription>
              Your last {recentGames.length} game sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGames.map((game) => {
                const gameAccuracy = game.total_rounds && game.questions_per_round
                  ? Math.round((game.total_score / (game.total_rounds * game.questions_per_round)) * 100)
                  : 0;

                return (
                  <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        game.status === 'completed'
                          ? gameAccuracy >= 70 ? 'bg-green-500' : 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {game.total_rounds} rounds, {game.questions_per_round} questions each
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {game.selected_categories.slice(0, 2).join(', ')}
                          {game.selected_categories.length > 2 && ` +${game.selected_categories.length - 2}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Badge variant={game.status === 'completed' ? 'default' : 'secondary'}>
                          {game.status}
                        </Badge>
                        {game.status === 'completed' && (
                          <Badge variant="outline">
                            {gameAccuracy}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Score: {game.total_score}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 text-center">
              <Button asChild variant="outline">
                <Link to="/profile">
                  <Trophy className="w-4 h-4 mr-2" />
                  View All Games
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      {!hasPlayedGames && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Game Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Choose Your Categories</p>
                  <p className="text-sm text-muted-foreground">Select categories you're confident in for better scores.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Take Your Time</p>
                  <p className="text-sm text-muted-foreground">There's no time limit, so think through your answers.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Track Progress</p>
                  <p className="text-sm text-muted-foreground">Your stats and achievements are saved automatically.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Pause Anytime</p>
                  <p className="text-sm text-muted-foreground">Need a break? You can pause and resume your game.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
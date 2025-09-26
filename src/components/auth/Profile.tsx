import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Trophy,
  Target,
  Gamepad2,
  TrendingUp,
  Star,
  LogOut,
  Loader2,
  Play,
  Pause
} from 'lucide-react';

export function Profile() {
  const { state: authState, signOut } = useAuth();
  const { state: gameState, loadUserProfile, loadGameHistory, resumePausedGame } = useGame();
  const navigate = useNavigate();
  const [resumingGameId, setResumingGameId] = useState<string | null>(null);

  useEffect(() => {
    if (authState.user?.id) {
      loadUserProfile(authState.user.id);
      loadGameHistory(authState.user.id);
    }
  }, [authState.user?.id, loadUserProfile, loadGameHistory]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleResume = async (gameId: string) => {
    setResumingGameId(gameId);
    try {
      await resumePausedGame(gameId);
      navigate('/game/play');
    } catch (error) {
      console.error('Failed to resume game:', error);
    } finally {
      setResumingGameId(null);
    }
  };

  if (gameState.loading && !gameState.userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const profile = gameState.userProfile;
  const recentGames = gameState.gameHistory.slice(0, 5);
  const overallAccuracy = profile?.total_questions_answered
    ? Math.round((profile.total_correct_answers / profile.total_questions_answered) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {gameState.error && (
        <Alert variant="destructive">
          <AlertDescription>{gameState.error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile?.username || authState.user?.email}</h1>
            <p className="text-muted-foreground">Trivia Player</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Separator />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.total_games_played || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Categories</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {profile?.favorite_categories?.length ? (
                profile.favorite_categories.slice(0, 2).map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games */}
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
          {recentGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No games played yet</p>
              <p className="text-sm">Start your first trivia game to see your progress here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentGames.map((game) => {
                const gameAccuracy = game.total_rounds && game.questions_per_round
                  ? Math.round((game.total_score / (game.total_rounds * game.questions_per_round)) * 100)
                  : 0;

                return (
                  <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${
                          game.status === 'completed'
                            ? gameAccuracy >= 70 ? 'bg-green-500' : 'bg-yellow-500'
                            : game.status === 'paused'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`} />
                        {game.status === 'paused' && (
                          <Pause className="w-3 h-3 text-amber-600 absolute -top-1 -right-1" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {game.total_rounds} rounds, {game.questions_per_round} questions each
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Categories: {game.selected_categories.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {game.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => handleResume(game.id)}
                          disabled={resumingGameId === game.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {resumingGameId === game.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Resuming...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Resume
                            </>
                          )}
                        </Button>
                      )}
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            game.status === 'completed' ? 'default' :
                            game.status === 'paused' ? 'secondary' : 'secondary'
                          }>
                            {game.status}
                          </Badge>
                          {game.status === 'completed' && (
                            <Badge variant="outline">
                              {gameAccuracy}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Score: {game.total_score}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
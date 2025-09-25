import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  Star,
  Target,
  Clock,
  TrendingUp,
  RefreshCw,
  Home,
  Share2,
  Award,
  Zap,
  CheckCircle,
  Loader2
} from 'lucide-react';

export function GameResults() {
  const navigate = useNavigate();
  const { state: gameState, resetGameState } = useGame();

  const gameSummary = gameState.currentGameSummary;
  const currentSession = gameState.currentSession;

  // Redirect if no game data
  useEffect(() => {
    if (!gameSummary && !currentSession) {
      navigate('/game/setup');
    }
  }, [gameSummary, currentSession, navigate]);

  if (gameState.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!gameSummary && !currentSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            No game results found. Please start a new game.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate metrics
  const totalQuestions = gameSummary?.total_questions || (currentSession?.total_rounds * currentSession?.questions_per_round) || 0;
  const correctAnswers = gameSummary?.correct_answers || currentSession?.total_score || 0;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const totalDuration = gameSummary?.total_duration_ms || 0;
  const averageTimePerQuestion = totalQuestions > 0 ? Math.round(totalDuration / totalQuestions / 1000) : 0;

  // Performance evaluation
  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: 'Excellent', color: 'text-green-600', icon: Award };
    if (accuracy >= 80) return { level: 'Great', color: 'text-blue-600', icon: Trophy };
    if (accuracy >= 70) return { level: 'Good', color: 'text-yellow-600', icon: Star };
    if (accuracy >= 60) return { level: 'Fair', color: 'text-orange-600', icon: Target };
    return { level: 'Needs Practice', color: 'text-red-600', icon: TrendingUp };
  };

  const performance = getPerformanceLevel(accuracy);
  const PerformanceIcon = performance.icon;

  const handlePlayAgain = () => {
    resetGameState();
    navigate('/game/setup');
  };

  const handleGoHome = () => {
    resetGameState();
    navigate('/');
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {gameState.error && (
          <Alert variant="destructive">
            <AlertDescription>{gameState.error}</AlertDescription>
          </Alert>
        )}

        {/* Results Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className={`flex items-center justify-center w-20 h-20 rounded-full border-4 ${
              accuracy >= 80 ? 'border-green-500 bg-green-100 dark:bg-green-900' :
              accuracy >= 60 ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900' :
              'border-red-500 bg-red-100 dark:bg-red-900'
            }`}>
              <PerformanceIcon className={`w-10 h-10 ${performance.color}`} />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold">Game Complete!</h1>
            <p className={`text-xl ${performance.color} font-medium`}>
              {performance.level} Performance
            </p>
            {gameSummary?.personal_best && (
              <Badge variant="outline" className="mt-2">
                <Star className="w-4 h-4 mr-1" />
                Personal Best!
              </Badge>
            )}
          </div>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-600" />
                Final Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{correctAnswers}</div>
              <div className="text-sm text-muted-foreground">out of {totalQuestions} questions</div>
              <div className="mt-4">
                <Progress value={accuracy} className="h-3" />
                <div className="text-lg font-semibold mt-2">{accuracy}% Accuracy</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center">
                <Clock className="w-6 h-6 mr-2 text-blue-600" />
                Time Taken
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {formatDuration(totalDuration)}
              </div>
              <div className="text-sm text-muted-foreground">total time</div>
              <div className="mt-4">
                <div className="text-lg font-semibold">{averageTimePerQuestion}s</div>
                <div className="text-sm text-muted-foreground">per question</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center">
                <Zap className="w-6 h-6 mr-2 text-purple-600" />
                Speed Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {averageTimePerQuestion <= 10 ? 'Fast' : averageTimePerQuestion <= 20 ? 'Good' : 'Steady'}
              </div>
              <div className="text-sm text-muted-foreground">response time</div>
              <div className="mt-4">
                <Badge variant={averageTimePerQuestion <= 10 ? 'default' : 'secondary'}>
                  {averageTimePerQuestion <= 10 ? 'Lightning Quick' :
                   averageTimePerQuestion <= 20 ? 'Well Paced' : 'Thoughtful'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Round Breakdown */}
        {gameSummary?.rounds && gameSummary.rounds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Round Breakdown
              </CardTitle>
              <CardDescription>
                Your performance across each round
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gameSummary.rounds.map((round, index) => (
                  <div key={round.round_number} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">{round.round_number}</span>
                        </div>
                        <div>
                          <div className="font-medium">Round {round.round_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {round.correct_answers} of {round.total_questions} correct
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-x-2">
                        <Badge variant="outline">
                          {round.accuracy_percentage.toFixed(0)}%
                        </Badge>
                        <Badge variant="secondary">
                          {formatDuration(round.duration_ms)}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={round.accuracy_percentage} className="h-2" />
                    {index < gameSummary.rounds.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Performance */}
        {currentSession?.selected_categories && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Categories Played
              </CardTitle>
              <CardDescription>
                Question categories in this game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentSession.selected_categories.map((category) => (
                  <Badge key={category} variant="outline" className="text-sm">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accuracy === 100 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <div className="font-medium">Perfect Score!</div>
                    <div className="text-sm text-muted-foreground">Answered every question correctly</div>
                  </div>
                </div>
              )}

              {averageTimePerQuestion <= 10 && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium">Speed Demon</div>
                    <div className="text-sm text-muted-foreground">Average under 10 seconds per question</div>
                  </div>
                </div>
              )}

              {accuracy >= 90 && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-medium">Trivia Master</div>
                    <div className="text-sm text-muted-foreground">Over 90% accuracy</div>
                  </div>
                </div>
              )}

              {totalQuestions >= 30 && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                  <div>
                    <div className="font-medium">Marathon Player</div>
                    <div className="text-sm text-muted-foreground">Completed a long game</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handlePlayAgain} size="lg" className="flex-1 sm:flex-none">
            <RefreshCw className="w-4 h-4 mr-2" />
            Play Again
          </Button>

          <Button variant="outline" size="lg" className="flex-1 sm:flex-none">
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>

          <Button variant="outline" onClick={handleGoHome} size="lg" className="flex-1 sm:flex-none">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
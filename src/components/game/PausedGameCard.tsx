import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Play,
  Trash2,
  Gamepad2,
  Trophy,
  Target,
  Loader2
} from 'lucide-react';
import type { GameSession } from '@/contracts/game';

interface PausedGameCardProps {
  game: GameSession;
}

export function PausedGameCard({ game }: PausedGameCardProps) {
  const { state: gameState, resumePausedGame, abandonGame } = useGame();
  const navigate = useNavigate();
  const [isResuming, setIsResuming] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);

  const handleResume = async () => {
    setIsResuming(true);
    try {
      await resumePausedGame(game.id);
      // Navigate to game play page after successful resume
      navigate('/game/play');
    } catch (error) {
      // Error handling is done in the context
      console.error('Failed to resume game:', error);
    } finally {
      setIsResuming(false);
    }
  };

  const handleAbandon = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to abandon this game? You'll lose all progress from Round ${game.current_round} and your current score of ${game.total_score} points. This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsAbandoning(true);
    try {
      await abandonGame(game.id);
    } catch (error) {
      console.error('Failed to abandon game:', error);
    } finally {
      setIsAbandoning(false);
    }
  };

  // Calculate game progress
  const totalQuestions = game.total_rounds * game.questions_per_round;

  // Fix: Calculate the actual answered questions correctly
  // current_question_index appears to be a cumulative count across all rounds, not per-round index
  const rawAnsweredQuestions = Math.max(0, game.current_question_index || 0);

  // Safety: Ensure we never exceed total questions
  const answeredQuestions = Math.min(rawAnsweredQuestions, totalQuestions);

  // Safety: Cap percentage between 0 and 100
  const rawPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const progressPercentage = Math.min(100, Math.max(0, Math.round(rawPercentage)));

  // Calculate time since paused
  const timeSincePaused = game.updated_at ? new Date().getTime() - new Date(game.updated_at).getTime() : 0;
  const hoursSincePaused = Math.floor(timeSincePaused / (1000 * 60 * 60));
  const minutesSincePaused = Math.floor((timeSincePaused % (1000 * 60 * 60)) / (1000 * 60));

  const getTimeDisplay = () => {
    const prefix = game.status === 'paused' ? 'Paused' : 'Last activity';
    if (hoursSincePaused > 0) {
      return `${prefix} ${hoursSincePaused}h ${minutesSincePaused}m ago`;
    } else if (minutesSincePaused > 0) {
      return `${prefix} ${minutesSincePaused}m ago`;
    } else {
      return game.status === 'paused' ? 'Just paused' : 'Just updated';
    }
  };

  return (
    <Card className={`border-l-4 ${game.status === 'paused' ? 'border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-background dark:from-amber-950/20 dark:to-background' : 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-background dark:from-blue-950/20 dark:to-background'}`}>
      <CardContent className="p-6">
        {gameState.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{gameState.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Game Icon */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Gamepad2 className="w-6 h-6 text-amber-600" />
              </div>
              <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-amber-500 rounded-full">
                <Clock className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Game Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary" className={game.status === 'paused' ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}>
                  {game.status === 'paused' ? 'Paused' : 'In Progress'}
                </Badge>
                <span className="text-sm text-muted-foreground">{getTimeDisplay()}</span>
              </div>

              <h3 className="font-semibold text-lg mb-1">
                Round {game.current_round} of {game.total_rounds}
              </h3>

              <p className="text-sm text-muted-foreground mb-3">
                {game.questions_per_round} questions per round • Categories: {game.selected_categories.slice(0, 2).join(', ')}
                {game.selected_categories.length > 2 && ` +${game.selected_categories.length - 2} more`}
              </p>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progressPercentage}% complete</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span>{answeredQuestions} of {totalQuestions} questions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-4 h-4" />
                    <span>{game.total_score} points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 ml-4">
            <Button
              onClick={handleResume}
              disabled={isResuming || gameState.loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isResuming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resuming...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume Game
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAbandon}
              disabled={isAbandoning || gameState.loading}
              className="text-muted-foreground hover:text-destructive"
            >
              {isAbandoning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
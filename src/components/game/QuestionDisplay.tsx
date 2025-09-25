import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  ArrowRight,
  Trophy,
  Loader2
} from 'lucide-react';

export function QuestionDisplay() {
  const navigate = useNavigate();
  const { state: gameState, submitAnswer, pauseGame, resumeGame } = useGame();

  // Component state
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeStarted, setTimeStarted] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);

  const currentQuestion = gameState.currentQuestion;
  const currentSession = gameState.currentSession;

  // Reset state when new question appears
  useEffect(() => {
    if (currentQuestion && !gameState.showResult) {
      setSelectedAnswer('');
      setTimeStarted(Date.now());
      setIsPaused(false);
    }
  }, [currentQuestion, gameState.showResult]);

  // Navigate to results if game is completed
  useEffect(() => {
    if (gameState.gameStatus === 'completed') {
      navigate('/game/results');
    }
  }, [gameState.gameStatus, navigate]);

  const handleAnswerSelect = (answerText: string) => {
    if (gameState.answering || gameState.showResult || isPaused) return;
    setSelectedAnswer(answerText);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || gameState.answering) return;

    const timeToAnswer = Date.now() - timeStarted;
    await submitAnswer(selectedAnswer, timeToAnswer);
  };

  const handlePause = async () => {
    setIsPaused(true);
    await pauseGame();
  };

  const handleResume = async () => {
    setIsPaused(false);
    setTimeStarted(Date.now()); // Reset timer
    await resumeGame();
  };

  if (!currentQuestion || !currentSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const progress = currentSession.total_rounds > 0
    ? ((currentSession.current_round - 1) / currentSession.total_rounds) * 100
    : 0;

  const questionProgress = currentSession.questions_per_round > 0
    ? ((currentSession.current_question_index + 1) / currentSession.questions_per_round) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {gameState.error && (
          <Alert variant="destructive">
            <AlertDescription>{gameState.error}</AlertDescription>
          </Alert>
        )}

        {/* Game Progress Header */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">
                  Round {currentSession.current_round} of {currentSession.total_rounds}
                </CardTitle>
                <CardDescription>
                  Question {currentSession.current_question_index + 1} of {currentSession.questions_per_round}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{currentSession.total_score}</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPaused ? handleResume : handlePause}
                  disabled={gameState.loading}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Round Progress</span>
                <span>{Math.round(questionProgress)}%</span>
              </div>
              <Progress value={questionProgress} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Pause Overlay */}
        {isPaused && (
          <Card className="border-2 border-dashed border-muted-foreground/50">
            <CardContent className="py-12 text-center">
              <Pause className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Game Paused</h2>
              <p className="text-muted-foreground mb-6">
                Take your time! Click resume when you're ready to continue.
              </p>
              <Button onClick={handleResume} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Resume Game
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Question Card */}
        {!isPaused && (
          <Card className={gameState.showResult ? 'border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{currentQuestion.category}</Badge>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Question {currentQuestion.question_number}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.answers.map((answer) => {
                  const isSelected = selectedAnswer === answer.text;
                  let buttonVariant: "default" | "outline" | "secondary" | "destructive" = "outline";
                  let Icon = null;

                  if (gameState.showResult) {
                    if (answer.text === gameState.currentQuestion?.correct_answer) {
                      buttonVariant = "default";
                      Icon = CheckCircle;
                    } else if (isSelected && !gameState.lastAnswerCorrect) {
                      buttonVariant = "destructive";
                      Icon = XCircle;
                    }
                  } else if (isSelected) {
                    buttonVariant = "secondary";
                  }

                  return (
                    <Button
                      key={answer.label}
                      variant={buttonVariant}
                      className="h-auto p-4 text-left justify-start"
                      onClick={() => handleAnswerSelect(answer.text)}
                      disabled={gameState.answering || gameState.showResult}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center font-bold">
                          {answer.label}
                        </div>
                        <div className="flex-1 text-left">
                          {answer.text}
                        </div>
                        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                      </div>
                    </Button>
                  );
                })}
              </div>

              {/* Result Display */}
              {gameState.showResult && (
                <Card className={`border-2 ${gameState.lastAnswerCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center space-x-3">
                      {gameState.lastAnswerCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {gameState.lastAnswerCorrect ? 'Correct!' : 'Incorrect!'}
                        </p>
                        {!gameState.lastAnswerCorrect && (
                          <p className="text-sm text-muted-foreground">
                            The correct answer was: {currentQuestion.correct_answer || 'Unknown'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4">
                <div>
                  {selectedAnswer && !gameState.showResult && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedAnswer}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  {!gameState.showResult ? (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer || gameState.answering}
                      size="lg"
                    >
                      {gameState.answering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Answer
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        {gameState.gameStatus === 'completed' ? 'Game completed!' : 'Next question coming up...'}
                      </p>
                      {gameState.gameStatus === 'completed' && (
                        <Button
                          onClick={() => navigate('/game/results')}
                          size="lg"
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          View Results
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
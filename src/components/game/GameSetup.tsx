import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Gamepad2,
  Settings,
  Zap,
  Target,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';

export function GameSetup() {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { state: gameState, loadAvailableCategories, createGameSession, startGame } = useGame();

  // Form state
  const [totalRounds, setTotalRounds] = useState(3);
  const [questionsPerRound, setQuestionsPerRound] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Load available categories on mount
  useEffect(() => {
    loadAvailableCategories();
  }, [loadAvailableCategories]);

  // Validation
  const isValid = selectedCategories.length > 0 && totalRounds > 0 && questionsPerRound > 0;
  const totalQuestions = totalRounds * questionsPerRound;

  const handleCategoryToggle = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
  };

  const handleStartGame = async () => {
    if (!authState.user?.id || !isValid) return;

    setIsCreating(true);
    try {
      // Create game session
      await createGameSession(authState.user.id, {
        total_rounds: totalRounds,
        questions_per_round: questionsPerRound,
        selected_categories: selectedCategories
      });

      // If session created successfully, start the game
      if (gameState.currentSession) {
        await startGame();
        navigate('/game/play');
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const quickSetupOptions = [
    {
      name: 'Quick Game',
      rounds: 2,
      questions: 5,
      icon: Zap,
      description: '10 questions total'
    },
    {
      name: 'Standard Game',
      rounds: 3,
      questions: 5,
      icon: Target,
      description: '15 questions total'
    },
    {
      name: 'Long Game',
      rounds: 5,
      questions: 8,
      icon: Clock,
      description: '40 questions total'
    }
  ];

  const applyQuickSetup = (rounds: number, questions: number) => {
    setTotalRounds(rounds);
    setQuestionsPerRound(questions);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
              <Gamepad2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Setup Your Trivia Game</h1>
            <p className="text-muted-foreground">
              Configure your game settings and select question categories
            </p>
          </div>
        </div>

        {gameState.error && (
          <Alert variant="destructive">
            <AlertDescription>{gameState.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Setup */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Quick Setup
              </CardTitle>
              <CardDescription>
                Choose a preset configuration to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickSetupOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = totalRounds === option.rounds && questionsPerRound === option.questions;

                return (
                  <Button
                    key={option.name}
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-start h-auto p-4"
                    onClick={() => applyQuickSetup(option.rounds, option.questions)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">{option.name}</div>
                        <div className="text-sm opacity-70">{option.description}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 ml-auto" />}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Custom Setup */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Custom Configuration
              </CardTitle>
              <CardDescription>
                Fine-tune your game settings for a personalized experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Game Structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rounds">Number of Rounds</Label>
                  <Select
                    value={totalRounds.toString()}
                    onValueChange={(value) => setTotalRounds(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rounds" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} round{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questions">Questions per Round</Label>
                  <Select
                    value={questionsPerRound.toString()}
                    onValueChange={(value) => setQuestionsPerRound(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select questions" />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} question{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Game Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{totalRounds}</div>
                    <div className="text-sm text-muted-foreground">Rounds</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{questionsPerRound}</div>
                    <div className="text-sm text-muted-foreground">Per Round</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{totalQuestions}</div>
                    <div className="text-sm text-muted-foreground">Total Questions</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Category Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Question Categories</Label>
                  <p className="text-sm text-muted-foreground">
                    Select at least one category for your game
                  </p>
                </div>

                {gameState.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : gameState.availableCategories.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No categories available. Please check your connection and try again.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {gameState.availableCategories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                        />
                        <Label
                          htmlFor={category}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCategories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Selected Categories:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Start Game Button */}
              <div className="pt-4">
                <Button
                  onClick={handleStartGame}
                  disabled={!isValid || isCreating || gameState.loading}
                  className="w-full h-12"
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Starting Game...
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="mr-2 h-5 w-5" />
                      Start Game
                    </>
                  )}
                </Button>

                {!isValid && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Please select at least one category to continue
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
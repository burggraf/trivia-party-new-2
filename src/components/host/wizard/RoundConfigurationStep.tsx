import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, HelpCircle } from 'lucide-react';

interface RoundConfigurationStepProps {
  totalRounds?: number;
  questionsPerRound?: number;
  onTotalRoundsChange?: (rounds: number) => void;
  onQuestionsPerRoundChange?: (questions: number) => void;
  isValid?: boolean;
}

export function RoundConfigurationStep({
  totalRounds = 3,
  questionsPerRound = 10,
  onTotalRoundsChange,
  onQuestionsPerRoundChange,
  isValid = true
}: RoundConfigurationStepProps) {
  const handleTotalRoundsChange = (value: string) => {
    const rounds = parseInt(value) || 1;
    onTotalRoundsChange?.(Math.min(Math.max(rounds, 1), 10));
  };

  const handleQuestionsPerRoundChange = (value: string) => {
    const questions = parseInt(value) || 5;
    onQuestionsPerRoundChange?.(Math.min(Math.max(questions, 5), 20));
  };

  return (
    <div data-testid="rounds-step" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Round Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure how many rounds and questions per round for your game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Rounds */}
            <div className="space-y-2">
              <Label htmlFor="total-rounds-input" className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Total Rounds</span>
              </Label>
              <Input
                id="total-rounds-input"
                data-testid="total-rounds-input"
                type="number"
                min="1"
                max="10"
                value={totalRounds}
                onChange={(e) => handleTotalRoundsChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Between 1 and 10 rounds
              </p>
            </div>

            {/* Questions per Round */}
            <div className="space-y-2">
              <Label htmlFor="questions-per-round-input" className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4" />
                <span>Questions per Round</span>
              </Label>
              <Input
                id="questions-per-round-input"
                data-testid="questions-per-round-input"
                type="number"
                min="5"
                max="20"
                value={questionsPerRound}
                onChange={(e) => handleQuestionsPerRoundChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Between 5 and 20 questions per round
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Game Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Rounds:</span>
                <span className="ml-2 font-medium">{totalRounds}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Questions per Round:</span>
                <span className="ml-2 font-medium">{questionsPerRound}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="ml-2 font-medium text-primary">
                  {totalRounds * questionsPerRound}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RoundConfigurationStep;
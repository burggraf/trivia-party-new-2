import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  HelpCircle,
  Tag,
  RotateCcw,
  Settings,
  AlertCircle
} from 'lucide-react';

interface GameConfiguration {
  title?: string;
  location?: string;
  scheduled_date?: string;
  total_rounds?: number;
  questions_per_round?: number;
  selected_categories?: string[];
  max_teams?: number;
  max_players_per_team?: number;
  min_players_per_team?: number;
  self_registration_enabled?: boolean;
}

interface GameReviewStepProps {
  gameData: GameConfiguration;
  isValid?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  science: 'bg-blue-100 text-blue-800',
  history: 'bg-purple-100 text-purple-800',
  sports: 'bg-orange-100 text-orange-800',
  entertainment: 'bg-pink-100 text-pink-800',
  geography: 'bg-green-100 text-green-800',
  literature: 'bg-indigo-100 text-indigo-800'
};

export function GameReviewStep({
  gameData,
  isValid = true
}: GameReviewStepProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalQuestions = (gameData.total_rounds || 0) * (gameData.questions_per_round || 0);
  const maxTotalPlayers = (gameData.max_teams || 0) * (gameData.max_players_per_team || 0);

  return (
    <div data-testid="review-step" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Review Game Configuration</span>
          </CardTitle>
          <CardDescription>
            Review all settings before creating your trivia game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div data-testid="game-summary" className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Basic Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Game Title</p>
                  <p className="font-medium">{gameData.title || 'Untitled Game'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{gameData.location || 'No location set'}</span>
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p className="font-medium flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(gameData.scheduled_date)}</span>
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Round Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <RotateCcw className="h-5 w-5" />
                <span>Round Configuration</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Rounds</p>
                  <p className="font-medium">{gameData.total_rounds || 3}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Questions per Round</p>
                  <p className="font-medium">{gameData.questions_per_round || 10}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                  <p className="font-medium text-primary">{totalQuestions}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span>Question Categories</span>
              </h3>
              {gameData.selected_categories && gameData.selected_categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {gameData.selected_categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className={CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>No categories selected</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Team Setup */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Team Configuration</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Max Teams</p>
                  <p className="font-medium">{gameData.max_teams || 6}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="font-medium">
                    {gameData.min_players_per_team || 2}-{gameData.max_players_per_team || 4}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Max Total Players</p>
                  <p className="font-medium text-primary">{maxTotalPlayers}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Self Registration</p>
                  <div className="flex items-center space-x-2">
                    {gameData.self_registration_enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="font-medium">
                      {gameData.self_registration_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Issues */}
            {!isValid && (
              <>
                <Separator />
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Configuration Issues</span>
                  </h4>
                  <ul className="text-sm text-destructive space-y-1">
                    {!gameData.title?.trim() && (
                      <li>• Game title is required</li>
                    )}
                    {(!gameData.selected_categories || gameData.selected_categories.length === 0) && (
                      <li>• At least one category must be selected</li>
                    )}
                    {(gameData.min_players_per_team || 0) > (gameData.max_players_per_team || 0) && (
                      <li>• Minimum players per team cannot exceed maximum players per team</li>
                    )}
                  </ul>
                </div>
              </>
            )}

            {/* Summary Stats */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <HelpCircle className="h-4 w-4" />
                <span>Game Overview</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{totalQuestions}</p>
                  <p className="text-muted-foreground">Total Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{gameData.max_teams || 6}</p>
                  <p className="text-muted-foreground">Max Teams</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{maxTotalPlayers}</p>
                  <p className="text-muted-foreground">Max Players</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {gameData.selected_categories?.length || 0}
                  </p>
                  <p className="text-muted-foreground">Categories</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GameReviewStep;
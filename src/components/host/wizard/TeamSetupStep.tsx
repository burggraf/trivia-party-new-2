import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Settings } from 'lucide-react';

interface TeamSetupStepProps {
  maxTeams?: number;
  maxPlayersPerTeam?: number;
  minPlayersPerTeam?: number;
  selfRegistrationEnabled?: boolean;
  onMaxTeamsChange?: (maxTeams: number) => void;
  onMaxPlayersPerTeamChange?: (maxPlayers: number) => void;
  onMinPlayersPerTeamChange?: (minPlayers: number) => void;
  onSelfRegistrationToggle?: (enabled: boolean) => void;
  isValid?: boolean;
}

export function TeamSetupStep({
  maxTeams = 6,
  maxPlayersPerTeam = 4,
  minPlayersPerTeam = 2,
  selfRegistrationEnabled = true,
  onMaxTeamsChange,
  onMaxPlayersPerTeamChange,
  onMinPlayersPerTeamChange,
  onSelfRegistrationToggle,
  isValid = true
}: TeamSetupStepProps) {
  const handleMaxTeamsChange = (value: string) => {
    const teams = parseInt(value) || 2;
    onMaxTeamsChange?.(Math.min(Math.max(teams, 2), 20));
  };

  const handleMaxPlayersChange = (value: string) => {
    const players = parseInt(value) || 1;
    onMaxPlayersPerTeamChange?.(Math.min(Math.max(players, 1), 8));
  };

  const handleMinPlayersChange = (value: string) => {
    const players = parseInt(value) || 1;
    onMinPlayersPerTeamChange?.(Math.min(Math.max(players, 1), 4));
  };

  return (
    <div data-testid="teams-step" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Setup</span>
          </CardTitle>
          <CardDescription>
            Configure team limits and registration settings for your game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Limits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Max Teams */}
            <div className="space-y-2">
              <Label htmlFor="max-teams-input" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Max Teams</span>
              </Label>
              <Input
                id="max-teams-input"
                data-testid="max-teams-input"
                type="number"
                min="2"
                max="20"
                value={maxTeams}
                onChange={(e) => handleMaxTeamsChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                2-20 teams
              </p>
            </div>

            {/* Max Players per Team */}
            <div className="space-y-2">
              <Label htmlFor="max-players-input" className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4" />
                <span>Max Players per Team</span>
              </Label>
              <Input
                id="max-players-input"
                data-testid="max-players-input"
                type="number"
                min="1"
                max="8"
                value={maxPlayersPerTeam}
                onChange={(e) => handleMaxPlayersChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                1-8 players
              </p>
            </div>

            {/* Min Players per Team */}
            <div className="space-y-2">
              <Label htmlFor="min-players-input" className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4" />
                <span>Min Players per Team</span>
              </Label>
              <Input
                id="min-players-input"
                data-testid="min-players-input"
                type="number"
                min="1"
                max="4"
                value={minPlayersPerTeam}
                onChange={(e) => handleMinPlayersChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                1-4 players
              </p>
            </div>
          </div>

          {/* Registration Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Registration Settings</span>
            </Label>

            <Label
              data-testid="self-registration-label"
              className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
            >
              <input
                data-testid="self-registration-checkbox"
                type="checkbox"
                checked={selfRegistrationEnabled}
                onChange={(e) => onSelfRegistrationToggle?.(e.target.checked)}
                className="rounded"
              />
              <div>
                <div className="font-medium">Allow Self Registration</div>
                <div className="text-sm text-muted-foreground">
                  Players can create and join teams without host approval
                </div>
              </div>
            </Label>
          </div>

          {/* Team Configuration Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Team Configuration Summary</span>
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Maximum Teams:</span>
                <span className="ml-2 font-medium">{maxTeams}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Team Size:</span>
                <span className="ml-2 font-medium">
                  {minPlayersPerTeam}-{maxPlayersPerTeam} players
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Max Total Players:</span>
                <span className="ml-2 font-medium text-primary">
                  {maxTeams * maxPlayersPerTeam}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Self Registration:</span>
                <span className="ml-2 font-medium">
                  {selfRegistrationEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Warning */}
          {minPlayersPerTeam > maxPlayersPerTeam && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Minimum players per team cannot be greater than maximum players per team
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TeamSetupStep;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Crown,
  Clock,
  CheckCircle
} from 'lucide-react';
import type { Team } from '@/contracts/multi-user-types';

interface TeamPlayer {
  id: string;
  name: string;
  email: string;
  joined_at?: string;
  is_captain?: boolean;
}

interface TeamCardProps {
  team: Team;
  players?: TeamPlayer[];
  maxPlayers?: number;
  onEdit?: (teamId: string) => void;
  onDelete?: (teamId: string) => void;
  onAddPlayer?: (teamId: string) => void;
  onRemovePlayer?: (teamId: string, playerId: string) => void;
  onPromoteToCaptain?: (teamId: string, playerId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function TeamCard({
  team,
  players = [],
  maxPlayers = 4,
  onEdit,
  onDelete,
  onAddPlayer,
  onRemovePlayer,
  onPromoteToCaptain,
  showActions = true,
  className = ''
}: TeamCardProps) {
  const [showPlayers, setShowPlayers] = useState(false);

  const playerCount = players.length;
  const isFull = playerCount >= maxPlayers;
  const isEmpty = playerCount === 0;
  const captain = players.find(p => p.is_captain);

  const getPlayerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Team Color Indicator */}
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: team.display_color }}
              data-testid="team-color-indicator"
            />

            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{playerCount}/{maxPlayers} players</span>
                {isFull && <Badge variant="secondary">Full</Badge>}
                {isEmpty && <Badge variant="outline">Empty</Badge>}
              </CardDescription>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowPlayers(!showPlayers)}>
                  <Users className="h-4 w-4 mr-2" />
                  {showPlayers ? 'Hide' : 'Show'} Players
                </DropdownMenuItem>
                {!isFull && (
                  <DropdownMenuItem onClick={() => onAddPlayer?.(team.id)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Player
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit?.(team.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Team
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(team.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Team Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Players:</span>
              <span className="font-medium">{playerCount}</span>
            </div>
            {captain && (
              <div className="flex items-center space-x-1">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">Captain:</span>
                <span className="font-medium">{captain.name}</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPlayers(!showPlayers)}
          >
            {showPlayers ? 'Hide' : 'View'} Players
          </Button>
        </div>

        {/* Player List */}
        {showPlayers && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Team Members</span>
              </h4>

              {players.length > 0 ? (
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {getPlayerInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{player.name}</span>
                            {player.is_captain && (
                              <Crown className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Joined {formatJoinDate(player.joined_at)}</span>
                          </div>
                        </div>
                      </div>

                      {showActions && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!player.is_captain && (
                              <DropdownMenuItem
                                onClick={() => onPromoteToCaptain?.(team.id, player.id)}
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Make Captain
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => onRemovePlayer?.(team.id, player.id)}
                              className="text-destructive"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No players in this team yet</p>
                  {showActions && !isFull && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => onAddPlayer?.(team.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Player
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick Actions */}
        {showActions && !showPlayers && (
          <>
            <Separator />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit?.(team.id)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {!isFull && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onAddPlayer?.(team.id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              )}
            </div>
          </>
        )}

        {/* Team Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Created {formatJoinDate(team.created_at)}</span>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Ready for game</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamCard;
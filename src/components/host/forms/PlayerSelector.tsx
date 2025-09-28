import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Search,
  UserPlus,
  UserMinus,
  Mail,
  Crown,
  Users,
  Check,
  X,
  AlertCircle,
  Trash2,
  Upload,
  Download,
  Copy
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  playerAdditionSchema,
  bulkPlayerAdditionSchema,
  type PlayerAdditionForm,
  type BulkPlayerAdditionForm,
  TEAM_VALIDATION_CONSTANTS,
  validatePlayerCapacity
} from '@/lib/validations/team-schemas';

interface Player {
  id: string;
  name: string;
  email: string;
  joined_at?: string;
  is_captain?: boolean;
}

interface PlayerSelectorProps {
  teamId: string;
  currentPlayers: Player[];
  onPlayersChange: (players: Player[]) => void;
  maxPlayers?: number;
  disabled?: boolean;
  className?: string;
}

// Single player addition form
function PlayerAdditionForm({
  teamId,
  onSubmit,
  isLoading
}: {
  teamId: string;
  onSubmit: (data: PlayerAdditionForm) => Promise<void>;
  isLoading: boolean;
}) {
  const form = useForm<PlayerAdditionForm>({
    resolver: zodResolver(playerAdditionSchema),
    defaultValues: {
      team_id: teamId,
      name: '',
      email: '',
      is_captain: false,
    },
    mode: 'onChange',
  });

  const handleSubmit = async (data: PlayerAdditionForm) => {
    try {
      await onSubmit(data);
      form.reset({
        team_id: teamId,
        name: '',
        email: '',
        is_captain: false,
      });
    } catch (error) {
      console.error('Player addition error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Player Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter player name"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="player@example.com"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_captain"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span>Make this player team captain</span>
                </FormLabel>
                <FormDescription>
                  Captains can manage team settings and have special privileges during the game.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || !form.formState.isValid}
          className="w-full"
        >
          {isLoading ? 'Adding Player...' : 'Add Player'}
        </Button>
      </form>
    </Form>
  );
}

// Bulk player addition via CSV/text
function BulkPlayerForm({
  teamId,
  onSubmit,
  isLoading
}: {
  teamId: string;
  onSubmit: (data: BulkPlayerAdditionForm) => Promise<void>;
  isLoading: boolean;
}) {
  const [playerText, setPlayerText] = useState('');
  const [parsedPlayers, setParsedPlayers] = useState<any[]>([]);

  const parsePlayerText = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const players = lines.map((line, index) => {
      const parts = line.split(',').map(part => part.trim());
      const [name, email] = parts;

      return {
        name: name || `Player ${index + 1}`,
        email: email || '',
        is_captain: false,
      };
    }).filter(player => player.name && player.email);

    setParsedPlayers(players);
  };

  const handleSubmit = async () => {
    if (parsedPlayers.length === 0) return;

    try {
      await onSubmit({
        team_id: teamId,
        players: parsedPlayers,
        notify_players: true,
      });
      setPlayerText('');
      setParsedPlayers([]);
    } catch (error) {
      console.error('Bulk player addition error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Player List (Name, Email per line)
        </label>
        <textarea
          className="w-full h-32 p-3 border rounded-md resize-none font-mono text-sm"
          placeholder={`John Doe, john@example.com
Jane Smith, jane@example.com
Mike Johnson, mike@example.com`}
          value={playerText}
          onChange={(e) => {
            setPlayerText(e.target.value);
            parsePlayerText(e.target.value);
          }}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Format: Name, Email (one per line). Maximum {TEAM_VALIDATION_CONSTANTS.MAX_PLAYERS_PER_TEAM} players.
        </p>
      </div>

      {parsedPlayers.length > 0 && (
        <div className="border rounded-md p-3 bg-muted/50">
          <h4 className="font-medium mb-2">
            Parsed Players ({parsedPlayers.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {parsedPlayers.map((player, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{player.name}</span>
                <span className="text-muted-foreground">{player.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isLoading || parsedPlayers.length === 0}
        className="w-full"
      >
        {isLoading ? 'Adding Players...' : `Add ${parsedPlayers.length} Players`}
      </Button>
    </div>
  );
}

export function PlayerSelector({
  teamId,
  currentPlayers,
  onPlayersChange,
  maxPlayers = TEAM_VALIDATION_CONSTANTS.MAX_PLAYERS_PER_TEAM,
  disabled = false,
  className = ''
}: PlayerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  // Filter players based on search
  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return currentPlayers;

    const query = searchQuery.toLowerCase();
    return currentPlayers.filter(
      player =>
        player.name.toLowerCase().includes(query) ||
        player.email.toLowerCase().includes(query)
    );
  }, [currentPlayers, searchQuery]);

  const canAddPlayers = validatePlayerCapacity(currentPlayers.length, maxPlayers);
  const captainCount = currentPlayers.filter(p => p.is_captain).length;

  const handleAddPlayer = async (data: PlayerAdditionForm) => {
    setIsLoading(true);
    try {
      // Simulate API call
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        name: data.name,
        email: data.email,
        is_captain: data.is_captain,
        joined_at: new Date().toISOString(),
      };

      onPlayersChange([...currentPlayers, newPlayer]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAddPlayers = async (data: BulkPlayerAdditionForm) => {
    setIsLoading(true);
    try {
      const newPlayers: Player[] = data.players.map((player, index) => ({
        id: `player-${Date.now()}-${index}`,
        name: player.name,
        email: player.email,
        is_captain: player.is_captain,
        joined_at: new Date().toISOString(),
      }));

      onPlayersChange([...currentPlayers, ...newPlayers]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlayer = (player: Player) => {
    onPlayersChange(currentPlayers.filter(p => p.id !== player.id));
    setPlayerToRemove(null);
  };

  const handleToggleCaptain = (playerId: string) => {
    onPlayersChange(
      currentPlayers.map(player =>
        player.id === playerId
          ? { ...player, is_captain: !player.is_captain }
          : player
      )
    );
  };

  const handleBulkRemove = () => {
    onPlayersChange(
      currentPlayers.filter(player => !selectedPlayers.includes(player.id))
    );
    setSelectedPlayers([]);
  };

  const getPlayerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Players</span>
          </span>
          <Badge variant="outline">
            {currentPlayers.length}/{maxPlayers} players
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage players for this team. You can add players individually or in bulk.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Player Section */}
        {canAddPlayers && !disabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Add Players</h3>
              <div className="flex rounded-md border">
                <Button
                  variant={addMode === 'single' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAddMode('single')}
                  className="rounded-r-none"
                >
                  Single
                </Button>
                <Button
                  variant={addMode === 'bulk' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAddMode('bulk')}
                  className="rounded-l-none"
                >
                  Bulk
                </Button>
              </div>
            </div>

            {addMode === 'single' ? (
              <PlayerAdditionForm
                teamId={teamId}
                onSubmit={handleAddPlayer}
                isLoading={isLoading}
              />
            ) : (
              <BulkPlayerForm
                teamId={teamId}
                onSubmit={handleBulkAddPlayers}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {!canAddPlayers && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Team is at maximum capacity ({maxPlayers} players).
              Remove a player to add new ones.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Current Players Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Current Players ({currentPlayers.length})</h3>
            {currentPlayers.length > 0 && (
              <div className="flex items-center space-x-2">
                {selectedPlayers.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkRemove}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove ({selectedPlayers.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          {currentPlayers.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Players List */}
          {filteredPlayers.length > 0 ? (
            <div className="space-y-2">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedPlayers.includes(player.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPlayers([...selectedPlayers, player.id]);
                      } else {
                        setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                      }
                    }}
                    disabled={disabled}
                  />

                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {getPlayerInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate">{player.name}</span>
                      {player.is_captain && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{player.email}</span>
                    </div>
                  </div>

                  {!disabled && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <span className="sr-only">Player options</span>
                          ⋯
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleCaptain(player.id)}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          {player.is_captain ? 'Remove Captain' : 'Make Captain'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setPlayerToRemove(player)}
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
          ) : currentPlayers.length > 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No players found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No players in this team yet</p>
              <p className="text-sm">Add players using the form above</p>
            </div>
          )}
        </div>

        {/* Team Stats */}
        {currentPlayers.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Captains:</span>
                <span className="ml-1 font-medium">{captainCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Capacity:</span>
                <span className="ml-1 font-medium">
                  {currentPlayers.length}/{maxPlayers}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Remove Player Confirmation */}
      <AlertDialog
        open={!!playerToRemove}
        onOpenChange={() => setPlayerToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {playerToRemove?.name} from this team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playerToRemove && handleRemovePlayer(playerToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default PlayerSelector;
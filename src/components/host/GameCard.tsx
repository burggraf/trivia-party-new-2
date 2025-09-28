import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Calendar,
  Users,
  HelpCircle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  Eye
} from 'lucide-react';
import type { GameCardProps } from '@/contracts/host-components';

export function GameCard({
  game,
  onEdit,
  onArchive,
  onDelete,
  onViewDetails,
  showActions = true
}: GameCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'setup':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      setup: 'secondary',
      active: 'default',
      completed: 'outline'
    } as const;
    return variants[status as keyof typeof variants] || 'secondary';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(false);
    onDelete(game.id);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{game.title}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(game.scheduled_date)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusBadge(game.status)} className="flex items-center space-x-1">
                {getStatusIcon(game.status)}
                <span className="capitalize">{game.status}</span>
              </Badge>
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(game.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {game.status === 'setup' && (
                      <DropdownMenuItem onClick={() => onEdit(game.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Game
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onArchive(game.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Game
                    </DropdownMenuItem>
                    {game.status === 'setup' && (
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Game
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Game Statistics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{game.team_count} teams</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{game.player_count} players</span>
            </div>
          </div>

          {/* Questions Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Questions</span>
            <Badge variant={game.questions_configured ? 'default' : 'secondary'}>
              {game.questions_configured ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>

          {/* Completion Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={game.is_complete ? 'outline' : 'secondary'}>
              {game.is_complete ? 'Complete' : 'In Progress'}
            </Badge>
          </div>

          {/* Quick Actions */}
          {showActions && game.status === 'setup' && (
            <div className="flex space-x-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(game.id)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onViewDetails(game.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          )}

          {showActions && game.status === 'active' && (
            <div className="pt-2 border-t">
              <Button
                size="sm"
                className="w-full"
                onClick={() => onViewDetails(game.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Live Game
              </Button>
            </div>
          )}

          {showActions && game.status === 'completed' && (
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onViewDetails(game.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{game.title}"? This action cannot be undone.
              All associated teams, players, and questions will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default GameCard;
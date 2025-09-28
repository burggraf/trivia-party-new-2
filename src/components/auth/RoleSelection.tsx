import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Crown } from 'lucide-react';
import { authService } from '@/services/auth';
import type { UserRole } from '@/contracts/host-management';

interface RoleSelectionProps {
  userId: string;
  onRoleSelected?: (role: UserRole, redirectPath: string) => void;
}

export function RoleSelection({ userId, onRoleSelected }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.setUserRole({
        userId,
        preferredRole: selectedRole
      });

      if (response.success) {
        // Call the callback if provided
        onRoleSelected?.(selectedRole, response.redirectPath);

        // Navigate to the appropriate dashboard
        navigate(response.redirectPath);
      }
    } catch (error) {
      console.error('Role selection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to set role. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Role</CardTitle>
          <CardDescription>
            Select how you'd like to participate in trivia games
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                <RadioGroupItem value="host" id="host" />
                <Label htmlFor="host" className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Host</div>
                      <div className="text-sm text-muted-foreground">
                        Create and manage trivia games, customize questions, and manage teams
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                <RadioGroupItem value="player" id="player" />
                <Label htmlFor="player" className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Player</div>
                      <div className="text-sm text-muted-foreground">
                        Join teams, participate in games, and compete with friends
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedRole || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Role...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>You can change your role preference later in your profile settings.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RoleSelection;
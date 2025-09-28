import React, { memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, MapPinIcon, GamepadIcon, InfoIcon } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { gameBasicInfoSchema, type GameBasicInfoForm } from '@/lib/validations/game-schemas';

interface GameBasicInfoFormProps {
  onSubmit: (data: GameBasicInfoForm) => void | Promise<void>;
  initialData?: Partial<GameBasicInfoForm>;
  isLoading?: boolean;
  className?: string;
}

export const GameBasicInfoForm = memo(function GameBasicInfoForm({
  onSubmit,
  initialData = {},
  isLoading = false,
  className = ''
}: GameBasicInfoFormProps) {
  const form = useForm<GameBasicInfoForm>({
    resolver: zodResolver(gameBasicInfoSchema),
    defaultValues: {
      title: initialData.title || '',
      location: initialData.location || '',
      scheduled_date: initialData.scheduled_date || '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  const handleSubmit = useCallback(async (data: GameBasicInfoForm) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Handle any submission errors
      console.error('Form submission error:', error);
    }
  }, [onSubmit]);

  // Get the minimum date (today) for the date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GamepadIcon className="h-5 w-5" />
          <span>Game Information</span>
        </CardTitle>
        <CardDescription>
          Set up the basic details for your trivia game. This information will be visible to players when they join.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Game Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <GamepadIcon className="h-4 w-4" />
                    <span>Game Title *</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Friday Night Trivia Challenge"
                      {...field}
                      disabled={isLoading}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a catchy title that will attract players to your game.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span>Location</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Downtown Community Center, Online via Zoom"
                      {...field}
                      disabled={isLoading}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>
                    Where will the game take place? This can be a physical location or virtual platform.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduled Date */}
            <FormField
              control={form.control}
              name="scheduled_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Game Date *</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={isLoading}
                      min={today}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>
                    When will your trivia game take place? Players will see this in their local timezone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info Alert */}
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> You can always edit these details later from your game dashboard.
                Make sure the date and time work for most of your expected players.
              </AlertDescription>
            </Alert>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                className="flex-1 sm:flex-none sm:min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>

              {/* Form status */}
              <div className="flex items-center text-sm text-muted-foreground">
                {form.formState.isValid ? (
                  <span className="text-green-600">✓ Ready to continue</span>
                ) : (
                  <span>Please complete all required fields</span>
                )}
              </div>
            </div>

            {/* Character counts */}
            <div className="text-xs text-muted-foreground space-y-1">
              {form.watch('title') && (
                <div>
                  Title: {form.watch('title').length}/100 characters
                </div>
              )}
              {form.watch('location') && (
                <div>
                  Location: {form.watch('location').length}/200 characters
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});

export default GameBasicInfoForm;
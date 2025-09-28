import React, { useState, useEffect, memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users,
  Palette,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Lightbulb,
  Eye,
  EyeOff
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  teamCreationSchema,
  teamUpdateSchema,
  type TeamCreationForm,
  type TeamUpdateForm,
  TEAM_VALIDATION_CONSTANTS,
  createTeamNameValidator,
  createColorValidator,
  generateTeamNameSuggestions
} from '@/lib/validations/team-schemas';

interface Team {
  id: string;
  name: string;
  display_color: string;
}

interface TeamFormProps {
  onSubmit: (data: TeamCreationForm | TeamUpdateForm) => void | Promise<void>;
  initialData?: Partial<TeamCreationForm | TeamUpdateForm>;
  existingTeams?: Team[];
  gameId?: string;
  mode?: 'create' | 'edit';
  isLoading?: boolean;
  className?: string;
}

// Color picker with predefined team colors
const ColorPicker = memo(function ColorPicker({
  value,
  onChange,
  disabled = false,
  usedColors = []
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  usedColors?: string[];
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const handlePresetColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomColorSubmit = () => {
    onChange(customColor);
    setShowCustomInput(false);
  };

  return (
    <div className="space-y-3">
      {/* Color Preview */}
      <div className="flex items-center space-x-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-mono text-muted-foreground">{value}</span>
      </div>

      {/* Preset Colors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Preset Colors</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomInput(!showCustomInput)}
            disabled={disabled}
          >
            {showCustomInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showCustomInput ? 'Hide Custom' : 'Custom Color'}
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {TEAM_VALIDATION_CONSTANTS.TEAM_COLORS.map((color) => {
            const isUsed = usedColors.includes(color);
            const isSelected = value === color;

            return (
              <button
                key={color}
                type="button"
                className={`
                  relative w-10 h-10 rounded-full border-2 transition-all
                  ${isSelected
                    ? 'border-primary ring-2 ring-primary/20 scale-110'
                    : 'border-white hover:border-primary/50 hover:scale-105'
                  }
                  ${isUsed && !isSelected
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{ backgroundColor: color }}
                onClick={() => !isUsed && !disabled && handlePresetColorSelect(color)}
                disabled={disabled || (isUsed && !isSelected)}
                title={isUsed ? 'Color already in use' : `Select ${color}`}
                aria-label={`${isSelected ? 'Selected color' : 'Select color'} ${color}${isUsed && !isSelected ? ' (already in use)' : ''}`}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <CheckCircle className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm" />
                )}
                {isUsed && !isSelected && (
                  <div className="absolute inset-0 m-auto w-6 h-0.5 bg-red-500 rotate-45" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Input */}
      {showCustomInput && (
        <div className="border rounded-lg p-3 bg-muted/50">
          <label className="text-sm font-medium mb-2 block">Custom Hex Color</label>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="#3B82F6"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              disabled={disabled}
              className="font-mono"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCustomColorSubmit}
              disabled={disabled || customColor === value}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export const TeamForm = memo(function TeamForm({
  onSubmit,
  initialData = {},
  existingTeams = [],
  gameId,
  mode = 'create',
  isLoading = false,
  className = ''
}: TeamFormProps) {
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isEditMode = mode === 'edit';
  const schema = isEditMode ? teamUpdateSchema : teamCreationSchema;

  // Get used team names and colors (excluding current team in edit mode)
  const currentTeamId = isEditMode ? (initialData as any)?.team_id : null;
  const otherTeams = existingTeams.filter(team => team.id !== currentTeamId);
  const usedNames = otherTeams.map(team => team.name);
  const usedColors = otherTeams.map(team => team.display_color);

  const form = useForm<TeamCreationForm | TeamUpdateForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...initialData,
      game_id: gameId || initialData.game_id || '',
      display_color: initialData.display_color || TEAM_VALIDATION_CONSTANTS.TEAM_COLORS[0],
    },
    mode: 'onChange',
  });

  const teamNameValidator = createTeamNameValidator(usedNames);
  const colorValidator = createColorValidator(usedColors);

  // Watch team name for suggestions
  const watchedName = form.watch('name');

  useEffect(() => {
    if (watchedName && watchedName.length >= 2) {
      const suggestions = generateTeamNameSuggestions(watchedName, usedNames);
      setNameSuggestions(suggestions);
    } else {
      setNameSuggestions([]);
    }
  }, [watchedName, usedNames]);

  const handleSubmit = useCallback(async (data: TeamCreationForm | TeamUpdateForm) => {
    // Additional validation
    if (!teamNameValidator(data.name)) {
      form.setError('name', { message: 'This team name is already taken' });
      return;
    }

    if (!colorValidator(data.display_color)) {
      form.setError('display_color', { message: 'This color is already in use' });
      return;
    }

    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Team form submission error:', error);
    }
  }, [teamNameValidator, colorValidator, form, onSubmit]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    form.setValue('name', suggestion);
    setShowSuggestions(false);
  }, [form]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>{isEditMode ? 'Edit Team' : 'Create New Team'}</span>
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Update your team details. Players will see these changes immediately.'
            : 'Set up a new team for your game. Choose a unique name and color that players will recognize.'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Team Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Team Name *</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        placeholder="e.g., The Quiz Masters, Brain Busters"
                        {...field}
                        disabled={isLoading}
                        className="text-base"
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => {
                          // Delay hiding suggestions to allow clicks
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                      />

                      {/* Name Suggestions */}
                      {showSuggestions && nameSuggestions.length > 0 && (
                        <div className="border rounded-md bg-popover p-2 shadow-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Suggestions:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {nameSuggestions.map((suggestion) => (
                              <Button
                                key={suggestion}
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                onClick={() => handleSuggestionSelect(suggestion)}
                                aria-label={`Use suggestion: ${suggestion}`}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a unique name that represents your team. Must be 2-50 characters.
                  </FormDescription>
                  <FormMessage />

                  {/* Name validation status */}
                  {watchedName && (
                    <div className="flex items-center space-x-2 text-sm" role="status" aria-live="polite">
                      {teamNameValidator(watchedName) ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
                          <span>Name available</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>Name already taken</span>
                        </div>
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <Separator />

            {/* Team Color */}
            <FormField
              control={form.control}
              name="display_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span>Team Color *</span>
                  </FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                      usedColors={usedColors}
                    />
                  </FormControl>
                  <FormDescription>
                    Select a color that will represent your team throughout the game.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Summary */}
            {form.watch('name') && (
              <>
                <Separator />
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Team Preview</h4>
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: form.watch('display_color') }}
                    />
                    <span className="font-medium">{form.watch('name')}</span>
                    <Badge variant="outline">Team</Badge>
                  </div>
                </div>
              </>
            )}

            {/* Existing Teams Info */}
            {existingTeams.length > 0 && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <span className="font-medium">
                      Existing teams ({existingTeams.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {existingTeams.slice(0, 6).map((team) => (
                        <div key={team.id} className="flex items-center space-x-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.display_color }}
                          />
                          <span className="text-sm">{team.name}</span>
                        </div>
                      ))}
                      {existingTeams.length > 6 && (
                        <span className="text-sm text-muted-foreground">
                          +{existingTeams.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                className="flex-1 sm:flex-none sm:min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                  </div>
                ) : (
                  <span>{isEditMode ? 'Update Team' : 'Create Team'}</span>
                )}
              </Button>

              <div className="flex items-center text-sm text-muted-foreground">
                {form.formState.isValid ? (
                  <span className="text-green-600">✓ Ready to {isEditMode ? 'update' : 'create'}</span>
                ) : (
                  <span>Please complete all required fields</span>
                )}
              </div>
            </div>

            {/* Character count */}
            {form.watch('name') && (
              <div className="text-xs text-muted-foreground">
                Team name: {form.watch('name').length}/50 characters
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});

export default TeamForm;
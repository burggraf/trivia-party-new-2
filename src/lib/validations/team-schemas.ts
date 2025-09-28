import { z } from 'zod';

// === Basic validation patterns ===

const requiredString = (fieldName: string) =>
  z.string()
    .min(1, `${fieldName} is required`)
    .trim();

const optionalString = z.string().trim().optional();

const emailValidation = z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .trim()
  .toLowerCase();

// === Color validation ===

const hexColorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const colorValidation = z.string()
  .regex(hexColorPattern, 'Please enter a valid hex color (e.g., #FF5733)')
  .default('#3B82F6'); // Default blue color

// === Predefined team colors ===

const TEAM_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
] as const;

// === Team Creation Schema ===

export const teamCreationSchema = z.object({
  name: requiredString('Team name')
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must not exceed 50 characters')
    .refine((name) => {
      // Prevent inappropriate team names
      const inappropriate = ['admin', 'host', 'moderator', 'system'];
      return !inappropriate.some(word => name.toLowerCase().includes(word));
    }, 'Team name contains restricted words'),

  display_color: colorValidation,

  game_id: requiredString('Game ID'),
});

export type TeamCreationForm = z.infer<typeof teamCreationSchema>;

// === Team Update Schema ===

export const teamUpdateSchema = z.object({
  team_id: requiredString('Team ID'),

  name: requiredString('Team name')
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must not exceed 50 characters'),

  display_color: colorValidation,

  max_players: z.number()
    .int('Maximum players must be a whole number')
    .min(1, 'Team must allow at least 1 player')
    .max(8, 'Maximum 8 players per team allowed')
    .optional(),
});

export type TeamUpdateForm = z.infer<typeof teamUpdateSchema>;

// === Player Addition Schema ===

export const playerAdditionSchema = z.object({
  team_id: requiredString('Team ID'),

  name: requiredString('Player name')
    .min(2, 'Player name must be at least 2 characters')
    .max(100, 'Player name must not exceed 100 characters'),

  email: emailValidation,

  is_captain: z.boolean()
    .default(false),
});

export type PlayerAdditionForm = z.infer<typeof playerAdditionSchema>;

// === Bulk Player Addition Schema ===

export const bulkPlayerAdditionSchema = z.object({
  team_id: requiredString('Team ID'),

  players: z.array(z.object({
    name: requiredString('Player name')
      .min(2, 'Player name must be at least 2 characters')
      .max(100, 'Player name must not exceed 100 characters'),

    email: emailValidation,

    is_captain: z.boolean().default(false),
  }))
    .min(1, 'At least one player must be added')
    .max(8, 'Cannot add more than 8 players at once')
    .refine((players) => {
      // Check for duplicate emails within the batch
      const emails = players.map(p => p.email.toLowerCase());
      return new Set(emails).size === emails.length;
    }, 'Duplicate emails are not allowed'),

  notify_players: z.boolean()
    .default(true),
});

export type BulkPlayerAdditionForm = z.infer<typeof bulkPlayerAdditionSchema>;

// === Team Settings Schema ===

export const teamSettingsSchema = z.object({
  team_id: requiredString('Team ID'),

  allow_self_registration: z.boolean()
    .default(true),

  max_players: z.number()
    .int('Maximum players must be a whole number')
    .min(1, 'Team must allow at least 1 player')
    .max(8, 'Maximum 8 players per team allowed'),

  require_captain_approval: z.boolean()
    .default(false),

  auto_assign_captain: z.boolean()
    .default(true),
});

export type TeamSettingsForm = z.infer<typeof teamSettingsSchema>;

// === Team Registration Schema (for players joining) ===

export const teamRegistrationSchema = z.object({
  team_id: requiredString('Team ID'),

  player_name: requiredString('Your name')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),

  player_email: emailValidation,

  join_code: optionalString
    .refine((code) => !code || code.length === 6, 'Join code must be 6 characters'),

  accept_terms: z.boolean()
    .refine(val => val === true, 'You must accept the terms to join'),
});

export type TeamRegistrationForm = z.infer<typeof teamRegistrationSchema>;

// === Team Search Schema ===

export const teamSearchSchema = z.object({
  game_id: requiredString('Game ID'),

  query: z.string()
    .min(2, 'Search must be at least 2 characters')
    .max(50, 'Search cannot exceed 50 characters')
    .optional(),

  status: z.enum(['all', 'open', 'full', 'closed'])
    .default('all'),

  sortBy: z.enum(['name', 'created', 'players', 'status'])
    .default('name'),

  sortOrder: z.enum(['asc', 'desc'])
    .default('asc'),
});

export type TeamSearchForm = z.infer<typeof teamSearchSchema>;

// === Team Statistics Schema ===

export const teamStatisticsSchema = z.object({
  team_id: requiredString('Team ID'),

  include_individual_stats: z.boolean()
    .default(false),

  date_range: z.object({
    start: z.string().min(1, 'Start date is required'),
    end: z.string().min(1, 'End date is required'),
  }).refine((range) => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    return start <= end;
  }, {
    message: 'Start date must be before or equal to end date',
    path: ['end'],
  }).optional(),
});

export type TeamStatisticsForm = z.infer<typeof teamStatisticsSchema>;

// === Export utilities ===

export const TEAM_VALIDATION_CONSTANTS = {
  TEAM_COLORS,
  MAX_TEAM_NAME_LENGTH: 50,
  MAX_PLAYER_NAME_LENGTH: 100,
  MAX_PLAYERS_PER_TEAM: 8,
  MIN_SEARCH_LENGTH: 2,
  JOIN_CODE_LENGTH: 6,
} as const;

// Helper function to validate team name uniqueness
export const createTeamNameValidator = (existingTeamNames: string[]) => {
  return (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    const existingNormalized = existingTeamNames.map(n => n.toLowerCase().trim());
    return !existingNormalized.includes(normalizedName);
  };
};

// Helper function to validate color uniqueness
export const createColorValidator = (existingColors: string[]) => {
  return (color: string) => {
    return !existingColors.includes(color.toLowerCase());
  };
};

// Helper function to validate player capacity
export const validatePlayerCapacity = (
  currentPlayerCount: number,
  maxPlayers: number,
  playersToAdd: number = 1
): boolean => {
  return currentPlayerCount + playersToAdd <= maxPlayers;
};

// Helper function to validate captain assignment
export const validateCaptainAssignment = (
  players: { is_captain: boolean }[],
  newCaptainId?: string
): boolean => {
  const captainCount = players.filter(p => p.is_captain).length;

  // If assigning a new captain, ensure only one captain exists
  if (newCaptainId) {
    return captainCount <= 1;
  }

  // Otherwise, ensure at least one captain exists if there are players
  return players.length === 0 || captainCount >= 1;
};

// Helper function to format team validation errors
export const formatTeamValidationErrors = (error: z.ZodError) => {
  return error.errors.reduce((acc, err) => {
    const path = err.path.join('.');
    acc[path] = err.message;
    return acc;
  }, {} as Record<string, string>);
};

// Helper function to generate suggested team names
export const generateTeamNameSuggestions = (baseName: string, existingNames: string[]): string[] => {
  const suggestions: string[] = [];
  const normalizedExisting = existingNames.map(n => n.toLowerCase().trim());

  // Try variations with numbers
  for (let i = 1; i <= 10; i++) {
    const suggestion = `${baseName} ${i}`;
    if (!normalizedExisting.includes(suggestion.toLowerCase())) {
      suggestions.push(suggestion);
    }
  }

  // Try variations with suffixes
  const suffixes = ['Squad', 'Team', 'Crew', 'Force', 'Alliance', 'United'];
  for (const suffix of suffixes) {
    const suggestion = `${baseName} ${suffix}`;
    if (!normalizedExisting.includes(suggestion.toLowerCase())) {
      suggestions.push(suggestion);
    }
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
};
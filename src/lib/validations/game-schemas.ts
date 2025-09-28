import { z } from 'zod';

// === Basic validation patterns ===

const requiredString = (fieldName: string) =>
  z.string()
    .min(1, `${fieldName} is required`)
    .trim();

const optionalString = z.string().trim().optional();

const positiveInteger = (fieldName: string, min: number = 1) =>
  z.number()
    .int(`${fieldName} must be a whole number`)
    .min(min, `${fieldName} must be at least ${min}`);

const dateString = z.string()
  .min(1, 'Date is required')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed > new Date();
  }, 'Date must be valid and in the future');

// === Category validation ===

const AVAILABLE_CATEGORIES = [
  'science',
  'history',
  'sports',
  'entertainment',
  'geography',
  'literature',
  'arts',
  'technology',
  'nature',
  'politics'
] as const;

const categoriesArray = z.array(z.enum(AVAILABLE_CATEGORIES))
  .min(1, 'At least one category must be selected')
  .max(6, 'Maximum 6 categories can be selected');

// === Game Basic Info Schema ===

export const gameBasicInfoSchema = z.object({
  title: requiredString('Game title')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),

  location: optionalString
    .refine((val) => !val || val.length <= 200, 'Location must not exceed 200 characters'),

  scheduled_date: dateString,
});

export type GameBasicInfoForm = z.infer<typeof gameBasicInfoSchema>;

// === Game Configuration Schema ===

export const gameConfigurationSchema = gameBasicInfoSchema.extend({
  total_rounds: positiveInteger('Number of rounds')
    .max(10, 'Maximum 10 rounds allowed'),

  questions_per_round: positiveInteger('Questions per round')
    .max(20, 'Maximum 20 questions per round allowed'),

  selected_categories: categoriesArray,

  max_teams: positiveInteger('Maximum teams', 2)
    .max(12, 'Maximum 12 teams allowed'),

  max_players_per_team: positiveInteger('Maximum players per team')
    .max(8, 'Maximum 8 players per team allowed'),

  min_players_per_team: positiveInteger('Minimum players per team')
    .max(4, 'Minimum players per team cannot exceed 4'),

  self_registration_enabled: z.boolean()
    .default(true),
}).refine((data) => {
  return data.min_players_per_team <= data.max_players_per_team;
}, {
  message: 'Minimum players per team must not exceed maximum players per team',
  path: ['min_players_per_team'],
});

export type GameConfigurationForm = z.infer<typeof gameConfigurationSchema>;

// === Round Configuration Schema ===

export const roundConfigurationSchema = z.object({
  round_number: positiveInteger('Round number'),

  custom_categories: z.array(z.enum(AVAILABLE_CATEGORIES))
    .optional()
    .refine((cats) => !cats || cats.length <= 6, 'Maximum 6 categories per round'),

  questions_per_round: positiveInteger('Questions for this round')
    .max(20, 'Maximum 20 questions per round')
    .optional(),
});

export type RoundConfigurationForm = z.infer<typeof roundConfigurationSchema>;

// === Game Filters Schema ===

export const gameFiltersSchema = z.object({
  status: z.array(z.enum(['setup', 'active', 'completed', 'cancelled']))
    .optional(),

  archived: z.boolean().optional(),

  dateRange: z.object({
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

  search: optionalString
    .refine((val) => !val || val.length >= 2, 'Search must be at least 2 characters'),
});

export type GameFiltersForm = z.infer<typeof gameFiltersSchema>;

// === Question Generation Schema ===

export const questionGenerationSchema = z.object({
  gameId: requiredString('Game ID'),

  categories: categoriesArray,

  questionsPerCategory: positiveInteger('Questions per category')
    .max(50, 'Maximum 50 questions per category'),

  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed'])
    .default('mixed'),

  excludeUsedQuestions: z.boolean()
    .default(true),
});

export type QuestionGenerationForm = z.infer<typeof questionGenerationSchema>;

// === Game Search Schema ===

export const gameSearchSchema = z.object({
  query: requiredString('Search query')
    .min(2, 'Search must be at least 2 characters')
    .max(100, 'Search cannot exceed 100 characters'),

  categories: z.array(z.enum(AVAILABLE_CATEGORIES))
    .optional(),

  status: z.array(z.enum(['setup', 'active', 'completed', 'cancelled']))
    .optional(),

  sortBy: z.enum(['date', 'title', 'status', 'teams'])
    .default('date'),

  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
});

export type GameSearchForm = z.infer<typeof gameSearchSchema>;

// === Export utilities ===

export const GAME_VALIDATION_CONSTANTS = {
  AVAILABLE_CATEGORIES,
  MAX_TITLE_LENGTH: 100,
  MAX_LOCATION_LENGTH: 200,
  MAX_ROUNDS: 10,
  MAX_QUESTIONS_PER_ROUND: 20,
  MAX_TEAMS: 12,
  MAX_PLAYERS_PER_TEAM: 8,
  MIN_SEARCH_LENGTH: 2,
} as const;

// Helper function to validate category selection
export const validateCategorySelection = (categories: string[]): boolean => {
  return categories.length > 0 &&
         categories.length <= 6 &&
         categories.every(cat => AVAILABLE_CATEGORIES.includes(cat as any));
};

// Helper function to format validation errors
export const formatValidationErrors = (error: z.ZodError) => {
  return error.errors.reduce((acc, err) => {
    const path = err.path.join('.');
    acc[path] = err.message;
    return acc;
  }, {} as Record<string, string>);
};
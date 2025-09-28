// Host-Specific Error Types
// Custom error classes and interfaces for host management functionality

// === Base Error Interface ===

export interface HostManagementError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// === Custom Error Classes ===

export class InsufficientQuestionsError extends Error {
  public readonly code = 'INSUFFICIENT_QUESTIONS';

  constructor(
    public category: string,
    public needed: number,
    public available: number,
    public duplicates: number
  ) {
    super(`Insufficient questions in category ${category}: need ${needed}, have ${available} unique (${duplicates} duplicates available)`);
    this.name = 'InsufficientQuestionsError';
  }
}

export class GameNotEditableError extends Error {
  public readonly code = 'GAME_NOT_EDITABLE';

  constructor(public gameStatus: string) {
    super(`Game cannot be edited in ${gameStatus} status`);
    this.name = 'GameNotEditableError';
  }
}

export class InvalidTeamConfigurationError extends Error {
  public readonly code = 'INVALID_TEAM_CONFIGURATION';

  constructor(public validationErrors: string[]) {
    super(`Invalid team configuration: ${validationErrors.join(', ')}`);
    this.name = 'InvalidTeamConfigurationError';
  }
}

export class UnauthorizedHostOperationError extends Error {
  public readonly code = 'UNAUTHORIZED_HOST_OPERATION';

  constructor(public operation: string, public resourceId: string) {
    super(`Unauthorized to perform ${operation} on resource ${resourceId}`);
    this.name = 'UnauthorizedHostOperationError';
  }
}

export class QuestionGenerationError extends Error {
  public readonly code = 'QUESTION_GENERATION_ERROR';

  constructor(
    message: string,
    public gameId: string,
    public round?: number,
    public category?: string
  ) {
    super(message);
    this.name = 'QuestionGenerationError';
  }
}

export class TeamCapacityExceededError extends Error {
  public readonly code = 'TEAM_CAPACITY_EXCEEDED';

  constructor(
    public currentTeams: number,
    public maxTeams: number
  ) {
    super(`Cannot create team: ${currentTeams} teams already exist (maximum: ${maxTeams})`);
    this.name = 'TeamCapacityExceededError';
  }
}

export class PlayerAlreadyAssignedError extends Error {
  public readonly code = 'PLAYER_ALREADY_ASSIGNED';

  constructor(
    public playerId: string,
    public existingTeamId: string
  ) {
    super(`Player ${playerId} is already assigned to team ${existingTeamId}`);
    this.name = 'PlayerAlreadyAssignedError';
  }
}

export class GameConfigurationValidationError extends Error {
  public readonly code = 'GAME_CONFIGURATION_VALIDATION';

  constructor(public validationErrors: Record<string, string[]>) {
    const errorSummary = Object.entries(validationErrors)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ');
    super(`Game configuration validation failed: ${errorSummary}`);
    this.name = 'GameConfigurationValidationError';
  }
}

// === Error Type Unions ===

export type HostGameError =
  | InsufficientQuestionsError
  | GameNotEditableError
  | InvalidTeamConfigurationError
  | UnauthorizedHostOperationError
  | QuestionGenerationError
  | TeamCapacityExceededError
  | PlayerAlreadyAssignedError
  | GameConfigurationValidationError;

// === Error Response Types ===

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId?: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      field: string;
      errors: string[];
    }[];
  };
}

export interface ServiceErrorResponse extends ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: {
      service: string;
      operation: string;
      originalError?: string;
    };
  };
}

// === Error Utilities ===

export function isHostManagementError(error: any): error is HostGameError {
  return error instanceof Error &&
    [
      'InsufficientQuestionsError',
      'GameNotEditableError',
      'InvalidTeamConfigurationError',
      'UnauthorizedHostOperationError',
      'QuestionGenerationError',
      'TeamCapacityExceededError',
      'PlayerAlreadyAssignedError',
      'GameConfigurationValidationError'
    ].includes(error.name);
}

export function toErrorResponse(error: HostGameError): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: extractErrorDetails(error)
    },
    timestamp: new Date().toISOString()
  };
}

function extractErrorDetails(error: HostGameError): Record<string, any> {
  switch (error.name) {
    case 'InsufficientQuestionsError':
      return {
        category: (error as InsufficientQuestionsError).category,
        needed: (error as InsufficientQuestionsError).needed,
        available: (error as InsufficientQuestionsError).available,
        duplicates: (error as InsufficientQuestionsError).duplicates
      };

    case 'GameNotEditableError':
      return {
        gameStatus: (error as GameNotEditableError).gameStatus
      };

    case 'InvalidTeamConfigurationError':
      return {
        validationErrors: (error as InvalidTeamConfigurationError).validationErrors
      };

    case 'UnauthorizedHostOperationError':
      return {
        operation: (error as UnauthorizedHostOperationError).operation,
        resourceId: (error as UnauthorizedHostOperationError).resourceId
      };

    case 'QuestionGenerationError':
      return {
        gameId: (error as QuestionGenerationError).gameId,
        round: (error as QuestionGenerationError).round,
        category: (error as QuestionGenerationError).category
      };

    case 'TeamCapacityExceededError':
      return {
        currentTeams: (error as TeamCapacityExceededError).currentTeams,
        maxTeams: (error as TeamCapacityExceededError).maxTeams
      };

    case 'PlayerAlreadyAssignedError':
      return {
        playerId: (error as PlayerAlreadyAssignedError).playerId,
        existingTeamId: (error as PlayerAlreadyAssignedError).existingTeamId
      };

    case 'GameConfigurationValidationError':
      return {
        validationErrors: (error as GameConfigurationValidationError).validationErrors
      };

    default:
      return {};
  }
}

// === Error Constants ===

export const HOST_ERROR_CODES = {
  INSUFFICIENT_QUESTIONS: 'INSUFFICIENT_QUESTIONS',
  GAME_NOT_EDITABLE: 'GAME_NOT_EDITABLE',
  INVALID_TEAM_CONFIGURATION: 'INVALID_TEAM_CONFIGURATION',
  UNAUTHORIZED_HOST_OPERATION: 'UNAUTHORIZED_HOST_OPERATION',
  QUESTION_GENERATION_ERROR: 'QUESTION_GENERATION_ERROR',
  TEAM_CAPACITY_EXCEEDED: 'TEAM_CAPACITY_EXCEEDED',
  PLAYER_ALREADY_ASSIGNED: 'PLAYER_ALREADY_ASSIGNED',
  GAME_CONFIGURATION_VALIDATION: 'GAME_CONFIGURATION_VALIDATION'
} as const;
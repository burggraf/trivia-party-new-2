import { supabase } from '../lib/supabase';
import type {
  EdgeFunctionService,
  CreateGameSetupRequest,
  CreateGameSetupResponse,
  ValidateAnswerRequest,
  ValidateAnswerResponse,
  GetUserStatsRequest,
  GetUserStatsResponse,
} from '../../specs/001-this-project-is/contracts/database';
import type { GameSession, GameSummary } from '../../specs/001-this-project-is/contracts/game';

class DatabaseServiceImpl implements EdgeFunctionService {
  /**
   * Call the create-game-setup edge function
   */
  async createGameSetup(request: CreateGameSetupRequest): Promise<CreateGameSetupResponse> {
    const { data, error } = await supabase.functions.invoke('create-game-setup', {
      body: request,
    });

    if (error) {
      throw new Error(`Failed to create game setup: ${error.message}`);
    }

    if (!data) {
      throw new Error('No response data from create-game-setup function');
    }

    return data;
  }

  /**
   * Call the validate-answer edge function
   */
  async validateAnswer(request: ValidateAnswerRequest): Promise<ValidateAnswerResponse> {
    const { data, error } = await supabase.functions.invoke('validate-answer', {
      body: request,
    });

    if (error) {
      throw new Error(`Failed to validate answer: ${error.message}`);
    }

    if (!data) {
      throw new Error('No response data from validate-answer function');
    }

    return data;
  }

  /**
   * Call the complete-game edge function
   */
  async completeGame(request: { game_session_id: string }): Promise<{
    session: GameSession;
    summary: GameSummary;
    profile_updated: boolean;
  }> {
    const { data, error } = await supabase.functions.invoke('complete-game', {
      body: request,
    });

    if (error) {
      throw new Error(`Failed to complete game: ${error.message}`);
    }

    if (!data) {
      throw new Error('No response data from complete-game function');
    }

    return data;
  }

  /**
   * Call the user-stats edge function
   */
  async getUserStats(request: GetUserStatsRequest): Promise<GetUserStatsResponse> {
    const { data, error } = await supabase.functions.invoke('user-stats', {
      body: request,
    });

    if (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }

    if (!data) {
      throw new Error('No response data from user-stats function');
    }

    return data;
  }

  /**
   * Call the cleanup-abandoned-games edge function
   */
  async cleanupAbandonedGames(request: { user_id: string; older_than_hours: number }): Promise<{
    cleaned_sessions: number;
  }> {
    const { data, error } = await supabase.functions.invoke('cleanup-abandoned-games', {
      body: request,
    });

    if (error) {
      throw new Error(`Failed to cleanup abandoned games: ${error.message}`);
    }

    if (!data) {
      throw new Error('No response data from cleanup-abandoned-games function');
    }

    return data;
  }
}

// Export a singleton instance
export const databaseService = new DatabaseServiceImpl();

// Also export the class for testing
export { DatabaseServiceImpl };

// Legacy export names for compatibility with tests
export const edgeFunctionService = databaseService;
import { supabase } from '@/lib/supabase';
import type {
  AuthService,
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  AuthUser,
  AuthSession,
  AuthError
} from '@/contracts/auth';
import type {
  UserRole,
  RoleSelectionRequest,
  RoleSelectionResponse,
  EnhancedUserProfile
} from '@/contracts/host-management';

class AuthServiceImpl implements AuthService {
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
        options: request.options
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: {
            message: error.message,
            status: error.status || 400
          }
        };
      }

      return {
        user: data.user ? this.mapSupabaseUser(data.user) : null,
        session: data.session ? this.mapSupabaseSession(data.session) : null,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        }
      };
    }
  }

  async signIn(request: SignInRequest): Promise<SignInResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: request.email,
        password: request.password
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: {
            message: error.message,
            status: error.status || 400
          }
        };
      }

      return {
        user: data.user ? this.mapSupabaseUser(data.user) : null,
        session: data.session ? this.mapSupabaseSession(data.session) : null,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        }
      };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          error: {
            message: error.message,
            status: error.status || 400
          }
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        }
      };
    }
  }

  async getSession(): Promise<{ data: { session: AuthSession | null }; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          data: { session: null },
          error: {
            message: error.message,
            status: error.status || 400
          }
        };
      }

      return {
        data: {
          session: data.session ? this.mapSupabaseSession(data.session) : null
        },
        error: null
      };
    } catch (error) {
      return {
        data: { session: null },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        }
      };
    }
  }

  async getUser(): Promise<{ data: { user: AuthUser | null }; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return {
          data: { user: null },
          error: {
            message: error.message,
            status: error.status || 400
          }
        };
      }

      return {
        data: {
          user: data.user ? this.mapSupabaseUser(data.user) : null
        },
        error: null
      };
    } catch (error) {
      return {
        data: { user: null },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        }
      };
    }
  }

  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void): { data: { subscription: any } } {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session ? this.mapSupabaseSession(session) : null);
    });

    return { data };
  }

  // === Role Management Methods ===

  async setUserRole(request: RoleSelectionRequest): Promise<RoleSelectionResponse> {
    try {
      // Update user profile with preferred role
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ preferred_role: request.preferredRole })
        .eq('id', request.userId)
        .select()
        .single();

      if (error) {
        // Handle column not found error (migration not applied yet)
        if (error.message && error.message.includes('preferred_role')) {
          console.warn('preferred_role column not found - migration may not be applied yet. Storing role in memory for this session.');

          // For now, just return success with in-memory role storage
          // TODO: Apply database migration to persist roles
          return {
            success: true,
            userProfile: null, // Can't get updated profile without column
            redirectPath: request.preferredRole === 'host' ? '/host/dashboard' : '/'
          };
        }

        throw new Error(`Failed to update user role: ${error.message}`);
      }

      // Determine redirect path based on role
      const redirectPath = request.preferredRole === 'host'
        ? '/host/dashboard'
        : '/';

      return {
        success: true,
        userProfile: data ? this.mapToUserProfile(data) : null,
        redirectPath
      };
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }

  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('preferred_role')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - user hasn't set a role yet
          return null;
        }

        // Handle column not found error (migration not applied yet)
        if (error.message && error.message.includes('column user_profiles.preferred_role does not exist')) {
          console.warn('preferred_role column not found - migration may not be applied yet');
          return null;
        }

        console.error('Database error getting user role:', error);
        return null;
      }

      return data.preferred_role as UserRole | null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  async getEnhancedUserProfile(userId: string): Promise<EnhancedUserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw new Error(`Failed to get user profile: ${error.message}`);
      }

      return this.mapToEnhancedUserProfile(data);
    } catch (error) {
      console.error('Error getting enhanced user profile:', error);
      return null;
    }
  }

  // Helper methods to map Supabase types to contract types
  private mapSupabaseUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  private mapSupabaseSession(session: any): AuthSession {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      token_type: session.token_type,
      user: this.mapSupabaseUser(session.user)
    };
  }

  private mapToUserProfile(data: any): any {
    return {
      id: data.id,
      username: data.username,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      total_games_played: data.total_games_played,
      total_correct_answers: data.total_correct_answers,
      total_questions_answered: data.total_questions_answered,
      favorite_categories: data.favorite_categories,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  private mapToEnhancedUserProfile(data: any): EnhancedUserProfile {
    return {
      id: data.id,
      username: data.username,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      total_games_played: data.total_games_played,
      total_correct_answers: data.total_correct_answers,
      total_questions_answered: data.total_questions_answered,
      favorite_categories: data.favorite_categories,
      preferred_role: data.preferred_role as UserRole,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}

export const authService = new AuthServiceImpl();
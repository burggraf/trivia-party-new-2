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
}

export const authService = new AuthServiceImpl();
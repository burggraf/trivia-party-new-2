import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/auth';
import type { AuthUser, AuthSession } from '@/contracts/auth';

// Auth State Types
interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
}

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: { user: AuthUser | null; session: AuthSession | null } }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Auth Context Interface
interface AuthContextType {
  state: AuthState;
  signUp: (email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SESSION':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        loading: false,
      };
    case 'CLEAR_SESSION':
      return {
        ...state,
        user: null,
        session: null,
        loading: false,
      };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data, error } = await authService.getSession();

        if (mounted) {
          if (error) {
            console.error('Error getting session:', error);
            dispatch({ type: 'CLEAR_SESSION' });
          } else {
            dispatch({
              type: 'SET_SESSION',
              payload: {
                user: data.session?.user || null,
                session: data.session
              }
            });
          }
          dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          dispatch({ type: 'CLEAR_SESSION' });
          dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data } = authService.onAuthStateChange((event, session) => {
      if (mounted) {
        if (event === 'SIGNED_OUT' || !session) {
          dispatch({ type: 'CLEAR_SESSION' });
        } else {
          dispatch({
            type: 'SET_SESSION',
            payload: {
              user: session.user,
              session: session
            }
          });
        }
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      if (data.subscription?.unsubscribe) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, username?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (response.error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: response.error.message };
      }

      // Session will be updated via onAuthStateChange
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      };
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.signIn({ email, password });

      if (response.error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: response.error.message };
      }

      // Session will be updated via onAuthStateChange
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.signOut();

      if (response.error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: response.error.message };
      }

      // Session will be cleared via onAuthStateChange
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  };

  // Refresh session function
  const refreshSession = async () => {
    try {
      const { data, error } = await authService.getSession();

      if (error) {
        console.error('Error refreshing session:', error);
        dispatch({ type: 'CLEAR_SESSION' });
      } else {
        dispatch({
          type: 'SET_SESSION',
          payload: {
            user: data.session?.user || null,
            session: data.session
          }
        });
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      dispatch({ type: 'CLEAR_SESSION' });
    }
  };

  const contextValue: AuthContextType = {
    state,
    signUp,
    signIn,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
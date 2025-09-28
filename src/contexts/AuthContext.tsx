import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/auth';
import type { AuthUser, AuthSession } from '@/contracts/auth';
import type { UserRole, EnhancedUserProfile, RoleSelectionRequest, RoleSelectionResponse } from '@/contracts/host-management';

// Auth State Types
interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  userRole: UserRole | null;
  userProfile: EnhancedUserProfile | null;
  loading: boolean;
  initialized: boolean;
}

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: { user: AuthUser | null; session: AuthSession | null } }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_USER_ROLE'; payload: UserRole | null }
  | { type: 'SET_USER_PROFILE'; payload: EnhancedUserProfile | null };

// Auth Context Interface
interface AuthContextType {
  state: AuthState;
  signUp: (email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;

  // Role management
  getUserRole: (userId: string) => Promise<UserRole | null>;
  setUserRole: (request: RoleSelectionRequest) => Promise<RoleSelectionResponse>;
  loadUserProfile: (userId: string) => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  session: null,
  userRole: null,
  userProfile: null,
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
        userRole: null,
        userProfile: null,
        loading: false,
      };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
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

            // Load user role and profile if user is authenticated
            if (data.session?.user?.id) {
              await loadUserProfile(data.session.user.id);
            }
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
    const { data } = authService.onAuthStateChange(async (event, session) => {
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

          // Load user role and profile if user is authenticated
          if (session.user?.id) {
            await loadUserProfile(session.user.id);
          }
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

        // Load user role and profile if user is authenticated
        if (data.session?.user?.id) {
          await loadUserProfile(data.session.user.id);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      dispatch({ type: 'CLEAR_SESSION' });
    }
  };

  // Get user role
  const getUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const role = await authService.getUserRole(userId);
      dispatch({ type: 'SET_USER_ROLE', payload: role });
      return role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  };

  // Set user role
  const setUserRole = async (request: RoleSelectionRequest): Promise<RoleSelectionResponse> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.setUserRole(request);

      if (response.success) {
        dispatch({ type: 'SET_USER_ROLE', payload: request.preferredRole });
        dispatch({ type: 'SET_USER_PROFILE', payload: response.userProfile });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set user role';
      return {
        success: false,
        userProfile: state.userProfile as any,
        redirectPath: '/'
      };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load user profile
  const loadUserProfile = async (userId: string): Promise<void> => {
    try {
      const [role, profile] = await Promise.all([
        authService.getUserRole(userId),
        authService.getEnhancedUserProfile(userId)
      ]);

      dispatch({ type: 'SET_USER_ROLE', payload: role });
      dispatch({ type: 'SET_USER_PROFILE', payload: profile });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const contextValue: AuthContextType = {
    state,
    signUp,
    signIn,
    signOut,
    refreshSession,
    getUserRole,
    setUserRole,
    loadUserProfile,
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
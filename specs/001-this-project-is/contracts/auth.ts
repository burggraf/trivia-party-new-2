// Authentication API Contract
// Uses Supabase Auth SDK - these are the expected method signatures and types

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  options?: {
    data?: {
      username?: string;
    };
  };
}

export interface SignUpResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error: AuthError | null;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error: AuthError | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  status: number;
}

// Expected Auth Service Methods
export interface AuthService {
  signUp(request: SignUpRequest): Promise<SignUpResponse>;
  signIn(request: SignInRequest): Promise<SignInResponse>;
  signOut(): Promise<{ error: AuthError | null }>;
  getSession(): Promise<{ data: { session: AuthSession | null }; error: AuthError | null }>;
  getUser(): Promise<{ data: { user: AuthUser | null }; error: AuthError | null }>;
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void): { data: { subscription: any } };
}
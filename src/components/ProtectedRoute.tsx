import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/contracts/host-management';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { state } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing
  if (!state.initialized || state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required, check user role
  if (requiredRole) {
    // If user hasn't selected a role yet, redirect to dashboard for role selection
    if (!state.userRole) {
      return <Navigate to="/" replace />;
    }

    // If user doesn't have the required role, redirect to their appropriate dashboard
    if (state.userRole !== requiredRole) {
      const redirectPath = state.userRole === 'host' ? '/host/dashboard' : '/';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}
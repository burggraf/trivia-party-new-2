import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/contexts/GameContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dashboard } from '@/components/Dashboard';
import { Login, Register, Profile } from '@/components/auth';
import { GameSetup, QuestionDisplay, GameResults } from '@/components/game';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useEffect, lazy, Suspense } from 'react';

// Lazy load host components for better performance
const HostDashboard = lazy(() => import('@/components/host/HostDashboard'));
const GameWizard = lazy(() => import('@/components/host/GameWizard'));

// Loading component for lazy loaded components
function LazyLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <ErrorBoundary>
                <GameProvider>
                  <ErrorBoundary>
                    <Layout>
                    <ErrorBoundary>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                        <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

                        {/* Protected Routes */}
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <Dashboard />
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <Profile />
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/game/setup"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <GameSetup />
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/game/play"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <QuestionDisplay />
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/game/results"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <GameResults />
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />

                        {/* Host Routes with Lazy Loading */}
                        <Route
                          path="/host/dashboard"
                          element={
                            <ProtectedRoute requiredRole="host">
                              <ErrorBoundary>
                                <Suspense fallback={<LazyLoadingFallback />}>
                                  <HostDashboardWrapper />
                                </Suspense>
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/host/games/new"
                          element={
                            <ProtectedRoute requiredRole="host">
                              <ErrorBoundary>
                                <Suspense fallback={<LazyLoadingFallback />}>
                                  <GameWizardWrapper />
                                </Suspense>
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />

                        {/* Fallback Route */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </ErrorBoundary>
                  </Layout>
                </ErrorBoundary>

                  {/* Toast Notifications */}
                  <Toaster />
                </GameProvider>
              </ErrorBoundary>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Host Dashboard Wrapper - connects HostDashboard component to context
function HostDashboardWrapper() {
  const { state: authState } = useAuth();
  const { state: gameState, loadHostDashboardData, refreshHostData } = useGame();

  useEffect(() => {
    if (authState.user?.id) {
      refreshHostData(authState.user.id);
    }
  }, [authState.user?.id, refreshHostData]);

  const handleRefresh = () => {
    if (authState.user?.id) {
      refreshHostData(authState.user.id);
    }
  };

  return (
    <HostDashboard
      userId={authState.user?.id || ''}
      dashboardData={gameState.hostDashboardData}
      onRefresh={handleRefresh}
      isLoading={gameState.isLoadingHostData}
    />
  );
}

// Game Wizard Wrapper - connects GameWizard component to context
function GameWizardWrapper() {
  const { state: authState } = useAuth();
  const { createHostGame } = useGame();
  const navigate = useNavigate();

  const handleGameCreate = async (gameData: any) => {
    try {
      console.log('handleGameCreate called with:', gameData);
      if (!authState.user?.id) {
        throw new Error('User not authenticated');
      }

      const result = await createHostGame({
        ...gameData,
        host_id: authState.user.id
      });
      console.log('Game created successfully:', result);

      // Navigate to host dashboard after successful creation
      navigate('/host/dashboard');

      return result;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  };

  return (
    <GameWizard
      onComplete={handleGameCreate}
      userId={authState.user?.id || ''}
    />
  );
}

export default App;
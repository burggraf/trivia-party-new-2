import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default App;
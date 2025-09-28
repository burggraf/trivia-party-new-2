import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import { gameService } from '@/services/game';
import { hostGameService } from '@/services/hostGameService';
import type {
  GameSession,
  UserProfile,
  QuestionPresentation,
  GameSummary,
  CreateGameSessionRequest
} from '@/contracts/game';
import type {
  Game,
  CreateGameRequest,
  UpdateGameRequest,
  HostDashboardData
} from '@/contracts/host-management';

// Game State Types
interface GameState {
  // User profile
  userProfile: UserProfile | null;

  // Current game session
  currentSession: GameSession | null;

  // Current question
  currentQuestion: QuestionPresentation | null;

  // Game flow state
  gameStatus: 'idle' | 'setup' | 'playing' | 'paused' | 'completed' | 'loading';

  // Statistics
  gameHistory: GameSession[];
  currentGameSummary: GameSummary | null;

  // UI state
  loading: boolean;
  error: string | null;

  // Question answering
  answering: boolean;
  showResult: boolean;
  lastAnswerCorrect: boolean | null;
  lastCorrectAnswer: string | null;

  // Available data
  availableCategories: string[];

  // Host Management State
  hostGames: Game[];
  currentHostGame: Game | null;
  hostDashboardData: HostDashboardData | null;

  // Host Loading States
  isCreatingGame: boolean;
  isUpdatingGame: boolean;
  isDeletingGame: boolean;
  isLoadingHostData: boolean;
}

// Game Actions
type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_AVAILABLE_CATEGORIES'; payload: string[] }
  | { type: 'SET_GAME_HISTORY'; payload: GameSession[] }
  | { type: 'SET_CURRENT_SESSION'; payload: GameSession | null }
  | { type: 'SET_CURRENT_QUESTION'; payload: QuestionPresentation | null }
  | { type: 'SET_GAME_STATUS'; payload: GameState['gameStatus'] }
  | { type: 'SET_ANSWERING'; payload: boolean }
  | { type: 'SET_SHOW_RESULT'; payload: { show: boolean; correct?: boolean; correctAnswer?: string } }
  | { type: 'SET_GAME_SUMMARY'; payload: GameSummary | null }
  | { type: 'UPDATE_SESSION_SCORE'; payload: number }
  | { type: 'RESET_GAME_STATE' }
  // Host Management Actions
  | { type: 'SET_HOST_GAMES'; payload: Game[] }
  | { type: 'SET_CURRENT_HOST_GAME'; payload: Game | null }
  | { type: 'SET_HOST_DASHBOARD_DATA'; payload: HostDashboardData | null }
  | { type: 'SET_HOST_LOADING_STATE'; payload: { key: 'creating' | 'updating' | 'deleting' | 'loadingData'; value: boolean } }
  | { type: 'ADD_HOST_GAME'; payload: Game }
  | { type: 'UPDATE_HOST_GAME'; payload: Game }
  | { type: 'REMOVE_HOST_GAME'; payload: string };

// Game Context Interface
interface GameContextType {
  state: GameState;

  // Profile management
  loadUserProfile: (userId: string) => Promise<void>;
  createUserProfile: (profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;

  // Game setup
  loadAvailableCategories: () => Promise<void>;
  createGameSession: (userId: string, config: CreateGameSessionRequest) => Promise<void>;

  // Game flow
  startGame: () => Promise<void>;
  submitAnswer: (userAnswer: string, timeToAnswer: number) => Promise<void>;
  pauseGame: () => Promise<void>;
  resumeGame: () => Promise<void>;
  resumePausedGame: (sessionId: string) => Promise<void>;
  abandonGame: (sessionId: string) => Promise<void>;
  completeGame: () => Promise<void>;

  // Statistics
  loadGameHistory: (userId: string) => Promise<void>;

  // Utility
  resetGameState: () => void;
  clearError: () => void;
  setCurrentSession: (session: GameSession) => void;
  setCurrentQuestion: (question: QuestionPresentation) => void;

  // Host Management
  loadHostGames: (userId: string) => Promise<void>;
  loadHostDashboardData: (userId: string) => Promise<void>;
  createHostGame: (gameData: CreateGameRequest) => Promise<Game>;
  updateHostGame: (gameId: string, updates: UpdateGameRequest) => Promise<Game>;
  deleteHostGame: (gameId: string) => Promise<void>;
  archiveHostGame: (gameId: string) => Promise<void>;
  setCurrentHostGame: (game: Game | null) => void;
  refreshHostData: (userId: string) => Promise<void>;
}

// Initial state
const initialState: GameState = {
  userProfile: null,
  currentSession: null,
  currentQuestion: null,
  gameStatus: 'idle',
  gameHistory: [],
  currentGameSummary: null,
  loading: false,
  error: null,
  answering: false,
  showResult: false,
  lastAnswerCorrect: null,
  lastCorrectAnswer: null,
  availableCategories: [],
  // Host Management State
  hostGames: [],
  currentHostGame: null,
  hostDashboardData: null,
  // Host Loading States
  isCreatingGame: false,
  isUpdatingGame: false,
  isDeletingGame: false,
  isLoadingHostData: false,
};

// Game reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_AVAILABLE_CATEGORIES':
      return { ...state, availableCategories: action.payload };
    case 'SET_GAME_HISTORY':
      return { ...state, gameHistory: action.payload };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestion: action.payload };
    case 'SET_GAME_STATUS':
      return { ...state, gameStatus: action.payload };
    case 'SET_ANSWERING':
      return { ...state, answering: action.payload };
    case 'SET_SHOW_RESULT':
      return {
        ...state,
        showResult: action.payload.show,
        lastAnswerCorrect: action.payload.correct ?? null,
        lastCorrectAnswer: action.payload.correctAnswer ?? null
      };
    case 'SET_GAME_SUMMARY':
      return { ...state, currentGameSummary: action.payload };
    case 'UPDATE_SESSION_SCORE':
      return {
        ...state,
        currentSession: state.currentSession
          ? { ...state.currentSession, total_score: action.payload }
          : null
      };
    case 'RESET_GAME_STATE':
      return {
        ...initialState,
        userProfile: state.userProfile,
        availableCategories: state.availableCategories,
        gameHistory: state.gameHistory,
        // Preserve host state when resetting player game state
        hostGames: state.hostGames,
        currentHostGame: state.currentHostGame,
        hostDashboardData: state.hostDashboardData
      };
    // Host Management Actions
    case 'SET_HOST_GAMES':
      return { ...state, hostGames: action.payload };
    case 'SET_CURRENT_HOST_GAME':
      return { ...state, currentHostGame: action.payload };
    case 'SET_HOST_DASHBOARD_DATA':
      return { ...state, hostDashboardData: action.payload };
    case 'SET_HOST_LOADING_STATE':
      const { key, value } = action.payload;
      const loadingStateKey = key === 'creating' ? 'isCreatingGame'
        : key === 'updating' ? 'isUpdatingGame'
        : key === 'deleting' ? 'isDeletingGame'
        : 'isLoadingHostData';
      return { ...state, [loadingStateKey]: value };
    case 'ADD_HOST_GAME':
      return { ...state, hostGames: [action.payload, ...state.hostGames] };
    case 'UPDATE_HOST_GAME':
      return {
        ...state,
        hostGames: state.hostGames.map(game =>
          game.id === action.payload.id ? action.payload : game
        ),
        currentHostGame: state.currentHostGame?.id === action.payload.id
          ? action.payload
          : state.currentHostGame
      };
    case 'REMOVE_HOST_GAME':
      return {
        ...state,
        hostGames: state.hostGames.filter(game => game.id !== action.payload),
        currentHostGame: state.currentHostGame?.id === action.payload
          ? null
          : state.currentHostGame
      };
    default:
      return state;
  }
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Game Provider Props
interface GameProviderProps {
  children: ReactNode;
}

// Game Provider Component
export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load user profile
  const loadUserProfile = useCallback(async (userId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const profile = await gameService.getUserProfile(userId);
      dispatch({ type: 'SET_USER_PROFILE', payload: profile });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load user profile'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Create user profile
  const createUserProfile = async (profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const profile = await gameService.createUserProfile(profileData);
      dispatch({ type: 'SET_USER_PROFILE', payload: profile });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create user profile'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load available categories
  const loadAvailableCategories = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const categories = await gameService.getAvailableCategories();
      dispatch({ type: 'SET_AVAILABLE_CATEGORIES', payload: categories });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load categories'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Create game session
  const createGameSession = useCallback(async (userId: string, config: CreateGameSessionRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const session = await gameService.createGameSession(userId, config);
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
      dispatch({ type: 'SET_GAME_STATUS', payload: 'setup' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create game session'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Start game
  const startGame = useCallback(async () => {
    if (!state.currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game session' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await gameService.startGame(state.currentSession.id);
      dispatch({ type: 'SET_CURRENT_SESSION', payload: result.session });
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: result.first_question });
      dispatch({ type: 'SET_GAME_STATUS', payload: 'playing' });
      dispatch({ type: 'SET_SHOW_RESULT', payload: { show: false } });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to start game'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentSession]);

  // Submit answer
  const submitAnswer = async (userAnswer: string, timeToAnswer: number) => {
    if (!state.currentSession || !state.currentQuestion) {
      dispatch({ type: 'SET_ERROR', payload: 'No active question' });
      return;
    }

    dispatch({ type: 'SET_ANSWERING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await gameService.submitAnswer({
        game_session_id: state.currentSession.id,
        game_question_id: state.currentQuestion.id,
        user_answer: userAnswer,
        time_to_answer_ms: timeToAnswer
      });

      // Fetch updated session to get current round and question index
      const updatedSession = await gameService.getGameSession(state.currentSession.id);
      if (updatedSession) {
        dispatch({ type: 'SET_CURRENT_SESSION', payload: updatedSession });
      }

      // Show result
      dispatch({
        type: 'SET_SHOW_RESULT',
        payload: { show: true, correct: result.is_correct, correctAnswer: result.correct_answer }
      });

      // Handle game flow
      console.log('🎮 Submit answer result:', {
        game_complete: result.game_complete,
        round_complete: result.round_complete,
        next_question: result.next_question
      });

      if (result.game_complete) {
        console.log('🎮 Game completed!');
        dispatch({ type: 'SET_GAME_STATUS', payload: 'completed' });
        // Load game summary
        const summary = await gameService.getGameSummary(state.currentSession.id);
        dispatch({ type: 'SET_GAME_SUMMARY', payload: summary });
      } else if (result.round_complete) {
        console.log('🎮 Round completed, next question:', !!result.next_question);
        // Handle round completion - could show round summary
        if (result.next_question) {
          setTimeout(() => {
            console.log('🎮 Setting next question after round completion');
            dispatch({ type: 'SET_CURRENT_QUESTION', payload: result.next_question! });
            dispatch({ type: 'SET_SHOW_RESULT', payload: { show: false } });
          }, 2000); // Show result for 2 seconds
        }
      } else if (result.next_question) {
        console.log('🎮 Moving to next question');
        // Move to next question
        setTimeout(() => {
          console.log('🎮 Setting next question');
          dispatch({ type: 'SET_CURRENT_QUESTION', payload: result.next_question! });
          dispatch({ type: 'SET_SHOW_RESULT', payload: { show: false } });
        }, 2000); // Show result for 2 seconds
      } else {
        console.log('🎮 No next question available');
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to submit answer'
      });
    } finally {
      dispatch({ type: 'SET_ANSWERING', payload: false });
    }
  };

  // Pause game
  const pauseGame = async () => {
    if (!state.currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game session' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await gameService.pauseGame(state.currentSession.id);
      dispatch({ type: 'SET_GAME_STATUS', payload: 'paused' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to pause game'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Resume game
  const resumeGame = async () => {
    if (!state.currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game session' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const question = await gameService.resumeGame(state.currentSession.id);
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
      dispatch({ type: 'SET_GAME_STATUS', payload: 'playing' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to resume game'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Complete game
  const completeGame = async () => {
    if (!state.currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game session' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const summary = await gameService.completeGame(state.currentSession.id);
      dispatch({ type: 'SET_GAME_SUMMARY', payload: summary });
      dispatch({ type: 'SET_GAME_STATUS', payload: 'completed' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to complete game'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Resume paused game by session ID
  const resumePausedGame = async (sessionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Load the game session first
      const session = await gameService.getGameSession(sessionId);
      if (!session) {
        throw new Error('Game session not found');
      }

      // Set the current session
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session });

      // Resume the game and get the current question
      const question = await gameService.resumeGame(sessionId);
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
      dispatch({ type: 'SET_GAME_STATUS', payload: 'playing' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to resume game'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Abandon a paused game
  const abandonGame = async (sessionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Update the game session status to completed (effectively abandoning it)
      // and set end_time to mark when it was abandoned
      await gameService.updateGameSession(sessionId, {
        status: 'completed',
        end_time: new Date().toISOString()
      });

      // Reload game history to reflect the change
      if (state.userProfile?.id) {
        const sessions = await gameService.getUserGameSessions(state.userProfile.id);
        dispatch({ type: 'SET_GAME_HISTORY', payload: sessions });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to abandon game'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load game history
  const loadGameHistory = useCallback(async (userId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const sessions = await gameService.getUserGameSessions(userId);
      dispatch({ type: 'SET_GAME_HISTORY', payload: sessions });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load game history'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Reset game state
  const resetGameState = () => {
    dispatch({ type: 'RESET_GAME_STATE' });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Set current session directly
  const setCurrentSession = (session: GameSession) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
    dispatch({ type: 'SET_GAME_STATUS', payload: 'playing' });
  };

  // Set current question directly
  const setCurrentQuestion = (question: QuestionPresentation) => {
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
    dispatch({ type: 'SET_SHOW_RESULT', payload: { show: false } });
  };

  // Host Management Functions
  const loadHostGames = useCallback(async (userId: string) => {
    dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'loadingData', value: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const gamesResponse = await hostGameService.getHostGames(userId);
      dispatch({ type: 'SET_HOST_GAMES', payload: gamesResponse.games });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load host games'
      });
    } finally {
      dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'loadingData', value: false } });
    }
  }, []);

  const loadHostDashboardData = useCallback(async (userId: string) => {
    dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'loadingData', value: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const dashboardData = await hostGameService.getHostDashboard(userId);
      dispatch({ type: 'SET_HOST_DASHBOARD_DATA', payload: dashboardData });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load dashboard data'
      });
    } finally {
      dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'loadingData', value: false } });
    }
  }, []);

  const createHostGame = useCallback(async (gameData: CreateGameRequest): Promise<Game> => {
    dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'creating', value: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const newGame = await hostGameService.createGame(gameData);
      dispatch({ type: 'ADD_HOST_GAME', payload: newGame });

      // Refresh dashboard data to update stats
      if (gameData.host_id) {
        await loadHostDashboardData(gameData.host_id);
      }

      return newGame;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'creating', value: false } });
    }
  }, [loadHostDashboardData]);

  const updateHostGame = useCallback(async (gameId: string, updates: UpdateGameRequest): Promise<Game> => {
    dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'updating', value: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const updatedGame = await hostGameService.updateGame({ gameId, updates });
      dispatch({ type: 'UPDATE_HOST_GAME', payload: updatedGame });
      return updatedGame;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update game';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'updating', value: false } });
    }
  }, []);

  const deleteHostGame = useCallback(async (gameId: string): Promise<void> => {
    dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'deleting', value: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const hostId = state.userProfile?.id;
      if (!hostId) {
        throw new Error('User profile not loaded');
      }

      await hostGameService.deleteGame({ gameId, hostId });
      dispatch({ type: 'REMOVE_HOST_GAME', payload: gameId });

      // Refresh dashboard data to update stats
      await loadHostDashboardData(hostId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete game';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'deleting', value: false } });
    }
  }, [state.userProfile?.id, loadHostDashboardData]);

  const archiveHostGame = useCallback(async (gameId: string): Promise<void> => {
    dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'updating', value: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const hostId = state.userProfile?.id;
      if (!hostId) {
        throw new Error('User profile not loaded');
      }

      await hostGameService.archiveGame({ gameId, hostId });

      // Update the local game to reflect archived status
      const updatedGame = state.hostGames.find(g => g.id === gameId);
      if (updatedGame) {
        dispatch({
          type: 'UPDATE_HOST_GAME',
          payload: { ...updatedGame, archived: true }
        });
      }

      // Refresh dashboard data to update stats
      await loadHostDashboardData(hostId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive game';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_HOST_LOADING_STATE', payload: { key: 'updating', value: false } });
    }
  }, [state.userProfile?.id, state.hostGames, loadHostDashboardData]);

  const setCurrentHostGame = useCallback((game: Game | null) => {
    dispatch({ type: 'SET_CURRENT_HOST_GAME', payload: game });
  }, []);

  const refreshHostData = useCallback(async (userId: string) => {
    await Promise.all([
      loadHostGames(userId),
      loadHostDashboardData(userId)
    ]);
  }, [loadHostGames, loadHostDashboardData]);

  const contextValue: GameContextType = {
    state,
    loadUserProfile,
    createUserProfile,
    loadAvailableCategories,
    createGameSession,
    startGame,
    submitAnswer,
    pauseGame,
    resumeGame,
    resumePausedGame,
    abandonGame,
    completeGame,
    loadGameHistory,
    resetGameState,
    clearError,
    setCurrentSession,
    setCurrentQuestion,
    // Host Management
    loadHostGames,
    loadHostDashboardData,
    createHostGame,
    updateHostGame,
    deleteHostGame,
    archiveHostGame,
    setCurrentHostGame,
    refreshHostData,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Hook to use game context
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
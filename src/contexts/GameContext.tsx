import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import { gameService } from '@/services/game';
import type {
  GameSession,
  UserProfile,
  QuestionPresentation,
  GameSummary,
  CreateGameSessionRequest
} from '../../specs/001-this-project-is/contracts/game';

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

  // Available data
  availableCategories: string[];
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
  | { type: 'SET_SHOW_RESULT'; payload: { show: boolean; correct?: boolean } }
  | { type: 'SET_GAME_SUMMARY'; payload: GameSummary | null }
  | { type: 'UPDATE_SESSION_SCORE'; payload: number }
  | { type: 'RESET_GAME_STATE' };

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
  completeGame: () => Promise<void>;

  // Statistics
  loadGameHistory: (userId: string) => Promise<void>;

  // Utility
  resetGameState: () => void;
  clearError: () => void;
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
  availableCategories: [],
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
        lastAnswerCorrect: action.payload.correct ?? null
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
        gameHistory: state.gameHistory
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
  const loadAvailableCategories = async () => {
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
  };

  // Create game session
  const createGameSession = async (userId: string, config: CreateGameSessionRequest) => {
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
  };

  // Start game
  const startGame = async () => {
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
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to start game'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

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

      // Update score
      dispatch({ type: 'UPDATE_SESSION_SCORE', payload: result.updated_score });

      // Show result
      dispatch({
        type: 'SET_SHOW_RESULT',
        payload: { show: true, correct: result.is_correct }
      });

      // Handle game flow
      if (result.game_complete) {
        dispatch({ type: 'SET_GAME_STATUS', payload: 'completed' });
        // Load game summary
        const summary = await gameService.getGameSummary(state.currentSession.id);
        dispatch({ type: 'SET_GAME_SUMMARY', payload: summary });
      } else if (result.round_complete) {
        // Handle round completion - could show round summary
        if (result.next_question) {
          setTimeout(() => {
            dispatch({ type: 'SET_CURRENT_QUESTION', payload: result.next_question! });
            dispatch({ type: 'SET_SHOW_RESULT', payload: { show: false } });
          }, 2000); // Show result for 2 seconds
        }
      } else if (result.next_question) {
        // Move to next question
        setTimeout(() => {
          dispatch({ type: 'SET_CURRENT_QUESTION', payload: result.next_question! });
          dispatch({ type: 'SET_SHOW_RESULT', payload: { show: false } });
        }, 2000); // Show result for 2 seconds
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
    completeGame,
    loadGameHistory,
    resetGameState,
    clearError,
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
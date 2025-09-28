// Host Component Contracts
// React component prop interfaces for host management UI

import type { ReactNode } from 'react';
import type {
  Game,
  Team,
  Round,
  Question,
  GameStatus,
  UserRole,
  GameConfiguration,
  GameWizardState,
  GameWizardStep,
  RoundConfiguration,
  QuestionAssignment,
  HostDashboardData,
  HostGameSummary,
  TeamConfiguration
} from './host-management';

// === Role Selection Components ===

export interface RoleSelectionProps {
  userId: string;
  onRoleSelected: (role: UserRole) => void;
  isLoading?: boolean;
  error?: string;
}

export interface RoleToggleProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  disabled?: boolean;
}

// === Host Dashboard Components ===

export interface HostDashboardProps {
  userId: string;
  dashboardData: HostDashboardData;
  onRefresh: () => void;
  isLoading?: boolean;
}

export interface GameCardProps {
  game: HostGameSummary;
  onEdit: (gameId: string) => void;
  onArchive: (gameId: string) => void;
  onDelete: (gameId: string) => void;
  onViewDetails: (gameId: string) => void;
  showActions?: boolean;
}

export interface GameListProps {
  games: HostGameSummary[];
  onGameAction: (action: 'edit' | 'archive' | 'delete' | 'view', gameId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  showFilters?: boolean;
}

export interface HostStatsProps {
  gameStats: HostDashboardData['gameStats'];
  questionStats: HostDashboardData['questionStats'];
}

// === Game Creation/Editing Components ===

export interface GameWizardProps {
  initialData?: Partial<GameConfiguration>;
  onComplete: (gameData: GameConfiguration) => void;
  onCancel: () => void;
  isEditing?: boolean;
  gameId?: string;
}

export interface GameWizardStepProps {
  wizardState: GameWizardState;
  onUpdateState: (updates: Partial<GameWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export interface BasicGameInfoStepProps extends GameWizardStepProps {
  availableCategories: string[];
}

export interface RoundConfigurationStepProps extends GameWizardStepProps {
  availableCategories: string[];
  onRoundUpdate: (roundIndex: number, config: RoundConfiguration) => void;
}

export interface QuestionGenerationStepProps extends GameWizardStepProps {
  onGenerateQuestions: () => Promise<void>;
  generationProgress?: {
    isGenerating: boolean;
    progress: number;
    currentRound: number;
    totalRounds: number;
    duplicatesFound: number;
  };
}

export interface TeamSetupStepProps extends GameWizardStepProps {
  teams: Team[];
  onCreateTeam: (teamData: TeamConfiguration) => void;
  onUpdateTeam: (teamId: string, updates: Partial<TeamConfiguration>) => void;
  onDeleteTeam: (teamId: string) => void;
}

export interface GameReviewStepProps extends GameWizardStepProps {
  gameData: GameConfiguration;
  rounds: RoundConfiguration[];
  teams: Team[];
  questionsGenerated: boolean;
}

// === Game Form Components ===

export interface GameBasicInfoFormProps {
  value: Partial<GameConfiguration>;
  onChange: (data: Partial<GameConfiguration>) => void;
  errors: Record<string, string[]>;
  availableCategories: string[];
}

export interface GameAdvancedSettingsProps {
  value: Partial<GameConfiguration>;
  onChange: (data: Partial<GameConfiguration>) => void;
  errors: Record<string, string[]>;
}

export interface CategorySelectorProps {
  availableCategories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  maxSelections?: number;
  required?: boolean;
  error?: string;
}

// === Round Management Components ===

export interface RoundManagerProps {
  gameId: string;
  rounds: Round[];
  onRoundUpdate: (roundId: string, config: RoundConfiguration) => void;
  onRegenerateQuestions: (roundId: string) => void;
  isLoading?: boolean;
}

export interface RoundConfigCardProps {
  round: Round;
  configuration: RoundConfiguration;
  onUpdate: (config: RoundConfiguration) => void;
  onPreviewQuestions: () => void;
  availableCategories: string[];
  isEditable?: boolean;
}

export interface RoundListProps {
  rounds: Round[];
  onRoundSelect: (roundId: string) => void;
  selectedRoundId?: string;
  showProgress?: boolean;
}

// === Question Management Components ===

export interface QuestionPreviewProps {
  roundId: string;
  questions: QuestionAssignment[];
  onReplaceQuestion: (questionId: string, newQuestionId: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export interface QuestionCardProps {
  question: Question;
  assignment: QuestionAssignment;
  onReplace: () => void;
  showReplaceButton?: boolean;
  isSelected?: boolean;
}

export interface QuestionReplacementModalProps {
  originalQuestion: Question;
  replacementOptions: Question[];
  onSelect: (questionId: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface QuestionGenerationProgressProps {
  progress: {
    currentRound: number;
    totalRounds: number;
    questionsAssigned: number;
    questionsTotal: number;
    duplicatesFound: number;
    status: 'processing' | 'completed' | 'error';
    message?: string;
  };
  onCancel?: () => void;
}

// === Team Management Components ===

export interface TeamManagerProps {
  gameId: string;
  teams: Team[];
  maxTeams: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  selfRegistrationEnabled: boolean;
  onCreateTeam: (teamData: TeamConfiguration) => void;
  onUpdateTeam: (teamId: string, updates: Partial<TeamConfiguration>) => void;
  onDeleteTeam: (teamId: string) => void;
  onToggleSelfRegistration: (enabled: boolean) => void;
  isLoading?: boolean;
}

export interface TeamCardProps {
  team: Team;
  playerCount: number;
  minPlayers: number;
  maxPlayers: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddPlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
  isEditable?: boolean;
  showPlayerManagement?: boolean;
}

export interface TeamFormProps {
  initialData?: Partial<TeamConfiguration>;
  onSubmit: (teamData: TeamConfiguration) => void;
  onCancel: () => void;
  availableColors: string[];
  isLoading?: boolean;
  errors: Record<string, string[]>;
}

export interface PlayerSelectorProps {
  gameId: string;
  teamId?: string;
  selectedPlayerIds: string[];
  onPlayersChange: (playerIds: string[]) => void;
  maxSelections: number;
  excludePlayerIds?: string[];
  isLoading?: boolean;
}

// === Utility Components ===

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export interface SuccessToastProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// === Layout Components ===

export interface HostLayoutProps {
  children: ReactNode;
  currentUser: {
    id: string;
    username: string;
    preferred_role: UserRole;
  };
  onRoleSwitch: (role: UserRole) => void;
}

export interface HostNavigationProps {
  currentPath: string;
  gameCount: number;
  hasActiveGames: boolean;
}

export interface HostSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  quickActions: Array<{
    label: string;
    path: string;
    icon: ReactNode;
    badge?: number;
  }>;
}

// === Hook Interfaces ===

export interface UseGameWizardReturn {
  state: GameWizardState;
  actions: {
    updateGameData: (data: Partial<GameConfiguration>) => void;
    updateRoundConfig: (roundIndex: number, config: RoundConfiguration) => void;
    nextStep: () => void;
    previousStep: () => void;
    goToStep: (step: GameWizardStep) => void;
    validateCurrentStep: () => boolean;
    submitGame: () => Promise<void>;
    reset: () => void;
  };
  validation: {
    errors: Record<string, string[]>;
    isValid: boolean;
    canProceed: boolean;
  };
}

export interface UseHostGamesReturn {
  games: HostGameSummary[];
  isLoading: boolean;
  error: string | null;
  actions: {
    refresh: () => Promise<void>;
    createGame: (data: GameConfiguration) => Promise<string>;
    updateGame: (gameId: string, updates: Partial<GameConfiguration>) => Promise<void>;
    archiveGame: (gameId: string) => Promise<void>;
    deleteGame: (gameId: string) => Promise<void>;
  };
}

export interface UseQuestionManagementReturn {
  questions: Record<string, QuestionAssignment[]>; // roundId -> questions
  isLoading: boolean;
  error: string | null;
  actions: {
    generateQuestions: (gameId: string) => Promise<void>;
    previewRoundQuestions: (roundId: string) => Promise<QuestionAssignment[]>;
    replaceQuestion: (roundQuestionId: string, newQuestionId: string) => Promise<void>;
    getReplacementOptions: (questionId: string, category: string) => Promise<Question[]>;
  };
}

export interface UseTeamManagementReturn {
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  actions: {
    createTeam: (teamData: TeamConfiguration) => Promise<void>;
    updateTeam: (teamId: string, updates: Partial<TeamConfiguration>) => Promise<void>;
    deleteTeam: (teamId: string) => Promise<void>;
    addPlayer: (teamId: string, playerId: string) => Promise<void>;
    removePlayer: (teamId: string, playerId: string) => Promise<void>;
  };
}
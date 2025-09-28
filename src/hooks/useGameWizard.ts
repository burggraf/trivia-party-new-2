import { useState, useCallback, useMemo } from 'react';
import type { GameConfiguration } from '@/contracts/host-components';

export type WizardStep = 'basic' | 'rounds' | 'questions' | 'teams' | 'review';

export const WIZARD_STEPS: Array<{
  id: WizardStep;
  title: string;
  description: string;
}> = [
  { id: 'basic', title: 'Basic Info', description: 'Game title, location, and date' },
  { id: 'rounds', title: 'Rounds', description: 'Configure rounds and questions' },
  { id: 'questions', title: 'Questions', description: 'Select categories and generate questions' },
  { id: 'teams', title: 'Teams', description: 'Team settings and registration' },
  { id: 'review', title: 'Review', description: 'Review and create game' }
];

interface UseGameWizardProps {
  initialData?: Partial<GameConfiguration>;
  onComplete?: (gameData: GameConfiguration) => void;
}

interface StepValidation {
  basic: boolean;
  rounds: boolean;
  questions: boolean;
  teams: boolean;
  review: boolean;
}

export function useGameWizard({
  initialData = {},
  onComplete
}: UseGameWizardProps = {}) {
  // Core wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [gameData, setGameData] = useState<Partial<GameConfiguration>>({
    title: '',
    location: '',
    scheduled_date: '',
    total_rounds: 3,
    questions_per_round: 10,
    selected_categories: [],
    max_teams: 6,
    max_players_per_team: 4,
    min_players_per_team: 2,
    self_registration_enabled: true,
    ...initialData
  });

  // Step validation state
  const [stepValidation, setStepValidation] = useState<StepValidation>({
    basic: Boolean(initialData.title?.trim()),
    rounds: true,
    questions: Boolean(initialData.selected_categories?.length),
    teams: true,
    review: true
  });

  // Processing states
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed values
  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === currentStep);
  const currentStepData = WIZARD_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;
  const canGoNext = stepValidation[currentStep];
  const canGoBack = currentStepIndex > 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  // Overall validation
  const isValid = useMemo(() => {
    return Object.values(stepValidation).every(Boolean) &&
           Boolean(gameData.title?.trim()) &&
           Boolean(gameData.selected_categories?.length);
  }, [stepValidation, gameData.title, gameData.selected_categories]);

  // Navigation functions
  const goToStep = useCallback((step: WizardStep) => {
    const stepIndex = WIZARD_STEPS.findIndex(s => s.id === step);
    if (stepIndex !== -1) {
      setCurrentStep(step);
    }
  }, []);

  const goNext = useCallback(() => {
    if (canGoNext && !isLastStep) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStep(WIZARD_STEPS[nextIndex].id);
    }
  }, [canGoNext, isLastStep, currentStepIndex]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStep(WIZARD_STEPS[prevIndex].id);
    }
  }, [canGoBack, currentStepIndex]);

  // Data update functions
  const updateGameData = useCallback((updates: Partial<GameConfiguration>) => {
    setGameData(prev => ({ ...prev, ...updates }));

    // Auto-validate steps based on updated data
    const newData = { ...gameData, ...updates };

    setStepValidation(prev => ({
      ...prev,
      basic: Boolean(newData.title?.trim()),
      questions: Boolean(newData.selected_categories?.length)
    }));
  }, [gameData]);

  const setStepValid = useCallback((step: WizardStep, valid: boolean) => {
    setStepValidation(prev => ({ ...prev, [step]: valid }));
  }, []);

  // Question generation
  const generateQuestions = useCallback(async () => {
    if (!gameData.selected_categories?.length) return;

    setIsGeneratingQuestions(true);
    try {
      // Simulate API call for question generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mark questions step as valid
      setStepValid('questions', true);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [gameData.selected_categories, setStepValid]);

  // Complete wizard
  const complete = useCallback(async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await onComplete?.(gameData as GameConfiguration);
    } catch (error) {
      console.error('Failed to complete wizard:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, gameData, onComplete]);

  // Reset wizard
  const reset = useCallback(() => {
    setCurrentStep('basic');
    setGameData({
      title: '',
      location: '',
      scheduled_date: '',
      total_rounds: 3,
      questions_per_round: 10,
      selected_categories: [],
      max_teams: 6,
      max_players_per_team: 4,
      min_players_per_team: 2,
      self_registration_enabled: true,
      ...initialData
    });
    setStepValidation({
      basic: Boolean(initialData.title?.trim()),
      rounds: true,
      questions: Boolean(initialData.selected_categories?.length),
      teams: true,
      review: true
    });
    setIsGeneratingQuestions(false);
    setIsSubmitting(false);
  }, [initialData]);

  return {
    // State
    currentStep,
    currentStepIndex,
    currentStepData,
    gameData,
    stepValidation,

    // Computed values
    progress,
    canGoNext,
    canGoBack,
    isLastStep,
    isValid,

    // Processing states
    isGeneratingQuestions,
    isSubmitting,

    // Navigation
    goToStep,
    goNext,
    goBack,

    // Data management
    updateGameData,
    setStepValid,

    // Actions
    generateQuestions,
    complete,
    reset,

    // Constants
    steps: WIZARD_STEPS
  };
}

export default useGameWizard;
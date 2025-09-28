import React, { useState, useReducer, lazy, Suspense, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GameWizardProps, GameConfiguration } from '@/contracts/host-components';

// Lazy load form components for better performance
const GameBasicInfoForm = lazy(() => import('@/components/host/forms/GameBasicInfoForm'));
const CategorySelector = lazy(() => import('@/components/host/forms/CategorySelector'));
const TeamForm = lazy(() => import('@/components/host/forms/TeamForm'));
const PlayerSelector = lazy(() => import('@/components/host/forms/PlayerSelector'));

// Loading component for form components
function FormLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading form...</p>
      </div>
    </div>
  );
}

// Wizard steps
const WIZARD_STEPS = [
  { id: 'basic', title: 'Basic Info', description: 'Game title, location, and date' },
  { id: 'rounds', title: 'Rounds', description: 'Configure rounds and questions' },
  { id: 'questions', title: 'Questions', description: 'Select categories and generate questions' },
  { id: 'teams', title: 'Teams', description: 'Team settings and registration' },
  { id: 'review', title: 'Review', description: 'Review and create game' }
] as const;

type WizardStep = typeof WIZARD_STEPS[number]['id'];

interface WizardState {
  currentStep: number;
  gameData: Partial<GameConfiguration>;
  isValid: Record<WizardStep, boolean>;
}

type WizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_DATA'; payload: Partial<GameConfiguration> }
  | { type: 'SET_VALID'; payload: { step: WizardStep; valid: boolean } };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'UPDATE_DATA':
      return { ...state, gameData: { ...state.gameData, ...action.payload } };
    case 'SET_VALID':
      return {
        ...state,
        isValid: { ...state.isValid, [action.payload.step]: action.payload.valid }
      };
    default:
      return state;
  }
}

export const GameWizard = memo(function GameWizard({
  initialData = {},
  onComplete,
  onCancel,
  isEditing = false,
  gameId
}: GameWizardProps) {
  const [state, dispatch] = useReducer(wizardReducer, {
    currentStep: 0,
    gameData: {
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
    },
    isValid: {
      basic: false,
      rounds: true,
      questions: false,
      teams: true,
      review: true
    }
  });

  const currentStepData = WIZARD_STEPS[state.currentStep];
  const currentStepId = currentStepData.id as WizardStep;
  const progress = ((state.currentStep + 1) / WIZARD_STEPS.length) * 100;

  const canGoNext = state.isValid[currentStepId];
  const canGoBack = state.currentStep > 0;
  const isLastStep = state.currentStep === WIZARD_STEPS.length - 1;

  const handleNext = () => {
    if (canGoNext && !isLastStep) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const handleComplete = () => {
    if (isLastStep && canGoNext) {
      onComplete(state.gameData as GameConfiguration);
    }
  };

  const updateData = (data: Partial<GameConfiguration>) => {
    dispatch({ type: 'UPDATE_DATA', payload: data });
  };

  const setStepValid = (step: WizardStep, valid: boolean) => {
    dispatch({ type: 'SET_VALID', payload: { step, valid } });
  };

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'basic':
        return (
          <div data-testid="basic-step" className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Game Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Game Title</label>
                <input
                  data-testid="title-input"
                  className="w-full p-2 border rounded-md"
                  value={state.gameData.title || ''}
                  onChange={(e) => {
                    updateData({ title: e.target.value });
                    setStepValid('basic', e.target.value.trim().length > 0);
                  }}
                  placeholder="Enter game title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  data-testid="location-input"
                  className="w-full p-2 border rounded-md"
                  value={state.gameData.location || ''}
                  onChange={(e) => updateData({ location: e.target.value })}
                  placeholder="Enter location (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scheduled Date</label>
                <input
                  data-testid="date-input"
                  type="datetime-local"
                  className="w-full p-2 border rounded-md"
                  value={state.gameData.scheduled_date || ''}
                  onChange={(e) => updateData({ scheduled_date: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'rounds':
        return (
          <div data-testid="rounds-step" className="space-y-4">
            <h2 className="text-xl font-semibold">Round Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Rounds</label>
                <input
                  data-testid="total-rounds-input"
                  type="number"
                  min="1"
                  max="10"
                  className="w-full p-2 border rounded-md"
                  value={state.gameData.total_rounds || 3}
                  onChange={(e) => updateData({ total_rounds: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Questions per Round</label>
                <input
                  data-testid="questions-per-round-input"
                  type="number"
                  min="5"
                  max="20"
                  className="w-full p-2 border rounded-md"
                  value={state.gameData.questions_per_round || 10}
                  onChange={(e) => updateData({ questions_per_round: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        );

      case 'questions':
        return (
          <div data-testid="questions-step" className="space-y-4">
            <h2 className="text-xl font-semibold">Question Generation</h2>
            <div data-testid="category-selection" className="space-y-2">
              <label className="block text-sm font-medium mb-2">Select Categories</label>
              {['science', 'history', 'sports', 'entertainment'].map(category => (
                <label
                  key={category}
                  data-testid={`category-${category}`}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={state.gameData.selected_categories?.includes(category) || false}
                    onChange={(e) => {
                      const categories = state.gameData.selected_categories || [];
                      const updated = e.target.checked
                        ? [...categories, category]
                        : categories.filter(c => c !== category);
                      updateData({ selected_categories: updated });
                      setStepValid('questions', updated.length > 0);
                    }}
                  />
                  <span className="capitalize">{category}</span>
                </label>
              ))}
            </div>
            <Button data-testid="generate-questions-button" variant="outline">
              Generate Questions
            </Button>
          </div>
        );

      case 'teams':
        return (
          <div data-testid="teams-step" className="space-y-4">
            <h2 className="text-xl font-semibold">Team Setup</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Teams</label>
                <input
                  data-testid="max-teams-input"
                  type="number"
                  min="2"
                  max="20"
                  className="w-full p-2 border rounded-md"
                  value={state.gameData.max_teams || 6}
                  onChange={(e) => updateData({ max_teams: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Players per Team</label>
                <input
                  data-testid="max-players-input"
                  type="number"
                  min="1"
                  max="8"
                  className="w-full p-2 border rounded-md"
                  value={state.gameData.max_players_per_team || 4}
                  onChange={(e) => updateData({ max_players_per_team: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Players per Team</label>
                <input
                  data-testid="min-players-input"
                  type="number"
                  min="1"
                  max="4"
                  className="w-full p-2 border rounded-md"
                  value={state.gameData.min_players_per_team || 2}
                  onChange={(e) => updateData({ min_players_per_team: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <label data-testid="self-registration-label" className="flex items-center space-x-2">
              <input
                data-testid="self-registration-checkbox"
                type="checkbox"
                checked={state.gameData.self_registration_enabled ?? true}
                onChange={(e) => updateData({ self_registration_enabled: e.target.checked })}
              />
              <span>Allow Self Registration</span>
            </label>
          </div>
        );

      case 'review':
        return (
          <div data-testid="review-step" className="space-y-4">
            <h2 className="text-xl font-semibold">Review Game Configuration</h2>
            <div data-testid="game-summary" className="space-y-2 p-4 bg-muted rounded-lg">
              <p><strong>Title:</strong> {state.gameData.title || 'Untitled Game'}</p>
              <p><strong>Location:</strong> {state.gameData.location || 'No location set'}</p>
              <p><strong>Rounds:</strong> {state.gameData.total_rounds || 3}</p>
              <p><strong>Questions per Round:</strong> {state.gameData.questions_per_round || 10}</p>
              <p><strong>Max Teams:</strong> {state.gameData.max_teams || 6}</p>
              <p><strong>Categories:</strong> {state.gameData.selected_categories?.join(', ') || 'None selected'}</p>
              <p><strong>Self Registration:</strong> {state.gameData.self_registration_enabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div data-testid="game-wizard" className="max-w-4xl mx-auto">
      {/* Header */}
      <header data-testid="wizard-header" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Game' : 'Create New Game'}
            </h1>
            {gameId && <p className="text-muted-foreground">Game ID: {gameId}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div data-testid="step-indicator" className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Step {state.currentStep + 1} of {WIZARD_STEPS.length}: {currentStepData.title}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <Badge
                  variant={index <= state.currentStep ? 'default' : 'secondary'}
                  className="mb-1"
                >
                  {index + 1}
                </Badge>
                <span className="text-xs text-center">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <p className="text-muted-foreground">{currentStepData.description}</p>
        </CardHeader>
        <CardContent data-testid="wizard-content">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Footer */}
      <footer data-testid="wizard-footer" className="mt-6">
        <div data-testid="navigation-buttons" className="flex justify-between">
          <div>
            {canGoBack && (
              <Button data-testid="back-button" variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button data-testid="cancel-button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>

            {isLastStep ? (
              <Button
                data-testid="complete-button"
                onClick={handleComplete}
                disabled={!canGoNext}
              >
                {isEditing ? 'Update Game' : 'Create Game'}
              </Button>
            ) : (
              <Button
                data-testid="next-button"
                onClick={handleNext}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
});

export default GameWizard;
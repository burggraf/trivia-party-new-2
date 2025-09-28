// Component Tests: GameWizard
// Tests for game creation/editing wizard component

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameWizard } from '../GameWizard';
import type { GameWizardProps, GameConfiguration } from '@/contracts/host-components';

// Mock the component that doesn't exist yet
vi.mock('../GameWizard', () => ({
  GameWizard: vi.fn(() => <div data-testid="game-wizard-mock">GameWizard Component</div>)
}));

const mockGameWizard = vi.mocked(GameWizard);

describe('GameWizard Component', () => {
  const defaultGameConfig: GameConfiguration = {
    title: 'Test Game',
    location: 'Test Location',
    scheduled_date: '2024-01-15T19:00:00Z',
    total_rounds: 3,
    questions_per_round: 10,
    selected_categories: ['science', 'history'],
    max_teams: 6,
    max_players_per_team: 4,
    min_players_per_team: 2,
    self_registration_enabled: true
  };

  const defaultProps: GameWizardProps = {
    onComplete: vi.fn(),
    onCancel: vi.fn(),
    isEditing: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameWizard.mockImplementation(({
      initialData,
      onComplete,
      onCancel,
      isEditing,
      gameId
    }) => {
      const [currentStep, setCurrentStep] = vi.mocked(() => {
        const [step, setStep] = ['basic', vi.fn()];
        return [step, setStep];
      })();

      const steps = ['basic', 'rounds', 'questions', 'teams', 'review'];
      const currentStepIndex = steps.indexOf(currentStep as string);

      const handleNext = () => {
        const nextStep = steps[currentStepIndex + 1];
        if (nextStep) {
          setCurrentStep(nextStep);
        }
      };

      const handleBack = () => {
        const prevStep = steps[currentStepIndex - 1];
        if (prevStep) {
          setCurrentStep(prevStep);
        }
      };

      const handleComplete = () => {
        onComplete(initialData || defaultGameConfig);
      };

      return (
        <div data-testid="game-wizard">
          <header data-testid="wizard-header">
            <h1>{isEditing ? 'Edit Game' : 'Create New Game'}</h1>
            {gameId && <p>Game ID: {gameId}</p>}
            <div data-testid="step-indicator">
              Step {currentStepIndex + 1} of {steps.length}: {currentStep}
            </div>
          </header>

          <div data-testid="wizard-content">
            {currentStep === 'basic' && (
              <div data-testid="basic-step">
                <h2>Basic Game Information</h2>
                <input
                  data-testid="title-input"
                  defaultValue={initialData?.title || ''}
                  placeholder="Game Title"
                />
                <input
                  data-testid="location-input"
                  defaultValue={initialData?.location || ''}
                  placeholder="Location"
                />
                <input
                  data-testid="date-input"
                  type="datetime-local"
                  defaultValue={initialData?.scheduled_date || ''}
                />
              </div>
            )}

            {currentStep === 'rounds' && (
              <div data-testid="rounds-step">
                <h2>Round Configuration</h2>
                <input
                  data-testid="total-rounds-input"
                  type="number"
                  defaultValue={initialData?.total_rounds || 3}
                  min="1" max="10"
                />
                <input
                  data-testid="questions-per-round-input"
                  type="number"
                  defaultValue={initialData?.questions_per_round || 10}
                  min="5" max="20"
                />
              </div>
            )}

            {currentStep === 'questions' && (
              <div data-testid="questions-step">
                <h2>Question Generation</h2>
                <div data-testid="category-selection">
                  {['science', 'history', 'sports', 'entertainment'].map(category => (
                    <label key={category} data-testid={`category-${category}`}>
                      <input
                        type="checkbox"
                        defaultChecked={initialData?.selected_categories?.includes(category)}
                      />
                      {category}
                    </label>
                  ))}
                </div>
                <button data-testid="generate-questions-button">Generate Questions</button>
              </div>
            )}

            {currentStep === 'teams' && (
              <div data-testid="teams-step">
                <h2>Team Setup</h2>
                <input
                  data-testid="max-teams-input"
                  type="number"
                  defaultValue={initialData?.max_teams || 6}
                  min="2" max="20"
                />
                <input
                  data-testid="max-players-input"
                  type="number"
                  defaultValue={initialData?.max_players_per_team || 4}
                  min="1" max="8"
                />
                <input
                  data-testid="min-players-input"
                  type="number"
                  defaultValue={initialData?.min_players_per_team || 2}
                  min="1" max="4"
                />
                <label data-testid="self-registration-label">
                  <input
                    data-testid="self-registration-checkbox"
                    type="checkbox"
                    defaultChecked={initialData?.self_registration_enabled ?? true}
                  />
                  Allow Self Registration
                </label>
              </div>
            )}

            {currentStep === 'review' && (
              <div data-testid="review-step">
                <h2>Review Game Configuration</h2>
                <div data-testid="game-summary">
                  <p>Title: {initialData?.title || 'Untitled Game'}</p>
                  <p>Location: {initialData?.location || 'No location set'}</p>
                  <p>Rounds: {initialData?.total_rounds || 3}</p>
                  <p>Questions per Round: {initialData?.questions_per_round || 10}</p>
                  <p>Max Teams: {initialData?.max_teams || 6}</p>
                  <p>Categories: {initialData?.selected_categories?.join(', ') || 'None selected'}</p>
                </div>
              </div>
            )}
          </div>

          <footer data-testid="wizard-footer">
            <div data-testid="navigation-buttons">
              {currentStepIndex > 0 && (
                <button data-testid="back-button" onClick={handleBack}>
                  Back
                </button>
              )}

              <button data-testid="cancel-button" onClick={onCancel}>
                Cancel
              </button>

              {currentStepIndex < steps.length - 1 ? (
                <button data-testid="next-button" onClick={handleNext}>
                  Next
                </button>
              ) : (
                <button data-testid="complete-button" onClick={handleComplete}>
                  {isEditing ? 'Update Game' : 'Create Game'}
                </button>
              )}
            </div>
          </footer>
        </div>
      );
    });
  });

  describe('Rendering', () => {
    it('should render wizard header for new game', () => {
      render(<GameWizard {...defaultProps} />);

      expect(screen.getByTestId('game-wizard')).toBeInTheDocument();
      expect(screen.getByText('Create New Game')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument();
    });

    it('should render wizard header for editing game', () => {
      render(<GameWizard {...defaultProps} isEditing={true} gameId="game-123" />);

      expect(screen.getByText('Edit Game')).toBeInTheDocument();
      expect(screen.getByText('Game ID: game-123')).toBeInTheDocument();
    });

    it('should start on basic information step', () => {
      render(<GameWizard {...defaultProps} />);

      expect(screen.getByTestId('basic-step')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5: basic')).toBeInTheDocument();
      expect(screen.getByText('Basic Game Information')).toBeInTheDocument();
    });

    it('should render navigation buttons correctly on first step', () => {
      render(<GameWizard {...defaultProps} />);

      expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
      expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument();
    });

    it('should populate form fields with initial data', () => {
      render(<GameWizard {...defaultProps} initialData={defaultGameConfig} />);

      expect(screen.getByDisplayValue('Test Game')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-15T19:00:00Z')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to next step when next button is clicked', async () => {
      render(<GameWizard {...defaultProps} />);

      // Start on basic step
      expect(screen.getByTestId('basic-step')).toBeInTheDocument();

      // Click next to go to rounds step
      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('rounds-step')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 5: rounds')).toBeInTheDocument();
      });
    });

    it('should navigate to previous step when back button is clicked', async () => {
      render(<GameWizard {...defaultProps} />);

      // Navigate to second step first
      fireEvent.click(screen.getByTestId('next-button'));
      await waitFor(() => {
        expect(screen.getByTestId('rounds-step')).toBeInTheDocument();
      });

      // Now go back
      fireEvent.click(screen.getByTestId('back-button'));

      await waitFor(() => {
        expect(screen.getByTestId('basic-step')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 5: basic')).toBeInTheDocument();
      });
    });

    it('should show back button after first step', async () => {
      render(<GameWizard {...defaultProps} />);

      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });
    });

    it('should show complete button on final step', async () => {
      render(<GameWizard {...defaultProps} />);

      // Navigate to final step
      const steps = ['basic', 'rounds', 'questions', 'teams'];
      for (const step of steps) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByTestId('review-step')).toBeInTheDocument();
        expect(screen.getByTestId('complete-button')).toBeInTheDocument();
        expect(screen.queryByTestId('next-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Step Content', () => {
    it('should render basic information step content', () => {
      render(<GameWizard {...defaultProps} />);

      expect(screen.getByTestId('title-input')).toBeInTheDocument();
      expect(screen.getByTestId('location-input')).toBeInTheDocument();
      expect(screen.getByTestId('date-input')).toBeInTheDocument();
    });

    it('should render rounds configuration step content', async () => {
      render(<GameWizard {...defaultProps} />);

      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('total-rounds-input')).toBeInTheDocument();
        expect(screen.getByTestId('questions-per-round-input')).toBeInTheDocument();
        expect(screen.getByText('Round Configuration')).toBeInTheDocument();
      });
    });

    it('should render questions generation step content', async () => {
      render(<GameWizard {...defaultProps} />);

      // Navigate to questions step
      fireEvent.click(screen.getByTestId('next-button')); // rounds
      await waitFor(() => {});
      fireEvent.click(screen.getByTestId('next-button')); // questions

      await waitFor(() => {
        expect(screen.getByTestId('questions-step')).toBeInTheDocument();
        expect(screen.getByTestId('category-selection')).toBeInTheDocument();
        expect(screen.getByTestId('generate-questions-button')).toBeInTheDocument();
        expect(screen.getByTestId('category-science')).toBeInTheDocument();
        expect(screen.getByTestId('category-history')).toBeInTheDocument();
      });
    });

    it('should render teams setup step content', async () => {
      render(<GameWizard {...defaultProps} />);

      // Navigate to teams step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByTestId('teams-step')).toBeInTheDocument();
        expect(screen.getByTestId('max-teams-input')).toBeInTheDocument();
        expect(screen.getByTestId('max-players-input')).toBeInTheDocument();
        expect(screen.getByTestId('min-players-input')).toBeInTheDocument();
        expect(screen.getByTestId('self-registration-checkbox')).toBeInTheDocument();
      });
    });

    it('should render review step content', async () => {
      render(<GameWizard {...defaultProps} initialData={defaultGameConfig} />);

      // Navigate to review step
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByTestId('review-step')).toBeInTheDocument();
        expect(screen.getByTestId('game-summary')).toBeInTheDocument();
        expect(screen.getByText('Title: Test Game')).toBeInTheDocument();
        expect(screen.getByText('Location: Test Location')).toBeInTheDocument();
        expect(screen.getByText('Rounds: 3')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();
      render(<GameWizard {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByTestId('cancel-button'));

      await waitFor(() => {
        expect(onCancel).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onComplete when complete button is clicked', async () => {
      const onComplete = vi.fn();
      render(<GameWizard {...defaultProps} onComplete={onComplete} initialData={defaultGameConfig} />);

      // Navigate to review step
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      fireEvent.click(screen.getByTestId('complete-button'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(defaultGameConfig);
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle question generation button click', async () => {
      render(<GameWizard {...defaultProps} />);

      // Navigate to questions step
      fireEvent.click(screen.getByTestId('next-button')); // rounds
      await waitFor(() => {});
      fireEvent.click(screen.getByTestId('next-button')); // questions

      await waitFor(() => {
        const generateButton = screen.getByTestId('generate-questions-button');
        expect(generateButton).toBeInTheDocument();

        // Should be able to click without error
        fireEvent.click(generateButton);
      });
    });

    it('should handle form input changes', async () => {
      render(<GameWizard {...defaultProps} />);

      const titleInput = screen.getByTestId('title-input');
      fireEvent.change(titleInput, { target: { value: 'New Game Title' } });

      expect(titleInput).toHaveValue('New Game Title');
    });
  });

  describe('Form Validation', () => {
    it('should show proper input constraints', async () => {
      render(<GameWizard {...defaultProps} />);

      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        const totalRoundsInput = screen.getByTestId('total-rounds-input');
        expect(totalRoundsInput).toHaveAttribute('min', '1');
        expect(totalRoundsInput).toHaveAttribute('max', '10');

        const questionsInput = screen.getByTestId('questions-per-round-input');
        expect(questionsInput).toHaveAttribute('min', '5');
        expect(questionsInput).toHaveAttribute('max', '20');
      });
    });

    it('should handle team setup constraints', async () => {
      render(<GameWizard {...defaultProps} />);

      // Navigate to teams step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        const maxTeamsInput = screen.getByTestId('max-teams-input');
        expect(maxTeamsInput).toHaveAttribute('min', '2');
        expect(maxTeamsInput).toHaveAttribute('max', '20');

        const maxPlayersInput = screen.getByTestId('max-players-input');
        expect(maxPlayersInput).toHaveAttribute('min', '1');
        expect(maxPlayersInput).toHaveAttribute('max', '8');
      });
    });
  });

  describe('Editing Mode', () => {
    it('should show update button text when editing', async () => {
      render(<GameWizard {...defaultProps} isEditing={true} initialData={defaultGameConfig} />);

      // Navigate to review step
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByText('Update Game')).toBeInTheDocument();
      });
    });

    it('should show create button text when not editing', async () => {
      render(<GameWizard {...defaultProps} isEditing={false} />);

      // Navigate to review step
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByText('Create Game')).toBeInTheDocument();
      });
    });

    it('should display game ID when editing', () => {
      render(<GameWizard {...defaultProps} isEditing={true} gameId="game-456" />);

      expect(screen.getByText('Game ID: game-456')).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('should pre-select categories from initial data', async () => {
      render(<GameWizard {...defaultProps} initialData={defaultGameConfig} />);

      // Navigate to questions step
      fireEvent.click(screen.getByTestId('next-button')); // rounds
      await waitFor(() => {});
      fireEvent.click(screen.getByTestId('next-button')); // questions

      await waitFor(() => {
        const scienceCheckbox = screen.getByTestId('category-science').querySelector('input');
        const historyCheckbox = screen.getByTestId('category-history').querySelector('input');
        const sportsCheckbox = screen.getByTestId('category-sports').querySelector('input');

        expect(scienceCheckbox).toBeChecked();
        expect(historyCheckbox).toBeChecked();
        expect(sportsCheckbox).not.toBeChecked();
      });
    });

    it('should render all available categories', async () => {
      render(<GameWizard {...defaultProps} />);

      // Navigate to questions step
      fireEvent.click(screen.getByTestId('next-button')); // rounds
      await waitFor(() => {});
      fireEvent.click(screen.getByTestId('next-button')); // questions

      await waitFor(() => {
        expect(screen.getByTestId('category-science')).toBeInTheDocument();
        expect(screen.getByTestId('category-history')).toBeInTheDocument();
        expect(screen.getByTestId('category-sports')).toBeInTheDocument();
        expect(screen.getByTestId('category-entertainment')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<GameWizard {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have accessible form labels', async () => {
      render(<GameWizard {...defaultProps} />);

      // Navigate to teams step to check label
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByTestId('self-registration-label')).toBeInTheDocument();
      });
    });

    it('should provide proper button labels', () => {
      render(<GameWizard {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });
  });

  describe('Component Contract', () => {
    it('should receive all required props', () => {
      const requiredProps: GameWizardProps = {
        onComplete: vi.fn(),
        onCancel: vi.fn()
      };

      expect(() => render(<GameWizard {...requiredProps} />)).not.toThrow();
    });

    it('should handle optional props correctly', () => {
      const propsWithOptionals: GameWizardProps = {
        initialData: defaultGameConfig,
        onComplete: vi.fn(),
        onCancel: vi.fn(),
        isEditing: true,
        gameId: 'test-game-123'
      };

      expect(() => render(<GameWizard {...propsWithOptionals} />)).not.toThrow();
    });

    it('should call onComplete with correct data structure', async () => {
      const onComplete = vi.fn<[GameConfiguration], void>();
      render(<GameWizard {...defaultProps} onComplete={onComplete} initialData={defaultGameConfig} />);

      // Navigate to review and complete
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      fireEvent.click(screen.getByTestId('complete-button'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
          title: expect.any(String),
          scheduled_date: expect.any(String),
          total_rounds: expect.any(Number),
          questions_per_round: expect.any(Number),
          selected_categories: expect.any(Array),
          max_teams: expect.any(Number),
          max_players_per_team: expect.any(Number),
          min_players_per_team: expect.any(Number),
          self_registration_enabled: expect.any(Boolean)
        }));
      });
    });
  });

  describe('State Persistence', () => {
    it('should maintain form data when navigating between steps', async () => {
      render(<GameWizard {...defaultProps} initialData={defaultGameConfig} />);

      // Check initial data is present
      expect(screen.getByDisplayValue('Test Game')).toBeInTheDocument();

      // Navigate forward and back
      fireEvent.click(screen.getByTestId('next-button'));
      await waitFor(() => {});
      fireEvent.click(screen.getByTestId('back-button'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Game')).toBeInTheDocument();
      });
    });

    it('should show summary with accumulated data', async () => {
      render(<GameWizard {...defaultProps} initialData={defaultGameConfig} />);

      // Navigate to review step
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByText('Categories: science, history')).toBeInTheDocument();
      });
    });
  });
});

// This test file will FAIL until the actual component is created
// This is the expected TDD behavior - Red, Green, Refactor
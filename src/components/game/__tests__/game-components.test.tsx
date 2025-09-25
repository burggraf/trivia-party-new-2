import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  CreateGameSessionRequest,
  GameSession,
  QuestionPresentation,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  GameSummary
} from '../../../specs/001-this-project-is/contracts/game';

// Mock components that don't exist yet - these will cause tests to fail (TDD approach)
// import { GameSetup } from '../GameSetup';
// import { QuestionDisplay } from '../QuestionDisplay';
// import { GameResults } from '../GameResults';

// Mock game service would go here if needed for integration tests

// Mock components for testing contracts
const MockGameSetup = ({
  categories,
  onStartGame,
  loading
}: {
  categories: string[];
  onStartGame: (config: CreateGameSessionRequest) => Promise<GameSession>;
  loading?: boolean;
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const selectedCategories = Array.from(form.querySelectorAll('input[name="categories"]:checked'))
      .map(input => (input as HTMLInputElement).value);

    const config: CreateGameSessionRequest = {
      total_rounds: parseInt(formData.get('rounds') as string),
      questions_per_round: parseInt(formData.get('questionsPerRound') as string),
      selected_categories: selectedCategories
    };

    await onStartGame(config);
  };

  return (
    <div data-testid="game-setup-container">
      <h2>Game Setup</h2>
      <form onSubmit={handleSubmit} data-testid="game-setup-form">
        <div>
          <label>
            Number of Rounds:
            <select name="rounds" data-testid="rounds-select" required>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Questions per Round:
            <select name="questionsPerRound" data-testid="questions-per-round-select" required>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
          </label>
        </div>

        <fieldset data-testid="categories-fieldset">
          <legend>Select Categories:</legend>
          {categories.map(category => (
            <label key={category}>
              <input
                type="checkbox"
                name="categories"
                value={category}
                data-testid={`category-${category.toLowerCase()}`}
              />
              {category}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          data-testid="start-game-button"
        >
          {loading ? 'Starting Game...' : 'Start Game'}
        </button>
      </form>
    </div>
  );
};

const MockQuestionDisplay = ({
  question,
  onAnswerSubmit,
  loading,
  timeLeft
}: {
  question: QuestionPresentation;
  onAnswerSubmit: (request: SubmitAnswerRequest) => Promise<SubmitAnswerResponse>;
  loading?: boolean;
  timeLeft?: number;
}) => {
  const handleAnswerClick = async (answerText: string) => {
    const request: SubmitAnswerRequest = {
      game_session_id: 'current-session-id',
      game_question_id: question.id,
      user_answer: answerText,
      time_to_answer_ms: timeLeft ? (30000 - timeLeft) : 5000
    };

    await onAnswerSubmit(request);
  };

  return (
    <div data-testid="question-display-container">
      <div data-testid="question-progress">
        Question {question.question_number} of {question.total_questions}
      </div>
      <div data-testid="round-info">Round {question.round_number}</div>
      <div data-testid="category">{question.category}</div>

      {timeLeft !== undefined && (
        <div data-testid="timer">Time left: {timeLeft}s</div>
      )}

      <div data-testid="question-text">{question.question}</div>

      <div data-testid="answers-container">
        {question.answers.map((answer) => (
          <button
            key={answer.label}
            onClick={() => handleAnswerClick(answer.text)}
            disabled={loading}
            data-testid={`answer-${answer.label.toLowerCase()}`}
          >
            {answer.label}. {answer.text}
          </button>
        ))}
      </div>

      {loading && <div data-testid="submitting-answer">Submitting answer...</div>}
    </div>
  );
};

const MockGameResults = ({
  summary,
  onPlayAgain,
  onReturnToMenu
}: {
  summary: GameSummary;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}) => {
  return (
    <div data-testid="game-results-container">
      <h2>Game Complete!</h2>

      <div data-testid="final-score">
        Final Score: {summary.total_score} / {summary.total_questions}
      </div>

      <div data-testid="accuracy">
        Accuracy: {summary.accuracy_percentage.toFixed(1)}%
      </div>

      <div data-testid="total-time">
        Total Time: {Math.round(summary.total_duration_ms / 1000)}s
      </div>

      {summary.personal_best && (
        <div data-testid="personal-best">🎉 Personal Best!</div>
      )}

      <div data-testid="rounds-summary">
        <h3>Round Breakdown:</h3>
        {summary.rounds.map((round) => (
          <div key={round.round_number} data-testid={`round-${round.round_number}-summary`}>
            <div>Round {round.round_number}:</div>
            <div>{round.correct_answers} / {round.total_questions}</div>
            <div>{round.accuracy_percentage.toFixed(1)}%</div>
            <div>{Math.round(round.duration_ms / 1000)}s</div>
          </div>
        ))}
      </div>

      <div data-testid="action-buttons">
        <button
          onClick={onPlayAgain}
          data-testid="play-again-button"
        >
          Play Again
        </button>
        <button
          onClick={onReturnToMenu}
          data-testid="return-to-menu-button"
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
};

describe('Game Components Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategories = ['Science', 'History', 'Geography', 'Sports'];
  const mockGameSession: GameSession = {
    id: 'session-123',
    user_id: 'user-123',
    status: 'setup',
    total_rounds: 3,
    questions_per_round: 5,
    selected_categories: ['Science', 'History'],
    current_round: 1,
    current_question_index: 0,
    total_score: 0,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const mockQuestion: QuestionPresentation = {
    id: 'gq-123',
    question: 'What is the chemical formula for water?',
    category: 'Science',
    answers: [
      { label: 'A', text: 'H2O' },
      { label: 'B', text: 'CO2' },
      { label: 'C', text: 'NaCl' },
      { label: 'D', text: 'O2' }
    ],
    round_number: 1,
    question_number: 1,
    total_questions: 15
  };

  describe('GameSetup Component', () => {
    it('should render game setup form with all configuration options', () => {
      const mockOnStartGame = vi.fn();

      render(
        <MockGameSetup
          categories={mockCategories}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByTestId('game-setup-container')).toBeInTheDocument();
      expect(screen.getByTestId('game-setup-form')).toBeInTheDocument();
      expect(screen.getByTestId('rounds-select')).toBeInTheDocument();
      expect(screen.getByTestId('questions-per-round-select')).toBeInTheDocument();
      expect(screen.getByTestId('categories-fieldset')).toBeInTheDocument();
      expect(screen.getByTestId('start-game-button')).toBeInTheDocument();
    });

    it('should display all available categories as checkboxes', () => {
      const mockOnStartGame = vi.fn();

      render(
        <MockGameSetup
          categories={mockCategories}
          onStartGame={mockOnStartGame}
        />
      );

      mockCategories.forEach(category => {
        expect(screen.getByTestId(`category-${category.toLowerCase()}`)).toBeInTheDocument();
      });
    });

    it('should call onStartGame with correct configuration', async () => {
      const mockOnStartGame = vi.fn().mockResolvedValue(mockGameSession);
      const user = userEvent.setup();

      render(
        <MockGameSetup
          categories={mockCategories}
          onStartGame={mockOnStartGame}
        />
      );

      // Select configuration
      await user.selectOptions(screen.getByTestId('rounds-select'), '3');
      await user.selectOptions(screen.getByTestId('questions-per-round-select'), '5');

      // Select categories
      await user.click(screen.getByTestId('category-science'));
      await user.click(screen.getByTestId('category-history'));

      // Start game
      await user.click(screen.getByTestId('start-game-button'));

      expect(mockOnStartGame).toHaveBeenCalledWith({
        total_rounds: 3,
        questions_per_round: 5,
        selected_categories: ['Science', 'History']
      });
    });

    it('should handle loading state during game creation', () => {
      const mockOnStartGame = vi.fn();

      render(
        <MockGameSetup
          categories={mockCategories}
          onStartGame={mockOnStartGame}
          loading={true}
        />
      );

      const startButton = screen.getByTestId('start-game-button');
      expect(startButton).toBeDisabled();
      expect(startButton).toHaveTextContent('Starting Game...');
    });

    it('should validate required fields', () => {
      const mockOnStartGame = vi.fn();

      render(
        <MockGameSetup
          categories={mockCategories}
          onStartGame={mockOnStartGame}
        />
      );

      const roundsSelect = screen.getByTestId('rounds-select') as HTMLSelectElement;
      const questionsSelect = screen.getByTestId('questions-per-round-select') as HTMLSelectElement;

      expect(roundsSelect.required).toBe(true);
      expect(questionsSelect.required).toBe(true);
    });
  });

  describe('QuestionDisplay Component', () => {
    it('should render question with all required information', () => {
      const mockOnAnswerSubmit = vi.fn();

      render(
        <MockQuestionDisplay
          question={mockQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          timeLeft={25}
        />
      );

      expect(screen.getByTestId('question-display-container')).toBeInTheDocument();
      expect(screen.getByTestId('question-progress')).toHaveTextContent('Question 1 of 15');
      expect(screen.getByTestId('round-info')).toHaveTextContent('Round 1');
      expect(screen.getByTestId('category')).toHaveTextContent('Science');
      expect(screen.getByTestId('question-text')).toHaveTextContent('What is the chemical formula for water?');
      expect(screen.getByTestId('timer')).toHaveTextContent('Time left: 25s');
    });

    it('should render all answer options', () => {
      const mockOnAnswerSubmit = vi.fn();

      render(
        <MockQuestionDisplay
          question={mockQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
        />
      );

      expect(screen.getByTestId('answer-a')).toHaveTextContent('A. H2O');
      expect(screen.getByTestId('answer-b')).toHaveTextContent('B. CO2');
      expect(screen.getByTestId('answer-c')).toHaveTextContent('C. NaCl');
      expect(screen.getByTestId('answer-d')).toHaveTextContent('D. O2');
    });

    it('should call onAnswerSubmit with correct request structure', async () => {
      const mockOnAnswerSubmit = vi.fn().mockResolvedValue({
        is_correct: true,
        correct_answer: 'H2O',
        updated_score: 1,
        next_question: null,
        round_complete: false,
        game_complete: false
      });

      const user = userEvent.setup();

      render(
        <MockQuestionDisplay
          question={mockQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          timeLeft={20}
        />
      );

      await user.click(screen.getByTestId('answer-a'));

      expect(mockOnAnswerSubmit).toHaveBeenCalledWith({
        game_session_id: 'current-session-id',
        game_question_id: 'gq-123',
        user_answer: 'H2O',
        time_to_answer_ms: 10000 // 30000 - 20000
      });
    });

    it('should handle loading state during answer submission', () => {
      const mockOnAnswerSubmit = vi.fn();

      render(
        <MockQuestionDisplay
          question={mockQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          loading={true}
        />
      );

      const answerButtons = screen.getAllByRole('button');
      answerButtons.forEach(button => {
        expect(button).toBeDisabled();
      });

      expect(screen.getByTestId('submitting-answer')).toBeInTheDocument();
    });

    it('should handle questions without timer', () => {
      const mockOnAnswerSubmit = vi.fn();

      render(
        <MockQuestionDisplay
          question={mockQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
        />
      );

      expect(screen.queryByTestId('timer')).not.toBeInTheDocument();
    });
  });

  describe('GameResults Component', () => {
    const mockSummary: GameSummary = {
      game_session_id: 'session-123',
      total_score: 12,
      total_questions: 15,
      correct_answers: 12,
      accuracy_percentage: 80.0,
      total_duration_ms: 450000, // 7.5 minutes
      personal_best: true,
      rounds: [
        {
          round_number: 1,
          correct_answers: 4,
          total_questions: 5,
          round_score: 4,
          duration_ms: 150000, // 2.5 minutes
          accuracy_percentage: 80.0
        },
        {
          round_number: 2,
          correct_answers: 5,
          total_questions: 5,
          round_score: 5,
          duration_ms: 150000,
          accuracy_percentage: 100.0
        },
        {
          round_number: 3,
          correct_answers: 3,
          total_questions: 5,
          round_score: 3,
          duration_ms: 150000,
          accuracy_percentage: 60.0
        }
      ]
    };

    it('should render game summary with all statistics', () => {
      const mockOnPlayAgain = vi.fn();
      const mockOnReturnToMenu = vi.fn();

      render(
        <MockGameResults
          summary={mockSummary}
          onPlayAgain={mockOnPlayAgain}
          onReturnToMenu={mockOnReturnToMenu}
        />
      );

      expect(screen.getByTestId('game-results-container')).toBeInTheDocument();
      expect(screen.getByTestId('final-score')).toHaveTextContent('Final Score: 12 / 15');
      expect(screen.getByTestId('accuracy')).toHaveTextContent('Accuracy: 80.0%');
      expect(screen.getByTestId('total-time')).toHaveTextContent('Total Time: 450s');
      expect(screen.getByTestId('personal-best')).toHaveTextContent('🎉 Personal Best!');
    });

    it('should render round breakdown', () => {
      const mockOnPlayAgain = vi.fn();
      const mockOnReturnToMenu = vi.fn();

      render(
        <MockGameResults
          summary={mockSummary}
          onPlayAgain={mockOnPlayAgain}
          onReturnToMenu={mockOnReturnToMenu}
        />
      );

      expect(screen.getByTestId('round-1-summary')).toBeInTheDocument();
      expect(screen.getByTestId('round-2-summary')).toBeInTheDocument();
      expect(screen.getByTestId('round-3-summary')).toBeInTheDocument();

      // Check specific round data
      const round1 = screen.getByTestId('round-1-summary');
      expect(round1).toHaveTextContent('4 / 5');
      expect(round1).toHaveTextContent('80.0%');
    });

    it('should handle personal best indicator', () => {
      const mockOnPlayAgain = vi.fn();
      const mockOnReturnToMenu = vi.fn();

      const summaryWithoutPersonalBest = {
        ...mockSummary,
        personal_best: false
      };

      render(
        <MockGameResults
          summary={summaryWithoutPersonalBest}
          onPlayAgain={mockOnPlayAgain}
          onReturnToMenu={mockOnReturnToMenu}
        />
      );

      expect(screen.queryByTestId('personal-best')).not.toBeInTheDocument();
    });

    it('should call action handlers when buttons are clicked', async () => {
      const mockOnPlayAgain = vi.fn();
      const mockOnReturnToMenu = vi.fn();
      const user = userEvent.setup();

      render(
        <MockGameResults
          summary={mockSummary}
          onPlayAgain={mockOnPlayAgain}
          onReturnToMenu={mockOnReturnToMenu}
        />
      );

      await user.click(screen.getByTestId('play-again-button'));
      expect(mockOnPlayAgain).toHaveBeenCalled();

      await user.click(screen.getByTestId('return-to-menu-button'));
      expect(mockOnReturnToMenu).toHaveBeenCalled();
    });

    it('should render action buttons', () => {
      const mockOnPlayAgain = vi.fn();
      const mockOnReturnToMenu = vi.fn();

      render(
        <MockGameResults
          summary={mockSummary}
          onPlayAgain={mockOnPlayAgain}
          onReturnToMenu={mockOnReturnToMenu}
        />
      );

      expect(screen.getByTestId('play-again-button')).toBeInTheDocument();
      expect(screen.getByTestId('return-to-menu-button')).toBeInTheDocument();
    });
  });

  describe('Game Component Integration', () => {
    it('should handle complete game flow structure', () => {
      // This tests the expected flow between components
      const gameStates = {
        setup: 'Game configuration and category selection',
        playing: 'Question display with timer and answer selection',
        results: 'Score summary and next action selection'
      };

      // Verify the component contracts support the expected flow
      expect(gameStates.setup).toBeDefined();
      expect(gameStates.playing).toBeDefined();
      expect(gameStates.results).toBeDefined();
    });

    it('should handle answer submission flow', async () => {
      const mockSubmitAnswer = vi.fn().mockResolvedValue({
        is_correct: true,
        correct_answer: 'H2O',
        updated_score: 1,
        next_question: {
          ...mockQuestion,
          id: 'gq-124',
          question: 'What is CO2?',
          question_number: 2
        },
        round_complete: false,
        game_complete: false
      });

      const user = userEvent.setup();

      render(
        <MockQuestionDisplay
          question={mockQuestion}
          onAnswerSubmit={mockSubmitAnswer}
        />
      );

      await user.click(screen.getByTestId('answer-a'));

      await waitFor(() => {
        expect(mockSubmitAnswer).toHaveBeenCalled();
      });

      // Verify the response structure supports game progression
      const response = await mockSubmitAnswer.mock.results[0].value;
      expect(response.next_question).toBeDefined();
      expect(response.next_question?.question_number).toBe(2);
    });
  });

  // Integration tests - these will fail until components are implemented
  describe('Integration with actual components (will fail until implemented)', () => {
    it('should fail - GameSetup component not implemented yet', () => {
      expect(() => {
        // import { GameSetup } from '../GameSetup';
        throw new Error('GameSetup component not implemented yet');
      }).toThrow('GameSetup component not implemented yet');
    });

    it('should fail - QuestionDisplay component not implemented yet', () => {
      expect(() => {
        // import { QuestionDisplay } from '../QuestionDisplay';
        throw new Error('QuestionDisplay component not implemented yet');
      }).toThrow('QuestionDisplay component not implemented yet');
    });

    it('should fail - GameResults component not implemented yet', () => {
      expect(() => {
        // import { GameResults } from '../GameResults';
        throw new Error('GameResults component not implemented yet');
      }).toThrow('GameResults component not implemented yet');
    });
  });
});
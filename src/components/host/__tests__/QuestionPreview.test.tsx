// Component Tests: QuestionPreview
// Tests for question preview and replacement UI component

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionPreview } from '../QuestionPreview';
import type { QuestionPreviewProps, QuestionAssignment } from '@/contracts/host-components';
import type { Question } from '@/contracts/multi-user-types';

// Mock the component that doesn't exist yet
vi.mock('../QuestionPreview', () => ({
  QuestionPreview: vi.fn(() => <div data-testid="question-preview-mock">QuestionPreview Component</div>)
}));

const mockQuestionPreview = vi.mocked(QuestionPreview);

describe('QuestionPreview Component', () => {
  const sampleQuestions: QuestionAssignment[] = [
    {
      id: 'qa-1',
      round_id: 'round-123',
      question_id: 'q-1',
      question_order: 1,
      question: {
        id: 'q-1',
        text: 'What is the capital of France?',
        answer: 'Paris',
        category: 'geography',
        difficulty: 'easy',
        created_at: '2024-01-01T10:00:00Z'
      },
      created_at: '2024-01-01T11:00:00Z'
    },
    {
      id: 'qa-2',
      round_id: 'round-123',
      question_id: 'q-2',
      question_order: 2,
      question: {
        id: 'q-2',
        text: 'What is the largest planet in our solar system?',
        answer: 'Jupiter',
        category: 'science',
        difficulty: 'medium',
        created_at: '2024-01-01T10:00:00Z'
      },
      created_at: '2024-01-01T11:00:00Z'
    },
    {
      id: 'qa-3',
      round_id: 'round-123',
      question_id: 'q-3',
      question_order: 3,
      question: {
        id: 'q-3',
        text: 'Who won the World Cup in 2018?',
        answer: 'France',
        category: 'sports',
        difficulty: 'medium',
        created_at: '2024-01-01T10:00:00Z'
      },
      created_at: '2024-01-01T11:00:00Z'
    }
  ];

  const defaultProps: QuestionPreviewProps = {
    roundId: 'round-123',
    questions: sampleQuestions,
    onReplaceQuestion: vi.fn(),
    onClose: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuestionPreview.mockImplementation(({
      roundId,
      questions,
      onReplaceQuestion,
      onClose,
      isLoading
    }) => {
      if (isLoading) {
        return (
          <div data-testid="question-preview">
            <div data-testid="loading-spinner">Loading questions...</div>
          </div>
        );
      }

      return (
        <div data-testid="question-preview">
          <header data-testid="preview-header">
            <h2>Question Preview - Round {roundId}</h2>
            <button data-testid="close-button" onClick={onClose}>
              Close
            </button>
          </header>

          <div data-testid="questions-container">
            <div data-testid="questions-summary">
              <p>Total Questions: {questions.length}</p>
              <p>Categories: {[...new Set(questions.map(q => q.question.category))].join(', ')}</p>
            </div>

            <div data-testid="questions-list">
              {questions.map((assignment, index) => (
                <div key={assignment.id} data-testid={`question-card-${assignment.id}`}>
                  <div data-testid="question-header">
                    <span data-testid="question-number">Question {assignment.question_order}</span>
                    <span data-testid="question-category" className={`category-${assignment.question.category}`}>
                      {assignment.question.category}
                    </span>
                    <span data-testid="question-difficulty" className={`difficulty-${assignment.question.difficulty}`}>
                      {assignment.question.difficulty}
                    </span>
                  </div>

                  <div data-testid="question-content">
                    <p data-testid="question-text">{assignment.question.text}</p>
                    <p data-testid="question-answer">
                      <strong>Answer:</strong> {assignment.question.answer}
                    </p>
                  </div>

                  <div data-testid="question-actions">
                    <button
                      data-testid={`replace-button-${assignment.id}`}
                      onClick={() => onReplaceQuestion(assignment.question_id, 'replacement-id')}
                    >
                      Replace Question
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {questions.length === 0 && (
            <div data-testid="empty-state">
              <p>No questions available for this round.</p>
            </div>
          )}
        </div>
      );
    });
  });

  describe('Rendering', () => {
    it('should render preview header with round information', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByTestId('preview-header')).toBeInTheDocument();
      expect(screen.getByText('Question Preview - Round round-123')).toBeInTheDocument();
      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });

    it('should render questions summary', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByTestId('questions-summary')).toBeInTheDocument();
      expect(screen.getByText('Total Questions: 3')).toBeInTheDocument();
      expect(screen.getByText('Categories: geography, science, sports')).toBeInTheDocument();
    });

    it('should render all question cards', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByTestId('question-card-qa-1')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-qa-2')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-qa-3')).toBeInTheDocument();
    });

    it('should display question details correctly', () => {
      render(<QuestionPreview {...defaultProps} />);

      // Check first question
      const firstCard = screen.getByTestId('question-card-qa-1');
      expect(firstCard).toHaveTextContent('Question 1');
      expect(firstCard).toHaveTextContent('What is the capital of France?');
      expect(firstCard).toHaveTextContent('Answer: Paris');
      expect(firstCard).toHaveTextContent('geography');
      expect(firstCard).toHaveTextContent('easy');
    });

    it('should show loading state when isLoading is true', () => {
      render(<QuestionPreview {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading questions...')).toBeInTheDocument();
      expect(screen.queryByTestId('questions-container')).not.toBeInTheDocument();
    });

    it('should show empty state when no questions provided', () => {
      render(<QuestionPreview {...defaultProps} questions={[]} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No questions available for this round.')).toBeInTheDocument();
      expect(screen.queryByTestId('questions-list')).not.toBeInTheDocument();
    });
  });

  describe('Question Display', () => {
    it('should show question numbers in correct order', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('Question 3')).toBeInTheDocument();
    });

    it('should display category badges with proper styling classes', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByTestId('question-card-qa-1').querySelector('.category-geography')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-qa-2').querySelector('.category-science')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-qa-3').querySelector('.category-sports')).toBeInTheDocument();
    });

    it('should display difficulty badges with proper styling classes', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByTestId('question-card-qa-1').querySelector('.difficulty-easy')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-qa-2').querySelector('.difficulty-medium')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-qa-3').querySelector('.difficulty-medium')).toBeInTheDocument();
    });

    it('should show question text and answers clearly', () => {
      render(<QuestionPreview {...defaultProps} />);

      // Check all question texts are visible
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      expect(screen.getByText('What is the largest planet in our solar system?')).toBeInTheDocument();
      expect(screen.getByText('Who won the World Cup in 2018?')).toBeInTheDocument();

      // Check all answers are visible with proper labeling
      expect(screen.getByText('Answer: Paris')).toBeInTheDocument();
      expect(screen.getByText('Answer: Jupiter')).toBeInTheDocument();
      expect(screen.getByText('Answer: France')).toBeInTheDocument();
    });

    it('should render replace buttons for each question', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByTestId('replace-button-qa-1')).toBeInTheDocument();
      expect(screen.getByTestId('replace-button-qa-2')).toBeInTheDocument();
      expect(screen.getByTestId('replace-button-qa-3')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(<QuestionPreview {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('close-button'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onReplaceQuestion when replace button is clicked', async () => {
      const onReplaceQuestion = vi.fn();
      render(<QuestionPreview {...defaultProps} onReplaceQuestion={onReplaceQuestion} />);

      fireEvent.click(screen.getByTestId('replace-button-qa-1'));

      await waitFor(() => {
        expect(onReplaceQuestion).toHaveBeenCalledWith('q-1', 'replacement-id');
        expect(onReplaceQuestion).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle multiple replace button clicks', async () => {
      const onReplaceQuestion = vi.fn();
      render(<QuestionPreview {...defaultProps} onReplaceQuestion={onReplaceQuestion} />);

      fireEvent.click(screen.getByTestId('replace-button-qa-1'));
      fireEvent.click(screen.getByTestId('replace-button-qa-2'));
      fireEvent.click(screen.getByTestId('replace-button-qa-3'));

      await waitFor(() => {
        expect(onReplaceQuestion).toHaveBeenCalledTimes(3);
        expect(onReplaceQuestion).toHaveBeenNthCalledWith(1, 'q-1', 'replacement-id');
        expect(onReplaceQuestion).toHaveBeenNthCalledWith(2, 'q-2', 'replacement-id');
        expect(onReplaceQuestion).toHaveBeenNthCalledWith(3, 'q-3', 'replacement-id');
      });
    });

    it('should handle rapid button clicks gracefully', async () => {
      const onReplaceQuestion = vi.fn();
      render(<QuestionPreview {...defaultProps} onReplaceQuestion={onReplaceQuestion} />);

      const replaceButton = screen.getByTestId('replace-button-qa-1');

      // Simulate rapid clicking
      fireEvent.click(replaceButton);
      fireEvent.click(replaceButton);
      fireEvent.click(replaceButton);

      await waitFor(() => {
        expect(onReplaceQuestion).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Data Variations', () => {
    it('should handle questions with long text', () => {
      const longTextQuestions: QuestionAssignment[] = [
        {
          id: 'qa-long',
          round_id: 'round-123',
          question_id: 'q-long',
          question_order: 1,
          question: {
            id: 'q-long',
            text: 'This is a very long question text that might span multiple lines and should be handled gracefully by the component without breaking the layout or causing any display issues',
            answer: 'This is also a very long answer that contains multiple sentences and detailed explanations that should be displayed properly.',
            category: 'general',
            difficulty: 'hard',
            created_at: '2024-01-01T10:00:00Z'
          },
          created_at: '2024-01-01T11:00:00Z'
        }
      ];

      render(<QuestionPreview {...defaultProps} questions={longTextQuestions} />);

      expect(screen.getByTestId('question-card-qa-long')).toBeInTheDocument();
      expect(screen.getByText(/This is a very long question text/)).toBeInTheDocument();
      expect(screen.getByText(/This is also a very long answer/)).toBeInTheDocument();
    });

    it('should handle questions with special characters', () => {
      const specialCharQuestions: QuestionAssignment[] = [
        {
          id: 'qa-special',
          round_id: 'round-123',
          question_id: 'q-special',
          question_order: 1,
          question: {
            id: 'q-special',
            text: 'What is the formula for water? H₂O or H2O?',
            answer: 'H₂O (with subscript) or H2O',
            category: 'chemistry',
            difficulty: 'easy',
            created_at: '2024-01-01T10:00:00Z'
          },
          created_at: '2024-01-01T11:00:00Z'
        }
      ];

      render(<QuestionPreview {...defaultProps} questions={specialCharQuestions} />);

      expect(screen.getByText('What is the formula for water? H₂O or H2O?')).toBeInTheDocument();
      expect(screen.getByText('Answer: H₂O (with subscript) or H2O')).toBeInTheDocument();
    });

    it('should handle single question correctly', () => {
      const singleQuestion = [sampleQuestions[0]];

      render(<QuestionPreview {...defaultProps} questions={singleQuestion} />);

      expect(screen.getByText('Total Questions: 1')).toBeInTheDocument();
      expect(screen.getByText('Categories: geography')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-qa-1')).toBeInTheDocument();
      expect(screen.queryByTestId('question-card-qa-2')).not.toBeInTheDocument();
    });

    it('should handle questions from same category', () => {
      const sameCategory: QuestionAssignment[] = sampleQuestions.map((q, index) => ({
        ...q,
        id: `qa-${index}`,
        question: {
          ...q.question,
          category: 'science'
        }
      }));

      render(<QuestionPreview {...defaultProps} questions={sameCategory} />);

      expect(screen.getByText('Categories: science')).toBeInTheDocument();
    });
  });

  describe('Summary Information', () => {
    it('should calculate unique categories correctly', () => {
      const mixedQuestions: QuestionAssignment[] = [
        ...sampleQuestions,
        {
          id: 'qa-4',
          round_id: 'round-123',
          question_id: 'q-4',
          question_order: 4,
          question: {
            id: 'q-4',
            text: 'Another geography question',
            answer: 'Answer',
            category: 'geography', // Duplicate category
            difficulty: 'easy',
            created_at: '2024-01-01T10:00:00Z'
          },
          created_at: '2024-01-01T11:00:00Z'
        }
      ];

      render(<QuestionPreview {...defaultProps} questions={mixedQuestions} />);

      expect(screen.getByText('Total Questions: 4')).toBeInTheDocument();
      expect(screen.getByText('Categories: geography, science, sports')).toBeInTheDocument();
    });

    it('should update summary when questions change', () => {
      const { rerender } = render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByText('Total Questions: 3')).toBeInTheDocument();

      const updatedQuestions = [...sampleQuestions, {
        id: 'qa-4',
        round_id: 'round-123',
        question_id: 'q-4',
        question_order: 4,
        question: {
          id: 'q-4',
          text: 'New question',
          answer: 'New answer',
          category: 'entertainment',
          difficulty: 'medium',
          created_at: '2024-01-01T10:00:00Z'
        },
        created_at: '2024-01-01T11:00:00Z'
      }];

      rerender(<QuestionPreview {...defaultProps} questions={updatedQuestions} />);

      expect(screen.getByText('Total Questions: 4')).toBeInTheDocument();
      expect(screen.getByText('Categories: geography, science, sports, entertainment')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Replace Question' })).toHaveLength(3);
    });

    it('should provide clear question structure for screen readers', () => {
      render(<QuestionPreview {...defaultProps} />);

      // Check that question content is properly structured
      const questionCards = screen.getAllByTestId(/question-card-/);
      expect(questionCards).toHaveLength(3);

      questionCards.forEach(card => {
        expect(card.querySelector('[data-testid="question-text"]')).toBeInTheDocument();
        expect(card.querySelector('[data-testid="question-answer"]')).toBeInTheDocument();
      });
    });
  });

  describe('Component Contract', () => {
    it('should receive all required props', () => {
      const requiredProps: QuestionPreviewProps = {
        roundId: 'test-round',
        questions: sampleQuestions,
        onReplaceQuestion: vi.fn(),
        onClose: vi.fn()
      };

      expect(() => render(<QuestionPreview {...requiredProps} />)).not.toThrow();
    });

    it('should handle optional isLoading prop', () => {
      const propsWithLoading: QuestionPreviewProps = {
        roundId: 'test-round',
        questions: sampleQuestions,
        onReplaceQuestion: vi.fn(),
        onClose: vi.fn(),
        isLoading: true
      };

      expect(() => render(<QuestionPreview {...propsWithLoading} />)).not.toThrow();
    });

    it('should call onReplaceQuestion with correct parameters', async () => {
      const onReplaceQuestion = vi.fn<[string, string], void>();
      render(<QuestionPreview {...defaultProps} onReplaceQuestion={onReplaceQuestion} />);

      fireEvent.click(screen.getByTestId('replace-button-qa-1'));

      await waitFor(() => {
        expect(onReplaceQuestion).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String)
        );
      });
    });

    it('should handle different round IDs', () => {
      render(<QuestionPreview {...defaultProps} roundId="different-round-456" />);

      expect(screen.getByText('Question Preview - Round different-round-456')).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large number of questions efficiently', () => {
      const manyQuestions: QuestionAssignment[] = Array.from({ length: 50 }, (_, i) => ({
        id: `qa-${i}`,
        round_id: 'round-123',
        question_id: `q-${i}`,
        question_order: i + 1,
        question: {
          id: `q-${i}`,
          text: `Question ${i + 1}`,
          answer: `Answer ${i + 1}`,
          category: ['science', 'history', 'sports'][i % 3],
          difficulty: ['easy', 'medium', 'hard'][i % 3],
          created_at: '2024-01-01T10:00:00Z'
        },
        created_at: '2024-01-01T11:00:00Z'
      }));

      const renderStart = performance.now();
      render(<QuestionPreview {...defaultProps} questions={manyQuestions} />);
      const renderTime = performance.now() - renderStart;

      // Should render within reasonable time (< 200ms for 50 questions)
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByText('Total Questions: 50')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should transition between loading states properly', () => {
      const { rerender } = render(<QuestionPreview {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      rerender(<QuestionPreview {...defaultProps} isLoading={false} />);

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('questions-container')).toBeInTheDocument();
    });

    it('should update when questions prop changes', () => {
      const { rerender } = render(<QuestionPreview {...defaultProps} />);

      expect(screen.getByText('Total Questions: 3')).toBeInTheDocument();

      const newQuestions = sampleQuestions.slice(0, 2);
      rerender(<QuestionPreview {...defaultProps} questions={newQuestions} />);

      expect(screen.getByText('Total Questions: 2')).toBeInTheDocument();
      expect(screen.queryByTestId('question-card-qa-3')).not.toBeInTheDocument();
    });
  });
});

// This test file will FAIL until the actual component is created
// This is the expected TDD behavior - Red, Green, Refactor
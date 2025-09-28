import { useState, useCallback, useMemo } from 'react';
import type {
  QuestionAssignment,
  GenerateQuestionsRequest,
  QuestionGenerationService
} from '@/contracts/host-management';

interface UseQuestionManagementOptions {
  questionService: QuestionGenerationService;
  gameId?: string;
  roundId?: string;
}

interface UseQuestionManagementReturn {
  // State
  questions: QuestionAssignment[];
  selectedCategories: string[];

  // Loading states
  isLoading: boolean;
  isGenerating: boolean;
  isReplacing: boolean;

  // Error state
  error: string | null;

  // Actions
  generateQuestions: (request: GenerateQuestionsRequest) => Promise<QuestionAssignment[]>;
  replaceQuestion: (questionId: string, newQuestionId?: string) => Promise<void>;
  setQuestions: (questions: QuestionAssignment[]) => void;
  toggleCategory: (category: string) => void;
  setCategories: (categories: string[]) => void;
  clearError: () => void;

  // Computed values
  questionsByCategory: Record<string, QuestionAssignment[]>;
  categoryStats: Record<string, { count: number; difficulties: string[] }>;
  totalQuestions: number;
  hasQuestions: boolean;
  isValidConfiguration: boolean;
}

const AVAILABLE_CATEGORIES = [
  'science',
  'history',
  'sports',
  'entertainment',
  'geography',
  'literature'
];

export function useQuestionManagement({
  questionService,
  gameId,
  roundId
}: UseQuestionManagementOptions): UseQuestionManagementReturn {
  // State
  const [questions, setQuestions] = useState<QuestionAssignment[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback(() => setError(null), []);

  // Computed values
  const questionsByCategory = useMemo(() => {
    return questions.reduce((acc, question) => {
      const category = question.question.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(question);
      return acc;
    }, {} as Record<string, QuestionAssignment[]>);
  }, [questions]);

  const categoryStats = useMemo(() => {
    return Object.entries(questionsByCategory).reduce((acc, [category, categoryQuestions]) => {
      const difficulties = [...new Set(categoryQuestions.map(q => q.question.difficulty))];
      acc[category] = {
        count: categoryQuestions.length,
        difficulties
      };
      return acc;
    }, {} as Record<string, { count: number; difficulties: string[] }>);
  }, [questionsByCategory]);

  const totalQuestions = questions.length;
  const hasQuestions = totalQuestions > 0;
  const isValidConfiguration = selectedCategories.length > 0;

  // Category management
  const toggleCategory = useCallback((category: string) => {
    if (!AVAILABLE_CATEGORIES.includes(category)) return;

    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  }, []);

  const setCategories = useCallback((categories: string[]) => {
    const validCategories = categories.filter(cat => AVAILABLE_CATEGORIES.includes(cat));
    setSelectedCategories(validCategories);
  }, []);

  // Generate questions
  const generateQuestions = useCallback(async (
    request: GenerateQuestionsRequest
  ): Promise<QuestionAssignment[]> => {
    setIsGenerating(true);
    clearError();

    try {
      const generatedQuestions = await questionService.generateQuestions(request);
      setQuestions(generatedQuestions);
      return generatedQuestions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate questions';
      setError(errorMessage);
      console.error('Failed to generate questions:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [questionService, clearError]);

  // Replace question
  const replaceQuestion = useCallback(async (
    questionId: string,
    newQuestionId?: string
  ): Promise<void> => {
    if (!gameId) {
      throw new Error('Game ID is required for question replacement');
    }

    setIsReplacing(true);
    clearError();

    try {
      const newQuestion = await questionService.replaceQuestion(
        gameId,
        questionId,
        newQuestionId
      );

      // Update the questions list with the replacement
      setQuestions(prev => prev.map(q =>
        q.question_id === questionId
          ? { ...q, question: newQuestion }
          : q
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to replace question';
      setError(errorMessage);
      console.error('Failed to replace question:', err);
      throw err;
    } finally {
      setIsReplacing(false);
    }
  }, [questionService, gameId, clearError]);

  // Bulk operations
  const regenerateCategory = useCallback(async (category: string): Promise<void> => {
    if (!gameId || !selectedCategories.includes(category)) return;

    const categoryQuestions = questionsByCategory[category] || [];
    if (categoryQuestions.length === 0) return;

    setIsGenerating(true);
    clearError();

    try {
      // Generate new questions for this category
      const request: GenerateQuestionsRequest = {
        gameId,
        categories: [category],
        questionsPerCategory: categoryQuestions.length,
        difficulty: 'mixed'
      };

      const newQuestions = await questionService.generateQuestions(request);

      // Replace all questions in this category
      setQuestions(prev => [
        ...prev.filter(q => q.question.category !== category),
        ...newQuestions
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to regenerate ${category} questions`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [gameId, selectedCategories, questionsByCategory, questionService, clearError]);

  // Validation helpers
  const validateConfiguration = useCallback(() => {
    const errors: string[] = [];

    if (selectedCategories.length === 0) {
      errors.push('At least one category must be selected');
    }

    if (totalQuestions === 0) {
      errors.push('No questions have been generated');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [selectedCategories.length, totalQuestions]);

  // Export/Import helpers
  const exportQuestions = useCallback(() => {
    return {
      questions,
      selectedCategories,
      categoryStats,
      metadata: {
        gameId,
        roundId,
        generatedAt: new Date().toISOString(),
        totalQuestions
      }
    };
  }, [questions, selectedCategories, categoryStats, gameId, roundId, totalQuestions]);

  const importQuestions = useCallback((data: {
    questions: QuestionAssignment[];
    selectedCategories: string[];
  }) => {
    setQuestions(data.questions);
    setCategories(data.selectedCategories);
  }, [setCategories]);

  return {
    // State
    questions,
    selectedCategories,

    // Loading states
    isLoading,
    isGenerating,
    isReplacing,

    // Error state
    error,

    // Actions
    generateQuestions,
    replaceQuestion,
    setQuestions,
    toggleCategory,
    setCategories,
    clearError,

    // Computed values
    questionsByCategory,
    categoryStats,
    totalQuestions,
    hasQuestions,
    isValidConfiguration,

    // Additional utilities
    regenerateCategory,
    validateConfiguration,
    exportQuestions,
    importQuestions,

    // Constants
    availableCategories: AVAILABLE_CATEGORIES
  };
}

export default useQuestionManagement;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  X,
  RefreshCw,
  BarChart3,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { QuestionPreviewProps } from '@/contracts/host-components';

export function QuestionPreview({
  roundId,
  questions,
  onReplaceQuestion,
  onClose,
  isLoading = false
}: QuestionPreviewProps) {
  const [replacingQuestionId, setReplacingQuestionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div data-testid="question-preview" className="flex items-center justify-center min-h-64">
        <div data-testid="loading-spinner" className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading questions...</span>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      science: 'bg-blue-100 text-blue-800',
      history: 'bg-purple-100 text-purple-800',
      sports: 'bg-orange-100 text-orange-800',
      entertainment: 'bg-pink-100 text-pink-800',
      geography: 'bg-green-100 text-green-800',
      literature: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const categories = [...new Set(questions.map(q => q.question.category))];
  const difficulties = [...new Set(questions.map(q => q.question.difficulty))];

  const handleReplaceQuestion = (questionId: string) => {
    setReplacingQuestionId(null);
    onReplaceQuestion(questionId, 'replacement-id'); // The service will handle generating a replacement
  };

  return (
    <div data-testid="question-preview" className="space-y-6">
      {/* Header */}
      <header data-testid="preview-header" className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Preview - Round {roundId}</h2>
          <p className="text-muted-foreground">Review and manage questions for this round</p>
        </div>
        <Button
          data-testid="close-button"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* Questions Container */}
      <div data-testid="questions-container">
        {/* Questions Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Round Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="questions-summary" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Total Questions</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">
                  Categories: {categories.join(', ')}
                </p>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {categories.map(category => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className={getCategoryColor(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Difficulties</p>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {difficulties.map(difficulty => (
                    <Badge
                      key={difficulty}
                      variant="secondary"
                      className={getDifficultyColor(difficulty)}
                    >
                      {difficulty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {questions.length > 0 ? (
          <div data-testid="questions-list" className="space-y-4">
            {questions.map((assignment, index) => (
              <Card key={assignment.id} data-testid={`question-card-${assignment.id}`}>
                <CardHeader className="pb-3">
                  <div data-testid="question-header" className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" data-testid="question-number">
                        Question {assignment.question_order}
                      </Badge>
                      <Badge
                        data-testid="question-category"
                        className={`category-${assignment.question.category} ${getCategoryColor(assignment.question.category)}`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {assignment.question.category}
                      </Badge>
                      <Badge
                        data-testid="question-difficulty"
                        className={`difficulty-${assignment.question.difficulty} ${getDifficultyColor(assignment.question.difficulty)}`}
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        {assignment.question.difficulty}
                      </Badge>
                    </div>
                    <div data-testid="question-actions">
                      <Button
                        data-testid={`replace-button-${assignment.id}`}
                        variant="outline"
                        size="sm"
                        onClick={() => setReplacingQuestionId(assignment.question_id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Replace Question
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div data-testid="question-content" className="space-y-3">
                    <div>
                      <p data-testid="question-text" className="text-lg font-medium">
                        {assignment.question.text}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p data-testid="question-answer" className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          <strong>Answer:</strong> {assignment.question.answer}
                        </span>
                      </p>
                    </div>
                    {assignment.question.created_at && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Created: {new Date(assignment.question.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <div data-testid="empty-state" className="flex flex-col items-center space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">No questions available</h3>
                  <p className="text-muted-foreground">
                    No questions available for this round. Try generating questions first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Replace Question Confirmation Dialog */}
      <AlertDialog
        open={replacingQuestionId !== null}
        onOpenChange={(open) => !open && setReplacingQuestionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to replace this question? A new question from the same category
              will be automatically selected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => replacingQuestionId && handleReplaceQuestion(replacingQuestionId)}
            >
              Replace Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default QuestionPreview;
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { HelpCircle, Sparkles, Tag } from 'lucide-react';

interface QuestionGenerationStepProps {
  selectedCategories?: string[];
  onCategoryToggle?: (category: string, selected: boolean) => void;
  onGenerateQuestions?: () => void;
  isGenerating?: boolean;
  isValid?: boolean;
}

const AVAILABLE_CATEGORIES = [
  { id: 'science', label: 'Science', color: 'bg-blue-100 text-blue-800' },
  { id: 'history', label: 'History', color: 'bg-purple-100 text-purple-800' },
  { id: 'sports', label: 'Sports', color: 'bg-orange-100 text-orange-800' },
  { id: 'entertainment', label: 'Entertainment', color: 'bg-pink-100 text-pink-800' },
  { id: 'geography', label: 'Geography', color: 'bg-green-100 text-green-800' },
  { id: 'literature', label: 'Literature', color: 'bg-indigo-100 text-indigo-800' }
];

export function QuestionGenerationStep({
  selectedCategories = [],
  onCategoryToggle,
  onGenerateQuestions,
  isGenerating = false,
  isValid = false
}: QuestionGenerationStepProps) {
  const handleCategoryChange = (category: string, checked: boolean) => {
    onCategoryToggle?.(category, checked);
  };

  return (
    <div data-testid="questions-step" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Question Generation</span>
          </CardTitle>
          <CardDescription>
            Select categories and generate questions for your trivia game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Categories</Label>
            <div data-testid="category-selection" className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_CATEGORIES.map((category) => (
                <Label
                  key={category.id}
                  data-testid={`category-${category.id}`}
                  className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                    className="rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium">{category.label}</span>
                  </div>
                </Label>
              ))}
            </div>

            {!isValid && selectedCategories.length === 0 && (
              <p className="text-sm text-destructive">
                Please select at least one category
              </p>
            )}
          </div>

          {/* Selected Categories Summary */}
          {selectedCategories.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Selected Categories</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((categoryId) => {
                  const category = AVAILABLE_CATEGORIES.find(c => c.id === categoryId);
                  return (
                    <Badge
                      key={categoryId}
                      variant="secondary"
                      className={category?.color}
                    >
                      {category?.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question Generation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Generate Questions</Label>
                <p className="text-sm text-muted-foreground">
                  Generate questions for the selected categories
                </p>
              </div>
              <Button
                data-testid="generate-questions-button"
                onClick={onGenerateQuestions}
                disabled={selectedCategories.length === 0 || isGenerating}
                className="flex items-center space-x-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGenerating ? 'Generating...' : 'Generate Questions'}</span>
              </Button>
            </div>

            {isGenerating && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Generating questions from selected categories...</span>
              </div>
            )}
          </div>

          {/* Information */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span>About Question Generation</span>
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Questions are automatically generated based on selected categories</li>
              <li>• The system ensures no duplicate questions within the same game</li>
              <li>• Questions include varying difficulty levels for engaging gameplay</li>
              <li>• You can preview and replace questions before starting the game</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuestionGenerationStep;
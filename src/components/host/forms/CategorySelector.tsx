import React, { useState, memo } from 'react';
import { Check, X, Search, BookOpen, Globe, Dumbbell, Film, FlaskConical, Palette, Cpu, Leaf, Building2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GAME_VALIDATION_CONSTANTS, validateCategorySelection } from '@/lib/validations/game-schemas';

// Category metadata with icons and descriptions
const CATEGORY_METADATA = {
  'Arts & Literature': {
    icon: Palette,
    label: 'Arts & Literature',
    description: 'Visual arts, music, theater, books, authors, and literary works',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    questionCount: 1000,
  },
  'Entertainment': {
    icon: Film,
    label: 'Entertainment',
    description: 'Movies, TV shows, music, and celebrity culture',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    questionCount: 1000,
  },
  'Food and Drink': {
    icon: Leaf,
    label: 'Food and Drink',
    description: 'Cuisine, cooking, beverages, and culinary traditions',
    color: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    questionCount: 1000,
  },
  'General Knowledge': {
    icon: Info,
    label: 'General Knowledge',
    description: 'Mixed topics, trivia, and general facts',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    questionCount: 1000,
  },
  'Geography': {
    icon: Globe,
    label: 'Geography',
    description: 'Countries, capitals, landmarks, and world geography',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    questionCount: 1000,
  },
  'History': {
    icon: BookOpen,
    label: 'History',
    description: 'World history, historical figures, and important events',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    questionCount: 1000,
  },
  'Pop Culture': {
    icon: Film,
    label: 'Pop Culture',
    description: 'Trends, celebrities, social media, and contemporary culture',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    questionCount: 1000,
  },
  'Science': {
    icon: FlaskConical,
    label: 'Science',
    description: 'Physics, chemistry, biology, and scientific discoveries',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    questionCount: 1000,
  },
  'Sports': {
    icon: Dumbbell,
    label: 'Sports',
    description: 'Sports facts, athletes, records, and competitions',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    questionCount: 1000,
  },
  'Technology': {
    icon: Cpu,
    label: 'Technology',
    description: 'Computing, internet, gadgets, and tech innovations',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    questionCount: 1000,
  },
} as const;

interface CategorySelectorProps {
  selectedCategories: string[];
  onSelectionChange: (categories: string[]) => void;
  availableCategories?: string[];
  maxCategories?: number;
  minCategories?: number;
  disabled?: boolean;
  showQuestionCounts?: boolean;
  className?: string;
}

export const CategorySelector = memo(function CategorySelector({
  selectedCategories,
  onSelectionChange,
  availableCategories = GAME_VALIDATION_CONSTANTS.AVAILABLE_CATEGORIES,
  maxCategories = 6,
  minCategories = 1,
  disabled = false,
  showQuestionCounts = true,
  className = ''
}: CategorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search query
  const filteredCategories = availableCategories.filter(category => {
    const metadata = CATEGORY_METADATA[category as keyof typeof CATEGORY_METADATA];
    if (!metadata) return false;

    const searchLower = searchQuery.toLowerCase();
    return (
      metadata.label.toLowerCase().includes(searchLower) ||
      metadata.description.toLowerCase().includes(searchLower)
    );
  });

  const handleCategoryToggle = (category: string) => {
    if (disabled) return;

    const isSelected = selectedCategories.includes(category);

    if (isSelected) {
      // Remove category
      const newSelection = selectedCategories.filter(c => c !== category);
      onSelectionChange(newSelection);
    } else {
      // Add category (if under max limit)
      if (selectedCategories.length < maxCategories) {
        const newSelection = [...selectedCategories, category];
        onSelectionChange(newSelection);
      }
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const categoriesToSelect = filteredCategories.slice(0, maxCategories);
    onSelectionChange(categoriesToSelect);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  const isValid = validateCategorySelection(selectedCategories);
  const isAtMaxLimit = selectedCategories.length >= maxCategories;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Question Categories</span>
          <Badge variant="outline">
            {selectedCategories.length}/{maxCategories} selected
          </Badge>
        </CardTitle>
        <CardDescription>
          Choose the categories for your trivia questions. You can select up to {maxCategories} categories.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={disabled}
              aria-label="Search categories"
              aria-describedby="search-description"
            />
            <div id="search-description" className="sr-only">
              Search through available question categories
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={disabled || filteredCategories.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled || selectedCategories.length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Validation Alerts */}
        {!isValid && selectedCategories.length > 0 && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
              Please select between {minCategories} and {maxCategories} categories.
            </AlertDescription>
          </Alert>
        )}

        {isAtMaxLimit && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You've reached the maximum number of categories ({maxCategories}).
              Unselect a category to choose a different one.
            </AlertDescription>
          </Alert>
        )}

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCategories.map((category) => {
            const metadata = CATEGORY_METADATA[category as keyof typeof CATEGORY_METADATA];
            if (!metadata) return null;

            const isSelected = selectedCategories.includes(category);
            const canSelect = !isSelected && !isAtMaxLimit;
            const IconComponent = metadata.icon;

            return (
              <div
                key={category}
                className={`
                  relative border rounded-lg p-4 transition-all cursor-pointer
                  ${isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : canSelect
                      ? 'border-border hover:border-primary/50 hover:bg-muted/50'
                      : 'border-border bg-muted/20 opacity-60 cursor-not-allowed'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => handleCategoryToggle(category)}
                role="checkbox"
                aria-checked={isSelected}
                aria-disabled={disabled || (!isSelected && isAtMaxLimit)}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryToggle(category);
                  }
                }}
                aria-label={`${metadata.label}: ${metadata.description}. ${isSelected ? 'Selected' : 'Not selected'}. ${metadata.questionCount} questions available.`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 right-3">
                  <Checkbox
                    checked={isSelected}
                    disabled={disabled || (!isSelected && isAtMaxLimit)}
                    className="h-5 w-5"
                  />
                </div>

                {/* Category Content */}
                <div className="pr-8">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-md ${metadata.color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium">{metadata.label}</h3>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {metadata.description}
                  </p>

                  {showQuestionCounts && (
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="secondary" className="text-xs">
                        {metadata.questionCount} questions
                      </Badge>
                      {isSelected && (
                        <Badge className="text-xs bg-primary">
                          <Check className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No categories found matching "{searchQuery}"</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        )}

        {/* Selection Summary */}
        {selectedCategories.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Selected Categories:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => {
                const metadata = CATEGORY_METADATA[category as keyof typeof CATEGORY_METADATA];
                if (!metadata) return null;

                return (
                  <Badge
                    key={category}
                    variant="default"
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {metadata.label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default CategorySelector;
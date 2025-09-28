import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Type } from 'lucide-react';

interface BasicGameInfoStepProps {
  title?: string;
  location?: string;
  scheduledDate?: string;
  onTitleChange?: (title: string) => void;
  onLocationChange?: (location: string) => void;
  onScheduledDateChange?: (date: string) => void;
  isValid?: boolean;
}

export function BasicGameInfoStep({
  title = '',
  location = '',
  scheduledDate = '',
  onTitleChange,
  onLocationChange,
  onScheduledDateChange,
  isValid = false
}: BasicGameInfoStepProps) {
  return (
    <div data-testid="basic-step" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Basic Game Information</span>
          </CardTitle>
          <CardDescription>
            Set up the fundamental details for your trivia game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Title */}
          <div className="space-y-2">
            <Label htmlFor="title-input" className="flex items-center space-x-2">
              <Type className="h-4 w-4" />
              <span>Game Title</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title-input"
              data-testid="title-input"
              placeholder="Enter game title"
              value={title}
              onChange={(e) => onTitleChange?.(e.target.value)}
              className={!isValid && !title.trim() ? 'border-destructive' : ''}
            />
            {!isValid && !title.trim() && (
              <p className="text-sm text-destructive">Game title is required</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location-input" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Location</span>
              <span className="text-muted-foreground text-sm">(optional)</span>
            </Label>
            <Input
              id="location-input"
              data-testid="location-input"
              placeholder="Enter location (optional)"
              value={location}
              onChange={(e) => onLocationChange?.(e.target.value)}
            />
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="date-input" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Scheduled Date</span>
              <span className="text-muted-foreground text-sm">(optional)</span>
            </Label>
            <Input
              id="date-input"
              data-testid="date-input"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => onScheduledDateChange?.(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BasicGameInfoStep;
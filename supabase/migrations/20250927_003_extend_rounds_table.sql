-- Migration: Extend rounds table for per-round customization
-- Created: 2025-09-27
-- Purpose: Enable custom categories and question counts per round

-- Add new columns to rounds table
ALTER TABLE rounds
ADD COLUMN custom_categories TEXT[],
ADD COLUMN questions_per_round INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN rounds.custom_categories IS 'Override default game categories for this specific round (optional)';
COMMENT ON COLUMN rounds.questions_per_round IS 'Override default question count for this specific round (optional)';

-- Create index for category-based queries
CREATE INDEX idx_rounds_custom_categories ON rounds USING GIN(custom_categories);

-- Add constraint to ensure positive question count when specified
ALTER TABLE rounds
ADD CONSTRAINT check_questions_per_round_positive
CHECK (questions_per_round IS NULL OR questions_per_round > 0);
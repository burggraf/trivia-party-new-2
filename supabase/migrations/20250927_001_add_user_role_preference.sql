-- Migration: Add role preference to user profiles
-- Created: 2025-09-27
-- Purpose: Enable persistent host/player role selection

-- Add preferred_role column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN preferred_role VARCHAR(10) CHECK (preferred_role IN ('host', 'player'));

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.preferred_role IS 'User''s preferred role (host or player), persists across sessions until manually changed';

-- Create index for role-based queries
CREATE INDEX idx_user_profiles_preferred_role ON user_profiles(preferred_role);

-- Update the updated_at trigger to include the new column
-- (Trigger already exists, just documenting that it will handle this column)
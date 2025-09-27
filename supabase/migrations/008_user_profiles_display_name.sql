-- Migration: Add display_name to user_profiles table
-- Purpose: Support TV-friendly display names for multi-user games

-- Add display_name field to existing table
ALTER TABLE user_profiles
ADD COLUMN display_name VARCHAR(50);

-- Add constraints for display name
ALTER TABLE user_profiles
ADD CONSTRAINT display_name_length CHECK (
  display_name IS NULL OR LENGTH(TRIM(display_name)) BETWEEN 1 AND 50
);

-- Create index for display name lookups
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);

-- Update RLS policies to include display_name
-- Users can view their own display names
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profiles including display_name
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create trigger for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for user_profiles if not exists
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
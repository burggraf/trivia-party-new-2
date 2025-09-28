-- Migration: Extend games table for host management
-- Created: 2025-09-27
-- Purpose: Add game archival, self-registration toggle, and team size constraints

-- Add new columns to games table
ALTER TABLE games
ADD COLUMN archived BOOLEAN DEFAULT FALSE,
ADD COLUMN self_registration_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN min_players_per_team INTEGER DEFAULT 1 CHECK (min_players_per_team BETWEEN 1 AND 4);

-- Add constraint to ensure min <= max players per team
ALTER TABLE games
ADD CONSTRAINT check_team_size_valid
CHECK (min_players_per_team <= max_players_per_team);

-- Add comments for documentation
COMMENT ON COLUMN games.archived IS 'Soft delete flag - archived games are hidden from active lists but preserved for history';
COMMENT ON COLUMN games.self_registration_enabled IS 'Whether teams can self-register or must be pre-configured by host';
COMMENT ON COLUMN games.min_players_per_team IS 'Minimum number of players required per team (1-4)';

-- Create indexes for host queries
CREATE INDEX idx_games_host_archived ON games(host_id, archived);
CREATE INDEX idx_games_status_archived ON games(status, archived);
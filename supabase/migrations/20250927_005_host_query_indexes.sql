-- Host Query Performance Indexes
-- Optimizes common queries for host game management operations

-- ================================================================
-- GAME INDEXES FOR HOST OPERATIONS
-- ================================================================

-- Index for host's own games lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_games_host_id_status
ON games(host_id, status)
WHERE archived = false;

-- Index for host's game lookup by ID and host (authorization checks)
CREATE INDEX IF NOT EXISTS idx_games_id_host_id
ON games(id, host_id);

-- Index for active games visible to players (joining games)
CREATE INDEX IF NOT EXISTS idx_games_self_registration
ON games(self_registration_enabled, status, archived)
WHERE self_registration_enabled = true AND archived = false;

-- Partial index for setup games only (frequent host modifications)
CREATE INDEX IF NOT EXISTS idx_games_setup_status
ON games(host_id, id)
WHERE status = 'setup';

-- ================================================================
-- TEAM INDEXES FOR HOST OPERATIONS
-- ================================================================

-- Index for teams in a specific game (host viewing/managing teams)
CREATE INDEX IF NOT EXISTS idx_teams_game_id_name
ON teams(game_id, name);

-- Index for team lookup with game host verification
CREATE INDEX IF NOT EXISTS idx_teams_id_game_id
ON teams(id, game_id);

-- ================================================================
-- TEAM PLAYERS INDEXES
-- ================================================================

-- Index for players in a specific team (host viewing team roster)
CREATE INDEX IF NOT EXISTS idx_team_players_team_id_user_id
ON team_players(team_id, user_id);

-- Index for user's team assignments (player viewing own teams)
CREATE INDEX IF NOT EXISTS idx_team_players_user_id
ON team_players(user_id);

-- Index for finding user's teams in a specific game
CREATE INDEX IF NOT EXISTS idx_team_players_game_lookup
ON team_players(user_id, team_id);

-- ================================================================
-- ROUNDS INDEXES FOR HOST OPERATIONS
-- ================================================================

-- Index for rounds in a specific game (host managing rounds)
CREATE INDEX IF NOT EXISTS idx_rounds_game_id_round_number
ON rounds(game_id, round_number);

-- Index for active rounds (player queries)
CREATE INDEX IF NOT EXISTS idx_rounds_status_game_id
ON rounds(status, game_id)
WHERE status IN ('active', 'completed');

-- ================================================================
-- ROUND QUESTIONS INDEXES
-- ================================================================

-- Index for questions in a specific round (host and player queries)
CREATE INDEX IF NOT EXISTS idx_round_questions_round_id_order
ON round_questions(round_id, question_order);

-- Index for active round questions (player viewing current questions)
CREATE INDEX IF NOT EXISTS idx_round_questions_active
ON round_questions(round_id, question_order, revealed_at)
WHERE revealed_at IS NOT NULL;

-- ================================================================
-- USER PROFILES INDEXES
-- ================================================================

-- Index for role-based queries (finding hosts/players)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role
ON user_profiles(preferred_role)
WHERE preferred_role IS NOT NULL;

-- Index for profile lookups by display name (team assignment UI)
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name
ON user_profiles(display_name)
WHERE display_name IS NOT NULL;

-- ================================================================
-- TEAM ANSWERS INDEXES (for future score calculations)
-- ================================================================

-- Index for team answers in a round (scoring and review)
CREATE INDEX IF NOT EXISTS idx_team_answers_round_team
ON team_answers(round_id, team_id);

-- Index for team answers by question (detailed review)
CREATE INDEX IF NOT EXISTS idx_team_answers_question_team
ON team_answers(round_question_id, team_id);

-- ================================================================
-- COMPOUND INDEXES FOR COMPLEX AUTHORIZATION QUERIES
-- ================================================================

-- Optimizes the common pattern: user -> teams -> games for authorization
CREATE INDEX IF NOT EXISTS idx_authorization_chain
ON team_players(user_id, team_id)
INCLUDE (id);

-- Optimizes team count queries for game setup validation
CREATE INDEX IF NOT EXISTS idx_team_count_by_game
ON teams(game_id)
WHERE id IS NOT NULL;

-- ================================================================
-- QUERY PERFORMANCE NOTES
-- ================================================================

-- These indexes optimize the following common query patterns:
-- 1. Host viewing their own games: games(host_id, status)
-- 2. Host managing teams in a game: teams(game_id) + authorization
-- 3. Player joining games: games(self_registration_enabled, status, archived)
-- 4. Authorization checks: game_id -> host_id verification
-- 5. Round progression: rounds(game_id, round_number)
-- 6. Question display: round_questions(round_id, question_order)
-- 7. Team roster management: team_players(team_id, user_id)

-- All indexes use appropriate partial index conditions where beneficial
-- to reduce index size and improve performance on the most common cases.
-- Host Game Management RLS Policies
-- Enables secure host operations with proper authorization

-- Enable RLS on tables if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_questions ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- USER PROFILES POLICIES
-- ================================================================

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id);

-- Allow users to update their own profile (including role preference)
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id);

-- Allow authenticated users to view other profiles (for team assignment)
DROP POLICY IF EXISTS "Authenticated users can view profiles for team assignment" ON user_profiles;
CREATE POLICY "Authenticated users can view profiles for team assignment" ON user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ================================================================
-- GAMES POLICIES
-- ================================================================

-- Hosts can create games
DROP POLICY IF EXISTS "Hosts can create games" ON games;
CREATE POLICY "Hosts can create games" ON games
  FOR INSERT WITH CHECK (
    auth.uid()::text = host_id
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()::text
      AND preferred_role = 'host'
    )
  );

-- Hosts can view their own games
DROP POLICY IF EXISTS "Hosts can view own games" ON games;
CREATE POLICY "Hosts can view own games" ON games
  FOR SELECT USING (auth.uid()::text = host_id);

-- Hosts can update their own games (only in setup status)
DROP POLICY IF EXISTS "Hosts can update own games in setup" ON games;
CREATE POLICY "Hosts can update own games in setup" ON games
  FOR UPDATE USING (
    auth.uid()::text = host_id
    AND status = 'setup'
  );

-- Players can view active/completed games they're participating in
DROP POLICY IF EXISTS "Players can view games they participate in" ON games;
CREATE POLICY "Players can view games they participate in" ON games
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT g.id
      FROM games g
      JOIN teams t ON t.game_id = g.id
      JOIN team_players tp ON tp.team_id = t.id
      WHERE tp.user_id = auth.uid()::text
      AND g.status IN ('active', 'completed')
    )
  );

-- All authenticated users can view non-archived games for joining
DROP POLICY IF EXISTS "Authenticated users can view available games" ON games;
CREATE POLICY "Authenticated users can view available games" ON games
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND archived = false
    AND status IN ('setup', 'active')
    AND self_registration_enabled = true
  );

-- ================================================================
-- TEAMS POLICIES
-- ================================================================

-- Hosts can create teams for their games
DROP POLICY IF EXISTS "Hosts can create teams for own games" ON teams;
CREATE POLICY "Hosts can create teams for own games" ON teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE id = game_id
      AND host_id = auth.uid()::text
      AND status = 'setup'
    )
  );

-- Hosts can view teams in their games
DROP POLICY IF EXISTS "Hosts can view teams in own games" ON teams;
CREATE POLICY "Hosts can view teams in own games" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE id = game_id
      AND host_id = auth.uid()::text
    )
  );

-- Hosts can update teams in their games (only in setup)
DROP POLICY IF EXISTS "Hosts can update teams in own games" ON teams;
CREATE POLICY "Hosts can update teams in own games" ON teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE id = game_id
      AND host_id = auth.uid()::text
      AND status = 'setup'
    )
  );

-- Hosts can delete teams in their games (only in setup)
DROP POLICY IF EXISTS "Hosts can delete teams in own games" ON teams;
CREATE POLICY "Hosts can delete teams in own games" ON teams
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE id = game_id
      AND host_id = auth.uid()::text
      AND status = 'setup'
    )
  );

-- Players can view teams in games they participate in
DROP POLICY IF EXISTS "Players can view teams in participating games" ON teams;
CREATE POLICY "Players can view teams in participating games" ON teams
  FOR SELECT USING (
    game_id IN (
      SELECT DISTINCT g.id
      FROM games g
      JOIN teams t ON t.game_id = g.id
      JOIN team_players tp ON tp.team_id = t.id
      WHERE tp.user_id = auth.uid()::text
    )
  );

-- ================================================================
-- TEAM PLAYERS POLICIES
-- ================================================================

-- Hosts can assign players to teams in their games
DROP POLICY IF EXISTS "Hosts can assign players to teams" ON team_players;
CREATE POLICY "Hosts can assign players to teams" ON team_players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN games g ON g.id = t.game_id
      WHERE t.id = team_id
      AND g.host_id = auth.uid()::text
      AND g.status = 'setup'
    )
  );

-- Hosts can view team players in their games
DROP POLICY IF EXISTS "Hosts can view team players in own games" ON team_players;
CREATE POLICY "Hosts can view team players in own games" ON team_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN games g ON g.id = t.game_id
      WHERE t.id = team_id
      AND g.host_id = auth.uid()::text
    )
  );

-- Hosts can remove players from teams in their games (only in setup)
DROP POLICY IF EXISTS "Hosts can remove players from teams" ON team_players;
CREATE POLICY "Hosts can remove players from teams" ON team_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN games g ON g.id = t.game_id
      WHERE t.id = team_id
      AND g.host_id = auth.uid()::text
      AND g.status = 'setup'
    )
  );

-- Players can view their own team assignments
DROP POLICY IF EXISTS "Players can view own team assignments" ON team_players;
CREATE POLICY "Players can view own team assignments" ON team_players
  FOR SELECT USING (auth.uid()::text = user_id);

-- Players can join teams when self-registration is enabled
DROP POLICY IF EXISTS "Players can join teams with self-registration" ON team_players;
CREATE POLICY "Players can join teams with self-registration" ON team_players
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1 FROM teams t
      JOIN games g ON g.id = t.game_id
      WHERE t.id = team_id
      AND g.self_registration_enabled = true
      AND g.status = 'setup'
    )
  );

-- ================================================================
-- ROUNDS POLICIES
-- ================================================================

-- Hosts can view rounds in their games
DROP POLICY IF EXISTS "Hosts can view rounds in own games" ON rounds;
CREATE POLICY "Hosts can view rounds in own games" ON rounds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE id = game_id
      AND host_id = auth.uid()::text
    )
  );

-- Hosts can update rounds in their games
DROP POLICY IF EXISTS "Hosts can update rounds in own games" ON rounds;
CREATE POLICY "Hosts can update rounds in own games" ON rounds
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE id = game_id
      AND host_id = auth.uid()::text
    )
  );

-- Players can view rounds in active games they participate in
DROP POLICY IF EXISTS "Players can view rounds in participating games" ON rounds;
CREATE POLICY "Players can view rounds in participating games" ON rounds
  FOR SELECT USING (
    game_id IN (
      SELECT DISTINCT g.id
      FROM games g
      JOIN teams t ON t.game_id = g.id
      JOIN team_players tp ON tp.team_id = t.id
      WHERE tp.user_id = auth.uid()::text
      AND g.status IN ('active', 'completed')
    )
  );

-- ================================================================
-- ROUND QUESTIONS POLICIES
-- ================================================================

-- Hosts can manage round questions in their games
DROP POLICY IF EXISTS "Hosts can manage round questions" ON round_questions;
CREATE POLICY "Hosts can manage round questions" ON round_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rounds r
      JOIN games g ON g.id = r.game_id
      WHERE r.id = round_id
      AND g.host_id = auth.uid()::text
    )
  );

-- Players can view round questions in active rounds they participate in
DROP POLICY IF EXISTS "Players can view active round questions" ON round_questions;
CREATE POLICY "Players can view active round questions" ON round_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rounds r
      JOIN games g ON g.id = r.game_id
      JOIN teams t ON t.game_id = g.id
      JOIN team_players tp ON tp.team_id = t.id
      WHERE r.id = round_id
      AND tp.user_id = auth.uid()::text
      AND r.status = 'active'
      AND g.status = 'active'
    )
  );

-- ================================================================
-- HELPER FUNCTIONS FOR COMPLEX AUTHORIZATION
-- ================================================================

-- Function to check if user is host of a game
CREATE OR REPLACE FUNCTION is_game_host(game_id_param uuid, user_id_param text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM games
    WHERE id = game_id_param
    AND host_id = user_id_param
  );
$$;

-- Function to check if user has host role preference
CREATE OR REPLACE FUNCTION has_host_role(user_id_param text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id_param
    AND preferred_role = 'host'
  );
$$;

-- Function to check if game allows modifications
CREATE OR REPLACE FUNCTION game_allows_modifications(game_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM games
    WHERE id = game_id_param
    AND status = 'setup'
    AND archived = false
  );
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_game_host(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION has_host_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION game_allows_modifications(uuid) TO authenticated;
# Quick Start: Multi-User Database Implementation

## Overview
This guide provides a step-by-step walkthrough for implementing and testing the multi-user trivia database schema.

## Prerequisites
- Supabase project configured
- Local development environment with `npm run dev`
- Database migrations applied
- Test environment with sample data

## Implementation Verification Steps

### 1. Database Schema Verification
```bash
# Run database migrations
supabase db push

# Verify tables exist
supabase db shell
\dt public.games
\dt public.teams
\dt public.team_players
\dt public.team_answers
\dt public.rounds
\dt public.round_questions
\dt public.host_used_questions

# Check constraints
\d public.games
\d public.teams
```

### 2. TypeScript Contract Validation
```bash
# Run contract tests (should fail initially, then pass after implementation)
npm test -- contracts/multi-user-database.test.ts

# Verify type checking
npm run build
```

### 3. Basic Data Flow Test

#### Step A: Create Enhanced User Profile
```sql
-- Insert test user with display name
INSERT INTO user_profiles (username, display_name)
VALUES ('testhost', 'TV Host Name');
```

#### Step B: Create Game Event
```sql
-- Create a game event
INSERT INTO games (
  host_id,
  title,
  scheduled_date,
  total_rounds,
  questions_per_round,
  selected_categories
) VALUES (
  '{user_id}',
  'Test Trivia Night',
  '2025-12-01',
  3,
  5,
  ARRAY['history', 'science']
);
```

#### Step C: Create Teams
```sql
-- Create teams for the game
INSERT INTO teams (game_id, name, display_color) VALUES
('{game_id}', 'Red Team', '#FF0000'),
('{game_id}', 'Blue Team', '#0000FF'),
('{game_id}', 'Green Team', '#00FF00');
```

#### Step D: Add Players to Teams
```sql
-- Create player profiles
INSERT INTO user_profiles (username, display_name) VALUES
('player1', 'Alice'),
('player2', 'Bob'),
('player3', 'Charlie'),
('player4', 'Diana');

-- Add players to teams (max 4 per team)
INSERT INTO team_players (team_id, player_id) VALUES
('{red_team_id}', '{alice_id}'),
('{red_team_id}', '{bob_id}'),
('{blue_team_id}', '{charlie_id}'),
('{blue_team_id}', '{diana_id}');
```

#### Step E: Create Rounds and Questions
```sql
-- Create rounds for the game
INSERT INTO rounds (game_id, round_number) VALUES
('{game_id}', 1),
('{game_id}', 2),
('{game_id}', 3);

-- Assign questions to round 1 (assuming questions exist)
INSERT INTO round_questions (round_id, question_id, question_order)
SELECT '{round_1_id}', id, ROW_NUMBER() OVER (ORDER BY id)
FROM questions
WHERE category = ANY(ARRAY['history', 'science'])
AND id NOT IN (
  SELECT question_id FROM host_used_questions WHERE host_id = '{host_id}'
)
LIMIT 5;

-- Mark questions as used by host
INSERT INTO host_used_questions (host_id, question_id)
SELECT '{host_id}', question_id
FROM round_questions
WHERE round_id = '{round_1_id}';
```

#### Step F: Submit Team Answers
```sql
-- Teams submit answers for first question
INSERT INTO team_answers (
  team_id,
  round_question_id,
  submitted_by,
  answer,
  is_correct,
  points_earned
) VALUES
('{red_team_id}', '{first_question_id}', '{alice_id}', 'A', true, 10),
('{blue_team_id}', '{first_question_id}', '{charlie_id}', 'B', false, 0),
('{green_team_id}', '{first_question_id}', '{host_id}', 'A', true, 10);
```

### 4. Constraint Validation Tests

#### Test Team Size Limits
```sql
-- This should fail (5th player on team with max 4)
INSERT INTO team_players (team_id, player_id)
VALUES ('{red_team_id}', '{fifth_player_id}');
-- Expected: constraint violation
```

#### Test Question Uniqueness
```sql
-- This should fail (duplicate question for same host)
INSERT INTO host_used_questions (host_id, question_id)
VALUES ('{host_id}', '{already_used_question_id}');
-- Expected: unique constraint violation
```

#### Test Player Team Exclusivity
```sql
-- This should fail (player already on another team in same game)
INSERT INTO team_players (team_id, player_id)
VALUES ('{different_team_same_game}', '{alice_id}');
-- Expected: constraint violation
```

#### Test Answer Format
```sql
-- This should fail (invalid answer option)
INSERT INTO team_answers (
  team_id, round_question_id, submitted_by, answer, is_correct, points_earned
) VALUES ('{team_id}', '{question_id}', '{player_id}', 'E', false, 0);
-- Expected: check constraint violation
```

### 5. Performance Verification

#### Check Index Usage
```sql
-- Verify foreign key indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename IN ('games', 'teams', 'team_players', 'team_answers', 'rounds', 'round_questions', 'host_used_questions');

-- Test query performance
EXPLAIN ANALYZE
SELECT t.name, tp.player_id, up.display_name
FROM teams t
JOIN team_players tp ON t.id = tp.team_id
JOIN user_profiles up ON tp.player_id = up.id
WHERE t.game_id = '{game_id}';
```

### 6. RLS Policy Testing

#### Test Host Access
```javascript
// In browser console or test environment
const { data: hostGames } = await supabase
  .from('games')
  .select('*')
  .eq('host_id', hostUserId);

console.log('Host can see own games:', hostGames.length > 0);
```

#### Test Player Access
```javascript
// Player should only see games they're participating in
const { data: playerGames } = await supabase
  .from('games')
  .select(`
    *,
    teams!inner (
      team_players!inner (
        player_id
      )
    )
  `)
  .eq('teams.team_players.player_id', playerId);

console.log('Player can see participating games:', playerGames.length > 0);
```

### 7. Real-time Functionality Test

#### Subscribe to Game Updates
```javascript
// Test real-time subscription
const gameSubscription = supabase
  .channel(`game:${gameId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'team_answers',
    filter: `team_id=in.(${teamIds.join(',')})`
  }, (payload) => {
    console.log('Real-time answer update:', payload);
  })
  .subscribe();

// Submit test answer and verify real-time update
await supabase
  .from('team_answers')
  .insert({
    team_id: testTeamId,
    round_question_id: testQuestionId,
    submitted_by: playerId,
    answer: 'A',
    is_correct: true,
    points_earned: 10
  });
```

## Success Criteria

✅ **Database Schema**: All tables created with proper constraints
✅ **Type Safety**: TypeScript contracts compile without errors
✅ **Data Integrity**: Constraint violations properly rejected
✅ **Performance**: Queries execute with index usage
✅ **Security**: RLS policies enforce proper access control
✅ **Real-time**: Supabase subscriptions receive live updates

## Troubleshooting

### Common Issues

1. **Migration Failures**: Check for existing table conflicts
2. **Constraint Violations**: Verify test data meets requirements
3. **RLS Access Denied**: Ensure proper auth context in tests
4. **Type Errors**: Update imports after contract changes

### Debug Queries

```sql
-- Check table relationships
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('games', 'teams', 'team_players', 'team_answers');

-- Check constraint definitions
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.games'::regclass;
```

This quickstart guide ensures the multi-user database implementation meets all functional requirements and maintains data integrity.
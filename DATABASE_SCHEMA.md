# Database Schema Documentation

This document provides a comprehensive overview of the trivia party application's database structure using Supabase (PostgreSQL).

## Overview

The database is designed to support a multi-user trivia game system where:
- **Hosts** create and manage trivia games with customizable settings
- **Players** join teams and participate in live trivia sessions
- **Questions** are organized by categories with multiple-choice answers
- **Games** progress through rounds with real-time scoring and team management

## Core Tables

### user_profiles
User account information and statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK to auth.users.id | User's unique identifier |
| username | text | UNIQUE, 3-50 chars | Display username |
| display_name | varchar | NULL, 1-50 chars | Optional display name |
| avatar_url | text | NULL | Profile picture URL |
| total_games_played | integer | DEFAULT 0 | Lifetime games count |
| total_correct_answers | integer | DEFAULT 0 | Lifetime correct answers |
| total_questions_answered | integer | DEFAULT 0 | Lifetime questions answered |
| favorite_categories | text[] | DEFAULT '{}' | Preferred question categories |
| preferred_role | varchar | NULL, CHECK(preferred_role IN ('host', 'player')) | User's preferred game role |
| created_at | timestamptz | DEFAULT now() | Account creation time |
| updated_at | timestamptz | DEFAULT now() | Last profile update |

**Indexes:**
- `idx_user_profiles_username` (username)
- `idx_user_profiles_display_name` (display_name)
- `idx_user_profiles_role` (preferred_role) - For role-based queries

### games
Game session configuration and metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Game's unique identifier |
| host_id | uuid | FK to user_profiles.id | Game creator |
| title | varchar | NOT NULL | Game title/name |
| location | varchar | NULL | Physical or virtual location |
| scheduled_date | date | NOT NULL | When game is scheduled |
| start_time | timestamptz | NULL | Actual start time |
| end_time | timestamptz | NULL | Actual end time |
| max_teams | integer | DEFAULT 20, 1-20 | Maximum teams allowed |
| max_players_per_team | integer | DEFAULT 4, 1-4 | Maximum players per team |
| status | varchar | DEFAULT 'setup' | setup/active/completed/cancelled |
| total_rounds | integer | 1-10 | Number of rounds in game |
| questions_per_round | integer | 1-20 | Questions per round |
| selected_categories | text[] | NOT NULL, min 1 | Question categories to use |
| archived | boolean | DEFAULT false | Whether game is archived |
| self_registration_enabled | boolean | DEFAULT true | Allow players to join teams |
| min_players_per_team | integer | DEFAULT 1, 1-4 | Minimum players per team |
| created_at | timestamptz | DEFAULT now() | Game creation time |
| updated_at | timestamptz | DEFAULT now() | Last game update |

**Indexes:**
- `idx_games_host_id` (host_id)
- `idx_games_status` (status)
- `idx_games_scheduled_date` (scheduled_date)
- `idx_games_created_at` (created_at)
- `idx_games_host_id_status` (host_id, status) - Optimized for host queries
- `idx_games_id_host_id` (id, host_id) - Authorization checks
- `idx_games_self_registration` (self_registration_enabled, status, archived) - Player joining
- `idx_games_setup_status` (host_id, id) WHERE status = 'setup' - Setup game modifications

### teams
Teams participating in games.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Team's unique identifier |
| game_id | uuid | FK to games.id | Which game team belongs to |
| name | varchar | 1-50 chars | Team name |
| display_color | varchar | DEFAULT '#FF0000', hex color | Team's display color |
| current_score | integer | DEFAULT 0, >= 0 | Current team score |
| created_at | timestamptz | DEFAULT now() | Team creation time |

**Constraints:**
- UNIQUE (game_id, name) - Team names must be unique within a game

**Indexes:**
- `idx_teams_game_id` (game_id)
- `idx_teams_name` (name)
- `idx_teams_created_at` (created_at)
- `idx_teams_game_id_name` (game_id, name) - Host team management
- `idx_teams_id_game_id` (id, game_id) - Authorization lookups
- `idx_team_count_by_game` (game_id) - Team count validation

### team_players
Players belonging to teams (many-to-many relationship).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Relationship's unique identifier |
| team_id | uuid | FK to teams.id | Team the player joined |
| user_id | uuid | FK to user_profiles.id | Player who joined |
| joined_at | timestamptz | DEFAULT now() | When player joined team |

**Constraints:**
- UNIQUE (team_id, user_id) - Player can only be on one team per game

**Indexes:**
- `idx_team_players_team_id` (team_id)
- `idx_team_players_player_id` (user_id)
- `idx_team_players_joined_at` (joined_at)
- `idx_team_players_team_id_user_id` (team_id, user_id) - Host team roster management
- `idx_team_players_user_id` (user_id) - Player's team assignments
- `idx_team_players_game_lookup` (user_id, team_id) - Game participation queries
- `idx_authorization_chain` (user_id, team_id) INCLUDE (id) - Authorization optimization

### rounds
Game rounds and their status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Round's unique identifier |
| game_id | uuid | FK to games.id | Which game the round belongs to |
| round_number | integer | >= 1 | Round sequence number |
| status | varchar | DEFAULT 'pending' | pending/active/completed |
| start_time | timestamptz | NULL | When round started |
| end_time | timestamptz | NULL | When round ended |
| created_at | timestamptz | DEFAULT now() | Round creation time |

**Constraints:**
- UNIQUE (game_id, round_number) - Round numbers must be unique within a game

**Indexes:**
- `idx_rounds_game_id` (game_id)
- `idx_rounds_round_number` (round_number)
- `idx_rounds_status` (status)
- `idx_rounds_start_time` (start_time)
- `idx_rounds_game_id_round_number` (game_id, round_number) - Host round management
- `idx_rounds_status_game_id` (status, game_id) WHERE status IN ('active', 'completed') - Player queries

### questions
Trivia questions and answer choices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Question's unique identifier |
| category | text | NOT NULL | Question category |
| question | text | NOT NULL | The question text |
| a | text | NULL | Answer choice A |
| b | text | NULL | Answer choice B |
| c | text | NULL | Answer choice C |
| d | text | NULL | Answer choice D |
| metadata | jsonb | NULL | Additional question data |
| created_at | timestamptz | NULL | Question creation time |
| updated_at | timestamptz | NULL | Last question update |

**Note:** Contains 61,254 questions across various categories.

**Indexes:**
- `idx_questions_category` (category)
- `idx_questions_created_at` (created_at DESC)

### round_questions
Questions assigned to specific rounds.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Assignment's unique identifier |
| round_id | uuid | FK to rounds.id | Which round the question is in |
| question_id | uuid | FK to questions.id | Which question is assigned |
| question_order | integer | >= 1 | Order of question in round |
| revealed_at | timestamptz | NULL | When question was revealed to players |
| created_at | timestamptz | DEFAULT now() | Assignment creation time |

**Constraints:**
- UNIQUE (round_id, question_id) - Question can't be duplicated in a round
- UNIQUE (round_id, question_order) - Question order must be unique in round

**Indexes:**
- `idx_round_questions_round_id` (round_id)
- `idx_round_questions_question_id` (question_id)
- `idx_round_questions_order` (question_order)
- `idx_round_questions_round_order` (round_id, question_order)
- `idx_round_questions_round_id_order` (round_id, question_order) - Host and player question display
- `idx_round_questions_active` (round_id, question_order, revealed_at) WHERE revealed_at IS NOT NULL - Active questions

### team_answers
Team responses to questions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Answer's unique identifier |
| team_id | uuid | FK to teams.id | Which team submitted answer |
| round_question_id | uuid | FK to round_questions.id | Which question was answered |
| round_id | uuid | FK to rounds.id | Which round the answer belongs to |
| submitted_by | uuid | FK to user_profiles.id | Team member who submitted |
| answer | char | A/B/C/D | The team's answer choice |
| is_correct | boolean | NOT NULL | Whether answer was correct |
| points_earned | integer | DEFAULT 0, >= 0 | Points awarded for answer |
| submitted_at | timestamptz | DEFAULT now() | When answer was submitted |

**Constraints:**
- UNIQUE (team_id, round_question_id) - Team can only answer each question once

**Indexes:**
- `idx_team_answers_team_id` (team_id)
- `idx_team_answers_round_question_id` (round_question_id)
- `idx_team_answers_submitted_by` (submitted_by)
- `idx_team_answers_is_correct` (is_correct)
- `idx_team_answers_submitted_at` (submitted_at)
- `idx_team_answers_round_team` (round_id, team_id) - Scoring and review
- `idx_team_answers_question_team` (round_question_id, team_id) - Detailed review

### host_used_questions
Tracks questions used by hosts to prevent repetition.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Record's unique identifier |
| host_id | uuid | FK to user_profiles.id | Host who used the question |
| question_id | uuid | FK to questions.id | Question that was used |
| used_at | timestamptz | DEFAULT now() | When question was used |

**Constraints:**
- UNIQUE (host_id, question_id) - Prevents duplicate tracking

**Indexes:**
- `idx_host_used_questions_host_id` (host_id)
- `idx_host_used_questions_question_id` (question_id)
- `idx_host_used_questions_lookup` (host_id, question_id)
- `idx_host_used_questions_used_at` (used_at)

## Relationships

### Primary Relationships
```
user_profiles (1) ----< games (host_id)
games (1) ----< teams (game_id)
games (1) ----< rounds (game_id)
teams (1) ----< team_players (team_id)
user_profiles (1) ----< team_players (user_id)
rounds (1) ----< round_questions (round_id)
questions (1) ----< round_questions (question_id)
teams (1) ----< team_answers (team_id)
round_questions (1) ----< team_answers (round_question_id)
user_profiles (1) ----< team_answers (submitted_by)
user_profiles (1) ----< host_used_questions (host_id)
questions (1) ----< host_used_questions (question_id)
```

### Data Flow
1. **Game Setup**: Host creates game → rounds are created → questions assigned to rounds
2. **Team Formation**: Players create/join teams for the game
3. **Gameplay**: Teams answer round questions → answers recorded with scoring
4. **Tracking**: Used questions are logged to prevent repetition for the host

## Security Model (Row Level Security)

All tables have RLS enabled with comprehensive policies for host and player access control:

### user_profiles
- **Own Profile Access**: Users can view and update their own profile, including role preference
- **Team Assignment Access**: Authenticated users can view other profiles for team assignment purposes
- **Role Validation**: Host operations require `preferred_role = 'host'`

### games
- **Host Game Management**: Hosts can create, view, and update (setup only) their own games
- **Host Restrictions**: Only users with `preferred_role = 'host'` can create games
- **Player Game Access**: Players can view active/completed games they participate in
- **Public Game Discovery**: Authenticated users can view non-archived games with self-registration enabled

### teams
- **Host Team Management**: Hosts can create, view, update, and delete teams in their games (setup only)
- **Player Team Visibility**: Players can view teams in games they participate in
- **Setup Restrictions**: Team modifications limited to games in 'setup' status

### team_players
- **Host Player Assignment**: Hosts can assign/remove players to/from teams in their games (setup only)
- **Host Team Visibility**: Hosts can view all team players in their games
- **Player Self-Management**: Players can view their own team assignments
- **Self-Registration**: Players can join teams when game allows self-registration (setup only)

### rounds
- **Host Round Management**: Hosts can view and update rounds in their games
- **Player Round Access**: Players can view rounds in active/completed games they participate in

### round_questions
- **Host Question Management**: Hosts have full access (ALL operations) to round questions in their games
- **Player Question Access**: Players can view questions in active rounds they participate in

### Helper Functions
- `is_game_host(game_id, user_id)`: Checks if user is host of specified game
- `has_host_role(user_id)`: Verifies user has host role preference
- `game_allows_modifications(game_id)`: Checks if game is in modifiable state (setup, non-archived)

## Performance Considerations

### Critical Indexes for Host Operations
- **Host Game Management**: `idx_games_host_id_status`, `idx_games_setup_status`
- **Authorization Checks**: `idx_games_id_host_id`, `idx_teams_id_game_id`
- **Team Management**: `idx_teams_game_id_name`, `idx_team_players_team_id_user_id`
- **Round Progression**: `idx_rounds_game_id_round_number`
- **Question Display**: `idx_round_questions_round_id_order`, `idx_round_questions_active`
- **Player Discovery**: `idx_games_self_registration` for joinable games
- **Role-based Queries**: `idx_user_profiles_role` for host/player filtering

### Optimized Query Patterns
- **Host Dashboard**: `games(host_id, status)` with non-archived filter
- **Team Roster Management**: `team_players(team_id, user_id)` with game authorization
- **Player Game Joining**: `games(self_registration_enabled, status, archived)`
- **Authorization Chain**: `user_id → team_id → game_id → host_id` verification
- **Round Progression**: `rounds(game_id, round_number)` with status updates
- **Question Reveal**: `round_questions(round_id, question_order, revealed_at)`
- **Scoring Queries**: `team_answers(round_id, team_id)` for round-based scoring

### Partial Index Benefits
- **Setup Games**: `idx_games_setup_status` WHERE status = 'setup' (frequent modifications)
- **Active Rounds**: `idx_rounds_status_game_id` WHERE status IN ('active', 'completed')
- **Revealed Questions**: `idx_round_questions_active` WHERE revealed_at IS NOT NULL
- **Host Operations**: Filtered by `archived = false` and role-based conditions

## Extensions Used
- **pgcrypto**: For UUID generation and cryptographic functions
- **uuid-ossp**: Additional UUID utilities
- **pg_stat_statements**: Query performance monitoring
- **supabase_vault**: Secure secret storage
- **pg_graphql**: GraphQL API support

## Data Volumes
- **questions**: 61,254 rows (large read-only dataset)
- **user_profiles**: 1 row (development/testing)
- **Other tables**: Empty (new application)
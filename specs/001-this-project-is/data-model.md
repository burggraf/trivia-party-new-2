# Data Model: Single-User Trivia Game

## Existing Entities

### questions (existing table)
**Purpose**: Stores trivia questions with multiple choice answers
**Fields**:
- `id`: uuid (primary key)
- `category`: text (question category, e.g., "Science", "History")
- `question`: text (the trivia question)
- `a`: text (correct answer - always the correct choice)
- `b`: text (incorrect option)
- `c`: text (incorrect option)
- `d`: text (incorrect option)
- `metadata`: jsonb (additional question metadata)
- `created_at`: timestamptz
- `updated_at`: timestamptz

**Validation Rules**:
- All answer fields (a, b, c, d) must be non-empty
- Category must match available categories list
- Question text must be unique within category

## New Entities

### user_profiles
**Purpose**: Extended user profile information beyond Supabase Auth
**Fields**:
- `id`: uuid (primary key, references auth.users.id)
- `username`: text (display name)
- `avatar_url`: text (optional profile picture)
- `total_games_played`: integer (default 0)
- `total_correct_answers`: integer (default 0)
- `total_questions_answered`: integer (default 0)
- `favorite_categories`: text[] (array of preferred categories)
- `created_at`: timestamptz
- `updated_at`: timestamptz

**Relationships**:
- One-to-one with auth.users
- One-to-many with game_sessions

**Validation Rules**:
- Username must be unique and 3-50 characters
- Total counters must be non-negative
- Favorite categories must exist in questions.category values

### game_sessions
**Purpose**: Represents a complete trivia game session
**Fields**:
- `id`: uuid (primary key)
- `user_id`: uuid (foreign key to user_profiles.id)
- `status`: enum ('setup', 'in_progress', 'paused', 'completed')
- `total_rounds`: integer
- `questions_per_round`: integer
- `selected_categories`: text[] (categories chosen for this session)
- `current_round`: integer (1-based, current round number)
- `current_question_index`: integer (0-based index within current round)
- `total_score`: integer (correct answers across all rounds)
- `start_time`: timestamptz
- `end_time`: timestamptz (null if not completed)
- `total_duration_ms`: bigint (total time in milliseconds)
- `created_at`: timestamptz
- `updated_at`: timestamptz

**Relationships**:
- Many-to-one with user_profiles
- One-to-many with game_rounds
- One-to-many with game_questions

**Validation Rules**:
- Status must be valid enum value
- Current round <= total_rounds
- Current question index >= 0
- Total score >= 0
- Start time required, end time only if completed

**State Transitions**:
- setup → in_progress (when first question displayed)
- in_progress → paused (user leaves/closes app)
- paused → in_progress (user returns and resumes)
- in_progress → completed (all rounds finished)

### game_rounds
**Purpose**: Tracks individual rounds within a game session
**Fields**:
- `id`: uuid (primary key)
- `game_session_id`: uuid (foreign key to game_sessions.id)
- `round_number`: integer (1-based round number)
- `categories`: text[] (categories for this specific round)
- `questions_count`: integer (number of questions in this round)
- `correct_answers`: integer (correct answers in this round)
- `round_score`: integer (score for this round)
- `start_time`: timestamptz
- `end_time`: timestamptz (null if not completed)
- `duration_ms`: bigint (round duration in milliseconds)
- `created_at`: timestamptz

**Relationships**:
- Many-to-one with game_sessions
- One-to-many with game_questions (for questions in this round)

**Validation Rules**:
- Round number must be within 1 to parent session's total_rounds
- Questions count > 0
- Correct answers <= questions count
- Categories must be subset of session's selected categories

### game_questions
**Purpose**: Links questions to game sessions with user answers and timing
**Fields**:
- `id`: uuid (primary key)
- `game_session_id`: uuid (foreign key to game_sessions.id)
- `game_round_id`: uuid (foreign key to game_rounds.id)
- `question_id`: uuid (foreign key to questions.id)
- `question_order`: integer (position within round, 0-based)
- `presented_answers`: jsonb (randomized answer order as presented to user)
- `user_answer`: text (user's selected answer text)
- `correct_answer`: text (correct answer text, stored for historical accuracy)
- `is_correct`: boolean
- `time_to_answer_ms`: bigint (time taken to answer in milliseconds)
- `answered_at`: timestamptz
- `created_at`: timestamptz

**Relationships**:
- Many-to-one with game_sessions
- Many-to-one with game_rounds
- Many-to-one with questions

**Validation Rules**:
- Question order must be unique within round
- User answer must match one of the presented answers
- Time to answer must be positive
- Is correct must match comparison of user_answer vs correct_answer

## Indexes and Performance

### Primary Indexes
- All tables have primary key indexes (uuid)
- Foreign key indexes automatically created

### Performance Indexes
```sql
-- Fast user session lookups
CREATE INDEX idx_game_sessions_user_status ON game_sessions(user_id, status);

-- Fast question category searches
CREATE INDEX idx_questions_category ON questions(category);

-- Fast game round lookups
CREATE INDEX idx_game_rounds_session ON game_rounds(game_session_id, round_number);

-- Fast question order within rounds
CREATE INDEX idx_game_questions_round_order ON game_questions(game_round_id, question_order);
```

## Row Level Security (RLS) Policies

### user_profiles
- SELECT: Users can view their own profile
- INSERT: Users can create their own profile on signup
- UPDATE: Users can update their own profile
- DELETE: Users can delete their own profile

### game_sessions
- SELECT: Users can view their own game sessions
- INSERT: Users can create game sessions for themselves
- UPDATE: Users can update their own game sessions
- DELETE: Users can delete their own game sessions

### game_rounds
- SELECT: Users can view rounds from their own game sessions
- INSERT: System can create rounds for user's game sessions
- UPDATE: System can update rounds for user's game sessions
- DELETE: Cascade delete with game sessions

### game_questions
- SELECT: Users can view questions from their own game sessions
- INSERT: System can create question records for user's game sessions
- UPDATE: System can update question records (for answers)
- DELETE: Cascade delete with game sessions

## Data Migration Strategy

### Phase 1: Core Tables
1. Create user_profiles table
2. Create game_sessions table with basic fields
3. Set up RLS policies

### Phase 2: Game Structure
1. Create game_rounds table
2. Create game_questions table
3. Add foreign key constraints

### Phase 3: Optimization
1. Add performance indexes
2. Create database functions for complex queries
3. Set up triggers for automatic counter updates
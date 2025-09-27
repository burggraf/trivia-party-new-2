# Data Model: Multi-User Trivia Database

## Entity Relationship Overview

```
auth.users (Supabase)
└── user_profiles (1:1) - Enhanced with display_name
    ├── games (1:many as host) - Event-based game instances
    └── team_players (many:many via teams) - Player participation

games (1:many)
├── teams (1:many) - Game-specific team entities
│   ├── team_players (1:many) - Team membership
│   └── team_answers (many:many via rounds) - Team responses
├── rounds (1:many) - Game rounds
│   └── round_questions (many:many) - Questions per round
└── host_used_questions (many:many) - Question tracking per host

questions (existing)
├── round_questions (many:many) - Assignment to rounds
├── host_used_questions (many:many) - Usage tracking
└── team_answers (many:many) - Team responses
```

## Table Definitions

### 1. Enhanced user_profiles (modify existing)
```sql
-- Add display_name field to existing table
ALTER TABLE user_profiles
ADD COLUMN display_name VARCHAR(50);

-- Update constraints
ALTER TABLE user_profiles
ADD CONSTRAINT display_name_length CHECK (
  LENGTH(TRIM(display_name)) BETWEEN 1 AND 50
);
```

**Purpose**: Enhanced user identity with TV-friendly display names
**Fields**: Existing + display_name (VARCHAR(50))
**Constraints**: Display name length 1-50 characters
**Relationships**: 1:many with games (as host), many:many with teams (as player)

### 2. games (new)
```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  scheduled_date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  max_teams INTEGER DEFAULT 20 NOT NULL,
  max_players_per_team INTEGER DEFAULT 4 NOT NULL,
  status game_status DEFAULT 'setup' NOT NULL,
  total_rounds INTEGER NOT NULL,
  questions_per_round INTEGER NOT NULL,
  selected_categories TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TYPE game_status AS ENUM ('setup', 'in_progress', 'completed', 'cancelled');
```

**Purpose**: Event-based game instances with scheduling and configuration
**Validation Rules**:
- max_teams: 1-20
- max_players_per_team: 1-4
- total_rounds > 0
- questions_per_round > 0
- selected_categories not empty
- end_time > start_time (when both set)

### 3. teams (new)
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  display_color VARCHAR(7) DEFAULT '#000000',
  current_score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Purpose**: Game-specific team entities (temporary, tied to single game)
**Validation Rules**:
- name length 1-50 characters
- display_color valid hex format
- current_score >= 0
- Unique team name per game

### 4. team_players (new)
```sql
CREATE TABLE team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(team_id, player_id)
);
```

**Purpose**: Team membership tracking with join timestamps
**Validation Rules**:
- One team per player per game (enforced via unique constraint + check)
- Player can't join multiple teams in same game

### 5. rounds (new, replaces game_rounds)
```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  status round_status DEFAULT 'pending' NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TYPE round_status AS ENUM ('pending', 'in_progress', 'completed');
```

**Purpose**: Game rounds within multi-user games
**Validation Rules**:
- round_number > 0
- Unique round_number per game
- end_time > start_time (when both set)

### 6. round_questions (new)
```sql
CREATE TABLE round_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(round_id, question_order),
  UNIQUE(round_id, question_id)
);
```

**Purpose**: Questions assigned to specific rounds with ordering
**Validation Rules**:
- question_order > 0
- Unique order per round
- No duplicate questions per round

### 7. team_answers (new)
```sql
CREATE TABLE team_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_question_id UUID NOT NULL REFERENCES round_questions(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  answer VARCHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0 NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(team_id, round_question_id)
);
```

**Purpose**: Team responses to questions with scoring
**Validation Rules**:
- answer IN ('A', 'B', 'C', 'D')
- points_earned >= 0
- One answer per team per question
- submitted_by must be member of team

### 8. host_used_questions (new)
```sql
CREATE TABLE host_used_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(host_id, question_id)
);
```

**Purpose**: Prevent question repetition per host across all games
**Validation Rules**:
- Unique question per host (enforced globally)
- Automatic population when questions assigned to rounds

## State Transitions

### Game Status Flow
- setup → in_progress → completed
- setup → cancelled
- in_progress → completed

### Round Status Flow
- pending → in_progress → completed

### Team Formation Rules
- Teams can be modified only when game.status = 'setup'
- Player roster locked when game starts
- Team answers only accepted when round.status = 'in_progress'

## Performance Indexes

```sql
-- Foreign key indexes
CREATE INDEX idx_games_host_id ON games(host_id);
CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_player_id ON team_players(player_id);
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_round_questions_round_id ON round_questions(round_id);
CREATE INDEX idx_team_answers_team_id ON team_answers(team_id);
CREATE INDEX idx_team_answers_round_question_id ON team_answers(round_question_id);

-- Query optimization indexes
CREATE INDEX idx_games_status_date ON games(status, scheduled_date);
CREATE INDEX idx_host_used_questions_lookup ON host_used_questions(host_id, question_id);
CREATE INDEX idx_team_players_game_constraint ON team_players(player_id, team_id);
```

## Row Level Security Policies

### games table
- Host can CRUD own games
- Players can view games they're participating in

### teams table
- Host can CRUD teams for their games
- Players can view teams for games they're in

### team_players table
- Host can manage team membership for their games
- Players can view membership for their games
- Players can join teams (INSERT only when game.status = 'setup')

### team_answers table
- Host can view all answers for their games
- Team members can view/insert answers for their team only
- INSERT only when round.status = 'in_progress'
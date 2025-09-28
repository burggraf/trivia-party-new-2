# Data Model: Game Management System

**Date**: 2025-09-27
**Feature**: Game Management System
**Branch**: 002-game-management-specify

## Entity Definitions

### Enhanced User Profile

**Entity**: `UserProfile` (extends existing)
**Purpose**: Store user preferences and host-specific settings

**New Fields**:
```typescript
interface UserProfileExtensions {
  preferred_role?: 'host' | 'player';  // Persistent role preference
}
```

**Validation Rules**:
- `preferred_role` must be either 'host' or 'player' if specified
- Default: null (requires role selection on first login)

**State Transitions**:
- `null` → `'host'` | `'player'` (initial selection)
- `'host'` ↔ `'player'` (user can change preference)

### Enhanced Game Entity

**Entity**: `Game` (extends existing)
**Purpose**: Comprehensive game configuration with host management features

**New Fields**:
```typescript
interface GameExtensions {
  archived: boolean;                    // Soft delete flag
  self_registration_enabled: boolean;   // Team self-registration toggle
  min_players_per_team: number;        // Minimum team size (1-4)
}
```

**Validation Rules**:
- `archived` defaults to false
- `self_registration_enabled` defaults to true
- `min_players_per_team` must be 1-4 and ≤ `max_players_per_team`
- Only hosts can modify games they created
- Games in 'in_progress' or 'completed' status cannot be modified

**State Transitions**:
```
setup → in_progress → completed
setup → cancelled
setup → archived (soft delete)
```

### Enhanced Round Entity

**Entity**: `Round` (extends existing)
**Purpose**: Per-round customization with category overrides

**New Fields**:
```typescript
interface RoundExtensions {
  custom_categories?: string[];         // Override default game categories
  questions_per_round?: number;        // Override default question count
}
```

**Validation Rules**:
- `custom_categories` defaults to game's `selected_categories`
- `questions_per_round` defaults to game's `questions_per_round`
- Must have at least 1 category and 1 question per round
- Categories must exist in question database

### Host Configuration Entity

**Entity**: `HostConfiguration` (new virtual entity)
**Purpose**: Aggregate host preferences and settings

**Fields**:
```typescript
interface HostConfiguration {
  user_id: string;                      // FK to user_profiles.id
  preferred_game_settings: {
    default_rounds: number;             // Default round count
    default_questions_per_round: number; // Default questions
    favorite_categories: string[];      // Preferred categories
    default_team_settings: {
      max_teams: number;
      max_players_per_team: number;
      min_players_per_team: number;
      self_registration_enabled: boolean;
    };
  };
  question_usage_stats: {
    total_games_hosted: number;
    unique_questions_used: number;
    favorite_categories: string[];
  };
}
```

**Note**: This is a derived entity combining data from multiple tables rather than a new database table.

### Game Management State

**Entity**: `GameManagementState` (frontend state)
**Purpose**: UI state for game creation and editing workflows

**Fields**:
```typescript
interface GameManagementState {
  current_step: 'basic' | 'rounds' | 'questions' | 'teams' | 'review';
  game_draft: Partial<Game>;
  rounds_config: RoundConfiguration[];
  question_assignments: QuestionAssignment[];
  team_setup: TeamSetupConfiguration[];
  validation_errors: ValidationError[];
  is_generating_questions: boolean;
  generation_progress?: {
    current_round: number;
    total_rounds: number;
    questions_found: number;
    questions_needed: number;
  };
}

interface RoundConfiguration {
  round_number: number;
  categories: string[];
  questions_per_round: number;
  assigned_questions?: Question[];
}

interface QuestionAssignment {
  round_id: string;
  question_id: string;
  question_order: number;
  replacement_options?: Question[];
}

interface TeamSetupConfiguration {
  name: string;
  display_color: string;
  assigned_players: UserProfile[];
  is_complete: boolean;
}
```

## Entity Relationships

### Core Relationships (unchanged)
```
UserProfile (1) ----< Game (host_id)
Game (1) ----< Round (game_id)
Game (1) ----< Team (game_id)
Team (1) ----< TeamPlayer (team_id)
Round (1) ----< RoundQuestion (round_id)
```

### Enhanced Relationships
```
UserProfile.preferred_role influences → Dashboard routing
Game.archived affects → Game visibility in lists
Round.custom_categories overrides → Game.selected_categories
HostUsedQuestion tracks → Question reuse per host
```

## Database Schema Changes

### Required Migrations

**Migration 1**: User Profile Extensions
```sql
ALTER TABLE user_profiles
ADD COLUMN preferred_role VARCHAR(10) CHECK (preferred_role IN ('host', 'player'));
```

**Migration 2**: Game Management Extensions
```sql
ALTER TABLE games
ADD COLUMN archived BOOLEAN DEFAULT FALSE,
ADD COLUMN self_registration_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN min_players_per_team INTEGER DEFAULT 1 CHECK (min_players_per_team BETWEEN 1 AND 4);

-- Add constraint to ensure min <= max players
ALTER TABLE games
ADD CONSTRAINT check_team_size_valid
CHECK (min_players_per_team <= max_players_per_team);
```

**Migration 3**: Round Customization Extensions
```sql
ALTER TABLE rounds
ADD COLUMN custom_categories TEXT[],
ADD COLUMN questions_per_round INTEGER;
```

### Index Optimizations

**New Indexes**:
```sql
-- Optimize host game queries
CREATE INDEX idx_games_host_archived ON games(host_id, archived);
CREATE INDEX idx_games_status_archived ON games(status, archived);

-- Optimize role-based queries
CREATE INDEX idx_user_profiles_preferred_role ON user_profiles(preferred_role);

-- Optimize round customization queries
CREATE INDEX idx_rounds_custom_categories ON rounds USING GIN(custom_categories);
```

## Validation Rules Summary

### Business Logic Constraints

1. **Role Management**:
   - Users must select a role before accessing main features
   - Role preference persists across sessions but can be overridden

2. **Game Lifecycle**:
   - Only hosts can create/modify/delete games
   - Games in 'in_progress' or 'completed' cannot be modified
   - Archived games are hidden from active lists but preserved

3. **Team Configuration**:
   - Min players per team ≤ Max players per team
   - Cannot reduce max teams below current registered teams
   - Self-registration can be toggled by host

4. **Question Management**:
   - Must have sufficient questions for game configuration
   - Duplicate questions allowed with warnings
   - Question usage tracked per host

5. **Round Customization**:
   - Each round must have ≥1 category and ≥1 question
   - Custom categories override game defaults
   - Question count can vary per round

## State Management Patterns

### Context Integration

**GameContext Extensions**:
```typescript
interface GameContextState {
  // Existing state...
  hostManagement: {
    games: Game[];
    currentGame?: Game;
    gameWizard: GameManagementState;
    questionPreviews: Record<string, Question[]>;
    teamManagement: TeamManagementState;
  };
}

interface GameContextActions {
  // Existing actions...
  hostActions: {
    loadHostGames: (hostId: string) => Promise<void>;
    createGame: (gameData: CreateGameRequest) => Promise<Game>;
    updateGame: (gameId: string, updates: Partial<Game>) => Promise<Game>;
    archiveGame: (gameId: string) => Promise<void>;
    deleteGame: (gameId: string) => Promise<void>;
    generateQuestions: (gameId: string) => Promise<void>;
    replaceQuestion: (roundId: string, oldQuestionId: string, newQuestionId: string) => Promise<void>;
    createTeam: (gameId: string, teamData: CreateTeamRequest) => Promise<Team>;
    updateUserRole: (userId: string, role: 'host' | 'player') => Promise<void>;
  };
}
```

### Data Flow Patterns

1. **Role Selection Flow**:
   ```
   Login → Check preferred_role → Route to dashboard OR role selection
   Role Selection → Update user profile → Route to appropriate dashboard
   ```

2. **Game Management Flow**:
   ```
   Host Dashboard → Create/Edit Game → Game Wizard → Generate Questions → Preview/Replace → Team Setup → Game Ready
   ```

3. **Question Generation Flow**:
   ```
   Select Categories → Check Used Questions → Generate Assignments → Show Duplicates Warning → Allow Replacement
   ```

---

**Data Model Complete**: All entities, relationships, and validation rules defined for implementation
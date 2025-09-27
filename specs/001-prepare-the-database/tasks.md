# Tasks: Prepare the Database for Multi-User Games

**Input**: Design documents from `/Users/markb/dev/trivia-party-new-2/specs/001-prepare-the-database/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Execution Flow Summary
Transform single-player trivia database into multi-user system with 8 database tables, TypeScript contracts, service layer extensions, and comprehensive testing.

**Tech Stack**: TypeScript ES2022, React 19+, Supabase PostgreSQL, Vitest, Playwright
**Database**: 7 new tables + 1 modified existing table
**Constraints**: 1-4 players per team, max 20 teams per game, question uniqueness per host

## Phase 3.1: Database Schema Setup
- [x] T001 [P] Create migration 008_user_profiles_display_name.sql to add display_name field to user_profiles
- [x] T002 [P] Create migration 009_games_table.sql with event-based game instances and constraints
- [x] T003 [P] Create migration 010_teams_table.sql with game-specific teams and validation
- [x] T004 [P] Create migration 011_team_players_table.sql with membership tracking and uniqueness
- [x] T005 [P] Create migration 012_rounds_table.sql for game rounds with status tracking
- [x] T006 [P] Create migration 013_round_questions_table.sql for question assignment to rounds
- [x] T007 [P] Create migration 014_team_answers_table.sql for team responses with constraints
- [x] T008 [P] Create migration 015_host_used_questions.sql to prevent question repetition

## Phase 3.2: TypeScript Contracts (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T009 [P] Copy multi-user-types.ts to src/contracts/multi-user-types.ts with all interface definitions
- [x] T010 [P] Copy multi-user-database.test.ts to src/services/__tests__/multi-user-database.test.ts
- [x] T011 [P] Create src/contracts/multi-user-game.ts extending existing GameService interface

## Phase 3.3: Service Layer Implementation (ONLY after tests are failing)
- [x] T012 Extend src/services/game.ts with createGame, getHostGames, startGame methods from MultiUserGameService
- [x] T013 Add team management methods to src/services/game.ts: createTeam, joinTeam, getGameTeams, leaveTeam
- [x] T014 Implement question uniqueness in src/services/game.ts: getAvailableQuestions, markQuestionsUsed methods
- [x] T015 Add round management to src/services/game.ts: startRound, completeRound, getRoundQuestions methods
- [x] T016 Implement team answer handling in src/services/game.ts: submitTeamAnswer, getTeamAnswers, getRoundAnswers

## Phase 3.4: Integration & Validation
- [x] T017 [P] Create src/__tests__/integration/multi-user-game-flow.test.ts testing complete game workflow
- [x] T018 [P] Create src/__tests__/integration/team-management.test.ts testing team formation and player joining
- [x] T019 [P] Create src/__tests__/integration/question-uniqueness.test.ts testing host question tracking
- [x] T020 Run database migrations and execute quickstart.md verification steps

## Dependencies
**Database First**: T001-T008 create schema before any service implementation
**TDD Order**: T009-T011 (tests) before T012-T016 (implementation)
**Service Dependencies**:
- T012 (base game methods) blocks T013-T016
- T013 (team management) blocks T017-T018
- T014 (question uniqueness) blocks T019
**Integration Last**: T017-T019 require T012-T016 complete

## Parallel Example
```bash
# Phase 3.1 - All migration files can be written simultaneously:
Task: "Create migration 008_user_profiles_display_name.sql to add display_name field"
Task: "Create migration 009_games_table.sql with event-based game instances"
Task: "Create migration 010_teams_table.sql with game-specific teams"
Task: "Create migration 011_team_players_table.sql with membership tracking"
Task: "Create migration 012_rounds_table.sql for game rounds"
Task: "Create migration 013_round_questions_table.sql for question assignment"
Task: "Create migration 014_team_answers_table.sql for team responses"
Task: "Create migration 015_host_used_questions.sql to prevent repetition"

# Phase 3.2 - Contract files are independent:
Task: "Copy multi-user-types.ts to src/contracts/multi-user-types.ts"
Task: "Copy multi-user-database.test.ts to src/services/__tests__/"
Task: "Create src/contracts/multi-user-game.ts extending GameService"

# Phase 3.4 - Integration tests can run parallel:
Task: "Create multi-user-game-flow.test.ts testing complete workflow"
Task: "Create team-management.test.ts testing team formation"
Task: "Create question-uniqueness.test.ts testing host tracking"
```

## Detailed Task Specifications

### Database Migrations
Each migration file should:
- Follow sequential numbering (008-015)
- Include proper foreign key relationships
- Add check constraints for business rules
- Create appropriate indexes for performance
- Include RLS policies for security
- Add UPDATE trigger for updated_at fields

### TypeScript Contracts
Contract files should:
- Export all interface definitions
- Include proper type annotations
- Extend existing contracts where applicable
- Provide complete API surface for multi-user features

### Service Implementation
Service methods should:
- Use existing Supabase client patterns
- Include proper error handling
- Follow TDD approach (make tests pass)
- Implement all MultiUserGameService interface methods
- Maintain transaction integrity for complex operations

### Integration Tests
Test files should:
- Cover complete user workflows
- Test constraint violations
- Verify real-time functionality
- Use test database isolation
- Assert proper data relationships

## Success Criteria
✅ All 8 migration files created with proper schema
✅ TypeScript contracts compile without errors
✅ All contract tests initially fail, then pass after implementation
✅ Service layer implements all MultiUserGameService methods
✅ Integration tests cover host and player workflows
✅ Question uniqueness enforced across all games
✅ Team constraints properly validated (1-4 players, one team per game)
✅ Real-time updates work via Supabase channels

## File Path Reference
```
supabase/migrations/
├── 008_user_profiles_display_name.sql
├── 009_games_table.sql
├── 010_teams_table.sql
├── 011_team_players_table.sql
├── 012_rounds_table.sql
├── 013_round_questions_table.sql
├── 014_team_answers_table.sql
└── 015_host_used_questions.sql

src/contracts/
├── multi-user-types.ts (copied from specs)
└── multi-user-game.ts (new interface)

src/services/
├── game.ts (extended)
└── __tests__/
    └── multi-user-database.test.ts

src/__tests__/integration/
├── multi-user-game-flow.test.ts
├── team-management.test.ts
└── question-uniqueness.test.ts
```

## Notes
- [P] tasks = different files, no dependencies, can run in parallel
- Verify contract tests fail before implementing service methods
- Run migrations via `supabase db push` after creating files
- Use existing patterns from src/services/game.ts for consistency
- Follow existing test patterns from src/services/__tests__/
- All new database operations must include proper RLS policies
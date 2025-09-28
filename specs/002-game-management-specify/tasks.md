# Tasks: Game Management System

**Input**: Design documents from `/Users/markb/dev/trivia-party-new-2/specs/002-game-management-specify/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript ES2022, React 19+, Shadcn UI, Supabase
   → Structure: React SPA frontend with Supabase backend
2. Load design documents:
   → data-model.md: UserProfile, Game, Round extensions
   → contracts/: HostGameService interface, React component props
   → quickstart.md: 8 test scenarios for validation
3. Generate tasks by category:
   → Setup: Database migrations, TypeScript types
   → Tests: Contract tests, component tests, integration tests
   → Core: Service extensions, React components
   → Integration: Context integration, routing, RLS policies
   → Polish: Performance optimization, accessibility validation
4. Apply TDD rules: All tests before implementation
5. Mark parallel execution opportunities [P]
6. Validate complete coverage of all requirements
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Database & Setup

- [x] T001 Create database migration for user_profiles.preferred_role in `supabase/migrations/20250927_001_add_user_role_preference.sql`
- [x] T002 Create database migration for games table extensions in `supabase/migrations/20250927_002_extend_games_table.sql`
- [x] T003 Create database migration for rounds table extensions in `supabase/migrations/20250927_003_extend_rounds_table.sql`
- [x] T004 [P] Create host management TypeScript contracts in `src/contracts/host-management.ts`
- [x] T005 [P] Create host component interfaces in `src/contracts/host-components.ts`
- [x] T006 [P] Create host-specific error types in `src/contracts/host-errors.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Service Layer Contract Tests
- [ ] T007 [P] Contract test for role selection service in `src/services/__tests__/host-role.test.ts`
- [ ] T008 [P] Contract test for host game management in `src/services/__tests__/host-game-management.test.ts`
- [ ] T009 [P] Contract test for question generation service in `src/services/__tests__/host-question-generation.test.ts`
- [ ] T010 [P] Contract test for team management service in `src/services/__tests__/host-team-management.test.ts`

### Component Tests
- [ ] T011 [P] Test RoleSelection component in `src/components/auth/__tests__/RoleSelection.test.tsx`
- [ ] T012 [P] Test HostDashboard component in `src/components/host/__tests__/HostDashboard.test.tsx`
- [ ] T013 [P] Test GameWizard component in `src/components/host/__tests__/GameWizard.test.tsx`
- [ ] T014 [P] Test QuestionPreview component in `src/components/host/__tests__/QuestionPreview.test.tsx`
- [ ] T015 [P] Test TeamManager component in `src/components/host/__tests__/TeamManager.test.tsx`

### Integration Tests
- [ ] T016 [P] Integration test for role selection flow in `src/__tests__/integration/role-selection-flow.test.ts`
- [ ] T017 [P] Integration test for game creation workflow in `src/__tests__/integration/host-game-creation.test.ts`
- [ ] T018 [P] Integration test for question generation in `src/__tests__/integration/host-question-generation.test.ts`
- [ ] T019 [P] Integration test for team management in `src/__tests__/integration/host-team-management.test.ts`
- [ ] T020 [P] Integration test for game lifecycle management in `src/__tests__/integration/host-game-lifecycle.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database & RLS Updates
- [ ] T021 [P] Create RLS policies for host game management in `supabase/migrations/20250927_004_host_rls_policies.sql`
- [ ] T022 [P] Create database indexes for host queries in `supabase/migrations/20250927_005_host_query_indexes.sql`
- [ ] T023 Update DATABASE_SCHEMA.md with new fields and policies

### Service Layer Extensions
- [ ] T024 Extend gameService with role management methods in `src/services/game.ts`
- [ ] T025 Extend gameService with host game management methods in `src/services/game.ts`
- [ ] T026 Extend gameService with question generation methods in `src/services/game.ts`
- [ ] T027 Extend gameService with team management methods in `src/services/game.ts`

### Component Implementation
- [ ] T028 [P] Create RoleSelection component in `src/components/auth/RoleSelection.tsx`
- [ ] T029 [P] Create HostDashboard component in `src/components/host/HostDashboard.tsx`
- [ ] T030 [P] Create GameCard component in `src/components/host/GameCard.tsx`
- [ ] T031 [P] Create GameWizard component in `src/components/host/GameWizard.tsx`
- [ ] T032 [P] Create BasicGameInfoStep component in `src/components/host/wizard/BasicGameInfoStep.tsx`
- [ ] T033 [P] Create RoundConfigurationStep component in `src/components/host/wizard/RoundConfigurationStep.tsx`
- [ ] T034 [P] Create QuestionGenerationStep component in `src/components/host/wizard/QuestionGenerationStep.tsx`
- [ ] T035 [P] Create TeamSetupStep component in `src/components/host/wizard/TeamSetupStep.tsx`
- [ ] T036 [P] Create GameReviewStep component in `src/components/host/wizard/GameReviewStep.tsx`
- [ ] T037 [P] Create QuestionPreview component in `src/components/host/QuestionPreview.tsx`
- [ ] T038 [P] Create TeamManager component in `src/components/host/TeamManager.tsx`
- [ ] T039 [P] Create TeamCard component in `src/components/host/TeamCard.tsx`

### Custom Hooks
- [ ] T040 [P] Create useGameWizard hook in `src/hooks/useGameWizard.ts`
- [ ] T041 [P] Create useHostGames hook in `src/hooks/useHostGames.ts`
- [ ] T042 [P] Create useQuestionManagement hook in `src/hooks/useQuestionManagement.ts`
- [ ] T043 [P] Create useTeamManagement hook in `src/hooks/useTeamManagement.ts`

## Phase 3.4: Integration & Context Updates

- [ ] T044 Extend AuthContext with role management in `src/contexts/AuthContext.tsx`
- [ ] T045 Extend GameContext with host management state in `src/contexts/GameContext.tsx`
- [ ] T046 Update Dashboard component to include role selection in `src/components/Dashboard.tsx`
- [ ] T047 Update App routing to include host routes in `src/App.tsx`
- [ ] T048 Create HostLayout component in `src/components/layout/HostLayout.tsx`

## Phase 3.5: Forms & Validation

- [ ] T049 [P] Create GameBasicInfoForm component in `src/components/host/forms/GameBasicInfoForm.tsx`
- [ ] T050 [P] Create CategorySelector component in `src/components/host/forms/CategorySelector.tsx`
- [ ] T051 [P] Create TeamForm component in `src/components/host/forms/TeamForm.tsx`
- [ ] T052 [P] Create PlayerSelector component in `src/components/host/forms/PlayerSelector.tsx`
- [ ] T053 [P] Create game validation schemas in `src/lib/validations/game-schemas.ts`
- [ ] T054 [P] Create team validation schemas in `src/lib/validations/team-schemas.ts`

## Phase 3.6: Polish & Performance

- [ ] T055 [P] Add lazy loading for host components in `src/components/host/index.ts`
- [ ] T056 [P] Optimize question preview performance with virtualization
- [ ] T057 [P] Add loading states and error boundaries for all host components
- [ ] T058 [P] Implement accessibility features (ARIA labels, keyboard navigation)
- [ ] T059 Run quickstart scenario 1 (Role Selection) validation
- [ ] T060 Run quickstart scenario 2 (Game Creation) validation
- [ ] T061 Run quickstart scenario 3 (Round Customization) validation
- [ ] T062 Run quickstart scenario 4 (Question Generation) validation
- [ ] T063 Run quickstart scenario 5 (Team Management) validation
- [ ] T064 Run quickstart scenario 6 (Game Lifecycle) validation
- [ ] T065 Run quickstart scenario 7 (Dashboard Analytics) validation
- [ ] T066 Run quickstart scenario 8 (Error Handling) validation
- [ ] T067 Performance validation: Core Web Vitals compliance
- [ ] T068 Bundle size optimization and code splitting verification

## Dependencies

### Critical Path
1. **Database Setup (T001-T003)** → **Service Tests (T007-T010)** → **Service Implementation (T024-T027)**
2. **Component Tests (T011-T015)** → **Component Implementation (T028-T039)**
3. **Integration Tests (T016-T020)** → **Context Integration (T044-T048)**

### Blocking Relationships
- T001-T003 must complete before any service work
- T007-T010 must complete before T024-T027
- T011-T015 must complete before T028-T039
- T024-T027 must complete before T044-T045
- T044-T048 must complete before validation scenarios T059-T066

### Service Layer Dependencies
- T024 (role management) blocks T044 (AuthContext)
- T025 (game management) blocks T045 (GameContext)
- T026-T027 (question/team) can run parallel after T025

### Component Dependencies
- T029 (HostDashboard) depends on T024-T025 (service layer)
- T031-T036 (GameWizard steps) depend on T025-T027 (service layer)
- T037 (QuestionPreview) depends on T026 (question service)
- T038-T039 (TeamManager) depend on T027 (team service)

## Parallel Execution Examples

### Phase 3.1 Setup (Parallel Database Migrations)
```
Task: "Create database migration for user_profiles.preferred_role in supabase/migrations/20250927_001_add_user_role_preference.sql"
Task: "Create database migration for games table extensions in supabase/migrations/20250927_002_extend_games_table.sql"
Task: "Create database migration for rounds table extensions in supabase/migrations/20250927_003_extend_rounds_table.sql"
```

### Phase 3.2 Contract Tests (All Parallel)
```
Task: "Contract test for role selection service in src/services/__tests__/host-role.test.ts"
Task: "Contract test for host game management in src/services/__tests__/host-game-management.test.ts"
Task: "Contract test for question generation service in src/services/__tests__/host-question-generation.test.ts"
Task: "Contract test for team management service in src/services/__tests__/host-team-management.test.ts"
```

### Phase 3.3 Component Implementation (Parallel by Feature Area)
```
Task: "Create HostDashboard component in src/components/host/HostDashboard.tsx"
Task: "Create QuestionPreview component in src/components/host/QuestionPreview.tsx"
Task: "Create TeamManager component in src/components/host/TeamManager.tsx"
Task: "Create useGameWizard hook in src/hooks/useGameWizard.ts"
```

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts (host-management.ts, host-components.ts) have corresponding tests
- [x] All entities (UserProfile, Game, Round extensions) have implementation tasks
- [x] All tests (T007-T020) come before implementation (T024-T054)
- [x] Parallel tasks [P] are truly independent (different files)
- [x] Each task specifies exact file path
- [x] Service layer extensions maintain existing patterns
- [x] Component architecture follows Shadcn UI conventions
- [x] All quickstart scenarios have validation tasks
- [x] Constitutional compliance verified (TDD, accessibility, performance)

## Notes
- [P] tasks target different files with no shared dependencies
- Verify all tests fail before implementing corresponding features
- Commit after each task completion
- Run `npm run lint` and `npm run build` after each phase
- All database migrations must be tested with both up and down operations
- Component tests must include accessibility and keyboard navigation validation
- Service tests must verify RLS policy enforcement
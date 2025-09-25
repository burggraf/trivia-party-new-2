# Tasks: Single-User Trivia Game

**Input**: Design documents from `/specs/001-this-project-is/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: React 18+, TypeScript, Shadcn UI, Supabase, Tailwind CSS
   → Structure: Frontend-only React application with external Supabase backend
2. Load optional design documents:
   → data-model.md: user_profiles, game_sessions, game_rounds, game_questions entities
   → contracts/: auth.ts, game.ts, database.ts contract files
   → research.md: React Context + useReducer, RLS policies, performance targets
3. Generate tasks by category:
   → Setup: React project, dependencies, Supabase configuration
   → Tests: Contract tests, component tests, integration tests
   → Core: Database schema, services, React components
   → Integration: Supabase integration, routing, state management
   → Polish: Performance optimization, accessibility, error handling
4. Apply task rules:
   → Different files = mark [P] for parallel execution
   → Tests before implementation (TDD approach)
   → Database setup before API development
5. Number tasks sequentially (T001-T040)
6. Validate completeness: All contracts tested, all entities modeled
7. Return: SUCCESS (40 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Project Setup

- [x] **T001** Create React TypeScript project with Vite build system
- [x] **T002** Install and configure core dependencies: React Router, Tailwind CSS, Shadcn UI CLI
- [x] **T003** Install Supabase client SDK and configure environment variables in `.env.local`
- [x] **T004** [P] Configure TypeScript strict mode in `tsconfig.json` with path aliases
- [x] **T005** [P] Configure ESLint and Prettier with React/TypeScript rules in `.eslintrc.json` and `.prettierrc`
- [x] **T006** [P] Setup Vitest and React Testing Library configuration in `vitest.config.ts`
- [x] **T007** [P] Configure Playwright for E2E testing in `playwright.config.ts`

## Phase 3.2: Database Schema (MUST COMPLETE BEFORE 3.3)

- [x] **T008** Create Supabase migration for `user_profiles` table with RLS policies in `supabase/migrations/001_user_profiles.sql`
- [x] **T009** Create Supabase migration for `game_sessions` table with foreign keys in `supabase/migrations/002_game_sessions.sql`
- [x] **T010** Create Supabase migration for `game_rounds` table with constraints in `supabase/migrations/003_game_rounds.sql`
- [x] **T011** Create Supabase migration for `game_questions` table with relationships in `supabase/migrations/004_game_questions.sql`
- [x] **T012** Create database indexes and performance optimization in `supabase/migrations/005_indexes.sql`
- [x] **T013** Setup Row Level Security policies for all tables in `supabase/migrations/006_rls_policies.sql`

## Phase 3.3: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.4
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] **T014** [P] Contract test for auth service in `src/services/__tests__/auth.test.ts`
- [x] **T015** [P] Contract test for game service in `src/services/__tests__/game.test.ts`
- [x] **T016** [P] Contract test for database edge functions in `src/services/__tests__/database.test.ts`
- [x] **T017** [P] Component test for auth components in `src/components/auth/__tests__/auth-components.test.tsx`
- [x] **T018** [P] Component test for game components in `src/components/game/__tests__/game-components.test.tsx`
- [x] **T019** [P] Integration test for user registration flow in `src/__tests__/integration/auth-flow.test.ts`
- [x] **T020** [P] Integration test for game session flow in `src/__tests__/integration/game-flow.test.ts`
- [x] **T021** [P] E2E test for complete user journey in `tests/e2e/user-journey.spec.ts`

## Phase 3.4: Supabase Edge Functions

- [x] **T022** [P] Create edge function for game setup logic in `supabase/functions/create-game-setup/index.ts`
- [x] **T023** [P] Create edge function for answer validation in `supabase/functions/validate-answer/index.ts`
- [x] **T024** [P] Create edge function for game completion in `supabase/functions/complete-game/index.ts`
- [x] **T025** [P] Create edge function for user statistics in `supabase/functions/user-stats/index.ts`

## Phase 3.5: Core Implementation (ONLY after tests are failing)

- [x] **T026** [P] Implement Supabase client configuration in `src/lib/supabase.ts`
- [x] **T027** [P] Implement auth service with login/logout/register in `src/services/auth.ts`
- [x] **T028** [P] Implement game service with session management in `src/services/game.ts`
- [x] **T029** [P] Implement database service for edge function calls in `src/services/database.ts`
- [x] **T030** Create React context for auth state management in `src/contexts/AuthContext.tsx`
- [x] **T031** Create React context for game state management in `src/contexts/GameContext.tsx`
- [ ] **T032** [P] Implement auth components (Login, Register, Profile) in `src/components/auth/`
- [ ] **T033** Implement game setup component in `src/components/game/GameSetup.tsx`
- [ ] **T034** Implement question display component in `src/components/game/QuestionDisplay.tsx`
- [ ] **T035** Implement game results component in `src/components/game/GameResults.tsx`

## Phase 3.6: Integration & Routing

- [ ] **T036** Setup React Router with protected routes in `src/App.tsx`
- [ ] **T037** Implement main layout and navigation in `src/components/layout/Layout.tsx`
- [ ] **T038** Connect all components with context providers and error boundaries

## Phase 3.7: Quality Assurance

- [ ] **T039** [P] Implement accessibility testing and WCAG 2.1 AA compliance validation in `src/__tests__/accessibility/a11y.test.ts`
- [ ] **T040** [P] Setup bundle size analysis and performance monitoring in `scripts/analyze-bundle.js` and CI configuration

## Dependencies

**Critical Paths**:
- Database schema (T008-T013) before edge functions (T022-T025)
- Contract tests (T014-T021) before implementation (T026-T040)
- Auth service (T027) before auth context (T030)
- Game service (T028) before game context (T031)
- Contexts (T030-T031) before components (T032-T035)
- All components before routing integration (T036-T038)

**Blocking Dependencies**:
- T008 blocks T009, T010, T011
- T013 blocks T022, T023, T024, T025
- T014-T021 block T026-T040
- T026, T027, T028, T029 block T030, T031
- T030 blocks T032
- T031 blocks T033, T034, T035
- T032-T035 block T036, T037, T038, T039, T040

## Parallel Execution Examples

### Phase 1: Setup Tasks (T004-T007)
```bash
# Launch configuration tasks together:
Task: "Configure TypeScript strict mode in tsconfig.json with path aliases"
Task: "Configure ESLint and Prettier with React/TypeScript rules in .eslintrc.json and .prettierrc"
Task: "Setup Vitest and React Testing Library configuration in vitest.config.ts"
Task: "Configure Playwright for E2E testing in playwright.config.ts"
```

### Phase 2: Contract Tests (T014-T018)
```bash
# Launch all service and component tests together:
Task: "Contract test for auth service in src/services/__tests__/auth.test.ts"
Task: "Contract test for game service in src/services/__tests__/game.test.ts"
Task: "Contract test for database edge functions in src/services/__tests__/database.test.ts"
Task: "Component test for auth components in src/components/auth/__tests__/auth-components.test.tsx"
Task: "Component test for game components in src/components/game/__tests__/game-components.test.tsx"
```

### Phase 3: Edge Functions (T022-T025)
```bash
# Launch all edge functions together:
Task: "Create edge function for game setup logic in supabase/functions/create-game-setup/index.ts"
Task: "Create edge function for answer validation in supabase/functions/validate-answer/index.ts"
Task: "Create edge function for game completion in supabase/functions/complete-game/index.ts"
Task: "Create edge function for user statistics in supabase/functions/user-stats/index.ts"
```

### Phase 4: Core Services (T026-T029)
```bash
# Launch all service implementations together:
Task: "Implement Supabase client configuration in src/lib/supabase.ts"
Task: "Implement auth service with login/logout/register in src/services/auth.ts"
Task: "Implement game service with session management in src/services/game.ts"
Task: "Implement database service for edge function calls in src/services/database.ts"
```

## Notes

- **[P] tasks**: Different files, no shared dependencies
- **Test-Driven Development**: All tests must fail before implementation begins
- **Supabase Integration**: Edge functions prevent client-side game manipulation
- **State Management**: React Context + useReducer for simplicity
- **Performance Targets**: Bundle < 250KB gzipped, LCP < 2.5s
- **Security**: Row Level Security policies enforce user data isolation

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (auth.ts → T014, game.ts → T015, database.ts → T016)
- [x] All entities have database tasks (user_profiles → T008, game_sessions → T009, etc.)
- [x] All tests come before implementation (T014-T021 before T026-T038)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow enforced (failing tests required before implementation)
- [x] Database schema established before service implementation
- [x] Edge functions prevent client-side cheating
- [x] Performance and accessibility considerations included
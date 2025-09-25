# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create static website project structure per implementation plan
- [ ] T002 Initialize project with static site generator and client-side dependencies
- [ ] T003 [P] Configure TypeScript, ESLint, Prettier with strict settings

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Unit test for data models in tests/unit/test_models.js
- [ ] T005 [P] Component test for UI components in tests/components/test_components.js
- [ ] T006 [P] Integration test for user workflows in tests/integration/test_workflows.js
- [ ] T007 [P] Performance test for Core Web Vitals in tests/performance/test_vitals.js

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 [P] Data models with client-side validation in src/models/
- [ ] T009 [P] Service layer for client-side logic in src/services/
- [ ] T010 [P] UI components with TypeScript in src/components/
- [ ] T011 Client-side routing and navigation
- [ ] T012 Local storage management utilities
- [ ] T013 Input validation and sanitization
- [ ] T014 Error handling and user feedback systems

## Phase 3.4: Integration
- [ ] T015 Connect services to local storage APIs
- [ ] T016 Third-party API integration (if applicable)
- [ ] T017 Client-side error logging and analytics
- [ ] T018 Security headers and CSP configuration

## Phase 3.5: Polish
- [ ] T019 [P] Unit tests for validation in tests/unit/test_validation.js
- [ ] T020 Performance optimization and Core Web Vitals validation
- [ ] T021 [P] Update documentation and README
- [ ] T022 Code cleanup and refactoring
- [ ] T023 Accessibility testing and compliance verification

## Dependencies
- Tests (T004-T007) before implementation (T008-T014)
- T008 blocks T009, T015
- T016 blocks T018
- Implementation before polish (T019-T023)

## Parallel Example
```
# Launch T004-T007 together:
Task: "Unit test for data models in tests/unit/test_models.js"
Task: "Component test for UI components in tests/components/test_components.js"
Task: "Integration test for user workflows in tests/integration/test_workflows.js"
Task: "Performance test for Core Web Vitals in tests/performance/test_vitals.js"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
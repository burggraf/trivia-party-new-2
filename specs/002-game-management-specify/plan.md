
# Implementation Plan: Game Management System

**Branch**: `002-game-management-specify` | **Date**: 2025-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/markb/dev/trivia-party-new-2/specs/002-game-management-specify/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Comprehensive host game management system enabling authenticated users to create, configure, and manage trivia games. Primary features include persistent role selection, game lifecycle management (create/edit/archive/delete), customizable round configuration, automated question generation with duplicate prevention, and full team management with self-registration controls. Technical approach leverages React frontend with Supabase backend, extending existing architecture patterns.

## Technical Context
**Language/Version**: TypeScript ES2022 with React 19+
**Primary Dependencies**: React Router v7, Shadcn UI, Tailwind CSS 4+, Supabase Client SDK v2.58+
**Storage**: Supabase PostgreSQL with Row Level Security
**Testing**: Vitest (unit), Playwright (e2e), React Testing Library
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+)
**Project Type**: web - React SPA frontend with Supabase managed backend
**Performance Goals**: <2s page load on 3G, LCP <2.5s, FID <100ms, CLS <0.1
**Constraints**: Constitutional compliance (TDD, zero warnings policy, accessibility WCAG 2.1 AA)
**Scale/Scope**: Multi-user trivia platform, 10k+ questions, 100+ concurrent games, 20 teams per game

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Client-Server Architecture**: ✅ PASS
- React 19+ frontend with Supabase backend managed services
- Utilizes Supabase Client SDK with Realtime capabilities for multi-user synchronization

**II. Code Quality Standards**: ✅ PASS
- TypeScript strict mode with zero type errors enforced
- ESLint/Prettier with strict configurations, zero warnings policy

**III. Test-Driven Development**: ✅ PASS
- All implementation preceded by failing tests (Vitest unit, Playwright e2e)
- Red-Green-Refactor cycle mandatory for all features

**IV. Performance-First Design**: ✅ PASS
- Target: <2s load on 3G, meets Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
- Code splitting and lazy loading for question management interfaces

**V. Real-Time Multi-User Synchronization**: ✅ PASS
- Supabase Realtime channels for host-player game state coordination
- Offline state handling with reconnection recovery for game management

**VI. User Experience Consistency**: ✅ PASS
- Shadcn UI design system patterns maintained
- Mobile-first responsive design, accessibility WCAG 2.1 AA compliance

**Initial Constitution Check**: PASS - No violations detected

**Post-Design Constitution Check**: PASS - Design maintains compliance
- All new components follow Shadcn UI patterns
- TypeScript contracts ensure type safety
- Service layer extensions maintain existing patterns
- Database changes minimal and backwards compatible
- Real-time features utilize Supabase Realtime appropriately

## Project Structure

### Documentation (this feature)
```
specs/002-game-management-specify/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   ├── auth/            # Authentication components
│   ├── game/            # Game-specific components
│   ├── host/            # NEW: Host-specific components (dashboards, forms)
│   └── layout/          # Layout components
├── contexts/            # React context providers (AuthContext, GameContext)
├── contracts/           # TypeScript type definitions
├── services/            # API service layer (auth.ts, game.ts)
├── lib/                 # Utility functions and configs
└── __tests__/           # Test files
    ├── integration/     # Integration tests
    └── unit/           # Unit tests

supabase/
├── migrations/          # Database schema changes
├── config.toml         # Supabase configuration
└── seed.sql            # Initial data seeding
```

**Structure Decision**: React SPA with Supabase backend following established patterns. New host-specific components will be added to `src/components/host/` directory to maintain separation of concerns while leveraging existing UI components and service layer architecture.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Database schema tasks: Create migrations for user_profiles, games, rounds extensions
- Contract test tasks: Host management service interface validation
- Component test tasks: Host-specific UI component test suites
- Integration test tasks: Complete host workflow scenarios from quickstart
- Service implementation tasks: Extend existing gameService with host features
- UI implementation tasks: Host dashboard, game wizard, team management interfaces

**Ordering Strategy (TDD-Compliant)**:
1. **Foundation** (Parallel): Database migrations, type definitions, test setup
2. **Service Layer** (Sequential): Contract tests → Service implementations → Service integration tests
3. **Component Layer** (Parallel per component): Component tests → Component implementations
4. **Integration Layer** (Sequential): E2E test scenarios → Full workflow validation
5. **Performance & Accessibility**: Bundle optimization, A11y validation

**Dependency Analysis**:
- Database migrations must complete before service tests
- Host service extensions require existing game service as base
- UI components depend on service layer contracts
- Integration tests require all components implemented

**Parallel Execution Opportunities** [P]:
- Database migration files (independent schemas)
- Component test files (isolated components)
- Service method implementations (independent operations)
- UI component implementations (separate features)

**Estimated Task Breakdown**:
- 8 Database/Schema tasks
- 12 Service layer tasks (6 test + 6 implementation)
- 15 Component tasks (8 test + 7 implementation)
- 6 Integration test tasks
- 4 Performance/Accessibility tasks
- 3 Documentation update tasks

**Total Estimated**: 48 tasks organized in dependency order with parallel execution markers

**Key Validation Points**:
- All quickstart scenarios must pass
- Constitutional compliance verified at each phase
- Performance targets met throughout implementation
- Accessibility standards maintained

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (None - no violations)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*

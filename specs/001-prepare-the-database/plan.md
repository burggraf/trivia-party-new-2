
# Implementation Plan: Prepare the Database for Multi-User Games

**Branch**: `001-prepare-the-database` | **Date**: 2025-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/markb/dev/trivia-party-new-2/specs/001-prepare-the-database/spec.md`

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
Transform the existing single-player trivia game database to support multi-user, team-based gameplay. This involves creating new tables for games, teams, team players, and team answers while maintaining question uniqueness per host. The current database supports individual game sessions but needs expansion to handle event-based games with multiple teams competing simultaneously.

## Technical Context
**Language/Version**: TypeScript ES2022, React 19+
**Primary Dependencies**: Supabase Client SDK, React Router v7, Shadcn UI, Tailwind CSS 4+
**Storage**: Supabase PostgreSQL with Row Level Security
**Testing**: Vitest (unit), Playwright (e2e), React Testing Library
**Target Platform**: Web application (client-server architecture)
**Project Type**: web - React frontend with Supabase backend
**Performance Goals**: Real-time multi-user synchronization, <2s page loads
**Constraints**: 1-4 players per team, max 20 teams per game, question uniqueness per host
**Scale/Scope**: Multi-user trivia games, 7 new database tables, 15 functional requirements

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Client-Server Architecture**: ✅ PASS
- Using Supabase PostgreSQL backend with React 19+ frontend
- Shadcn UI components with Tailwind CSS 4+
- Supabase Realtime capabilities for multi-user synchronization

**II. Code Quality Standards**: ✅ PASS
- TypeScript strict mode with comprehensive type contracts
- ESLint, Prettier configurations already in place
- Zero warnings policy will be maintained

**III. Test-Driven Development**: ✅ PASS
- Database contract tests will be written before implementation
- Vitest and Playwright test infrastructure exists
- Red-Green-Refactor cycle for all new database operations

**IV. Performance-First Design**: ✅ PASS
- Proper database indexes planned for foreign keys
- Supabase queries optimized for multi-user access patterns
- RLS policies for efficient data access control

**V. Real-Time Multi-User Synchronization**: ✅ PASS
- Database structure designed for Supabase Realtime channels
- Game state changes will propagate via team_answers and game status
- Offline/reconnection recovery supported by robust data model

**VI. User Experience Consistency**: ✅ PASS
- Database design supports graceful error handling
- Anonymous user support built into auth.users integration
- Display names separate from authentication credentials

**INITIAL CONSTITUTION CHECK**: ✅ PASS - All principles satisfied

**POST-DESIGN CONSTITUTION CHECK**: ✅ PASS - Design maintains compliance
- Database schema supports real-time synchronization via Supabase channels
- TypeScript contracts provide type safety with zero warnings
- Contract tests follow TDD approach (fail first, then pass)
- Performance optimized with proper indexes and RLS policies
- Multi-user architecture scales efficiently with Supabase managed services
- Anonymous user support maintains UX consistency

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->
```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   ├── auth/            # Authentication components
│   ├── game/            # Game-specific components
│   └── layout/          # Layout components
├── contexts/            # React context providers
├── contracts/           # TypeScript type definitions
├── services/            # API service layer
└── lib/                # Utility functions

supabase/
├── migrations/          # Database migration files
└── config.toml         # Supabase configuration

tests/
├── integration/         # Full workflow tests
└── __tests__/          # Unit tests by component
```

**Structure Decision**: React frontend with Supabase backend. The existing structure follows the web application pattern with TypeScript contracts in `src/contracts/`, database migrations in `supabase/migrations/`, and service layer in `src/services/`. New multi-user database tables will be added via migrations while preserving existing single-player functionality.

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

**Output**: ✅ data-model.md, contracts/*, contract tests, quickstart.md, updated CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate database migration tasks (7 new tables + 1 modification)
- Create TypeScript contract implementation tasks
- Generate service layer extension tasks
- Add validation and constraint enforcement tasks
- Create integration test tasks for multi-user workflows

**Ordering Strategy**:
1. **Database Layer**: Migration files in dependency order
   - Enhanced user_profiles (modify existing)
   - games table (base entity)
   - teams table (depends on games)
   - team_players table (depends on teams + user_profiles)
   - rounds table (depends on games)
   - round_questions table (depends on rounds + questions)
   - team_answers table (depends on teams + round_questions + user_profiles)
   - host_used_questions table (depends on user_profiles + questions)

2. **Contract Layer**: TypeScript types and interfaces [P]
   - Update existing game contracts
   - Add multi-user type definitions
   - Create service interface extensions

3. **Service Layer**: Database operation methods
   - Extend existing game service
   - Add multi-user game operations
   - Implement question uniqueness tracking

4. **Integration Tests**: End-to-end workflows
   - Host creates game and teams
   - Players join teams and submit answers
   - Real-time synchronization testing

**Estimated Output**: 18-22 numbered, ordered tasks in tasks.md

**Parallel Execution Opportunities**:
- Migration files can be written in parallel (marked [P])
- TypeScript contracts can be developed independently [P]
- Test files can be written before implementation [P]

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
- [x] All NEEDS CLARIFICATION resolved (via clarifications)
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*

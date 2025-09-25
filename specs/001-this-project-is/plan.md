
# Implementation Plan: Single-User Trivia Game

**Branch**: `001-this-project-is` | **Date**: 2025-09-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-this-project-is/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
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
Single-user trivia game application where authenticated users can configure customizable game sessions with selectable rounds, questions per round, and question categories. The system fetches questions from a Supabase database, randomizes answer order, tracks scores and timing, provides immediate feedback, and saves progress for session resumption. Built as a React static web application using Shadcn UI components with Supabase for authentication, data storage, and backend services.

## Technical Context
Use React for all client-side code; this is a frontend-only application (a static web app with no server-side code). Use the Shadcn UI component library for all user interface elements. Use Supabase as the backend data source and service provider. You can use Supabase edge functions or postgres functions to set up the game if necessary to prevent potential cheating. Implement user authentication and registration exclusively using Supabase Auth. Ensure the user/player's gameplay session is always associated with their Supabase authenticated user account. Design and style the UI with a modern, simple look using muted or monochromatic color schemes for a clean, elegant appearance. The application should include flows for user registration, login, starting a new game, playing through questions, showing feedback per question, tracking and displaying the score, ending the game, and logout.

**Language/Version**: TypeScript/JavaScript ES2022, React 18+
**Primary Dependencies**: React, Shadcn UI, Supabase Client SDK, React Router, Tailwind CSS
**Storage**: Supabase Database (PostgreSQL), Local Storage for session state
**Testing**: Vitest, React Testing Library, Playwright for E2E
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+)
**Project Type**: web - React single-page application
**Performance Goals**: LCP < 2.5s, FID < 100ms, CLS < 0.1, Initial bundle < 250KB gzipped (monitored via webpack-bundle-analyzer and bundlesize CI checks)
**Constraints**: Static deployment only, no server-side rendering, Supabase free tier limits
**Scale/Scope**: Single-user concurrent sessions, ~10 UI screens, 61k+ questions in database

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Static-First Architecture**:
- [x] Feature uses only client-side technologies (React app with Supabase client SDK)
- [x] Data storage limited to browser APIs (localStorage for session state, Supabase for persistent data)
- [x] External integrations via CORS-enabled public APIs only (Supabase provides CORS-enabled APIs)

**Code Quality Standards**:
- [x] TypeScript strict mode configuration planned
- [x] ESLint, Prettier, and automated formatting tools configured
- [x] Zero warnings policy will be enforced

**Test-Driven Development**:
- [x] Test-first approach planned for all business logic
- [x] Red-Green-Refactor cycle will be followed
- [x] 100% test coverage target for core functionality

**Performance-First Design**:
- [x] Bundle size optimization strategy defined (code splitting, lazy loading, tree shaking)
- [x] Core Web Vitals targets identified (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [x] Performance monitoring approach planned (webpack-bundle-analyzer, lighthouse CI, bundlesize package for regression prevention)

**User Experience Consistency**:
- [x] Design system patterns will be followed (Shadcn UI component library)
- [x] Mobile-first responsive design approach confirmed
- [x] Error handling and user feedback strategies defined

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
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - Frontend-only React application with external Supabase backend

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
- Database schema tasks from data-model.md (user_profiles, game_sessions, game_rounds, game_questions)
- Contract test tasks from contracts/ directory (auth.ts, game.ts, database.ts)
- Component tasks for React UI (auth forms, game setup, question display, results)
- Edge function tasks for server-side game logic
- Integration test tasks from quickstart scenarios

**Ordering Strategy**:
- Phase 1: Database schema and migrations [P]
- Phase 2: Supabase setup (RLS policies, edge functions) [P]
- Phase 3: Contract tests (auth, game, database) [P]
- Phase 4: Core services (auth, game logic, data access)
- Phase 5: UI components (authentication flow)
- Phase 6: UI components (game flow - setup, play, results)
- Phase 7: Integration tests and quickstart validation
- Phase 8: Performance optimization and bundle analysis

**Task Categories**:
- **Database**: Schema creation, migrations, RLS policies
- **Backend**: Edge functions, API contracts, validation logic
- **Frontend**: React components, routing, state management
- **Testing**: Unit tests, integration tests, E2E tests
- **DevOps**: Build configuration, deployment setup
- **Polish**: Performance optimization, accessibility, error handling

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**Key Dependencies**:
- Database tasks must complete before API development
- Contract tests must exist before implementation
- Auth components required before game components
- Core game logic required before UI components
- All components required before integration testing

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
| Static-First: External backend (Supabase) | Real-time data sync, authentication, and RLS security for user data isolation | Client-only storage (localStorage/IndexedDB) insufficient for persistent user accounts, game history, and preventing client-side score manipulation |


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
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*

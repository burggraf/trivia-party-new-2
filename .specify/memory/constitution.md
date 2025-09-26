<!--
Sync Impact Report:
- Version change: 1.0.0 → 2.0.0
- Modified principles: Replaced Static-First with Client-Server Architecture, Added Real-Time Multi-User Synchronization
- Added sections: Architecture Requirements (replaced Static Web Requirements)
- Updated tech stack: React 19+, Shadcn UI, Tailwind CSS 4+, Supabase with Realtime
- Removed sections: none
- Templates requiring updates:
  ✅ Updated plan-template.md (Constitution Check section)
  ✅ Updated spec-template.md (aligned requirements)
  ✅ Updated tasks-template.md (aligned task categories)
- Follow-up TODOs: none
-->

# Trivia Party Constitution

## Core Principles

### I. Client-Server Architecture
Every feature MUST be implemented as a React client-side application with Supabase backend services. Use React 19+, Shadcn UI components, Tailwind CSS 4+, and Supabase Client SDK with Realtime capabilities. Backend logic MUST remain simple and efficient through Supabase managed services.

**Rationale**: Provides scalable multi-user functionality with real-time synchronization while maintaining simple backend architecture through Supabase managed services, ensuring reliable hosting and minimal server maintenance overhead.

### II. Code Quality Standards
All code MUST pass linting, type checking, and formatting standards before commit. Use automated tools (ESLint, Prettier, TypeScript) with strict configurations. Zero warnings policy enforced.

**Rationale**: Maintains consistent code quality, reduces bugs, improves maintainability, and ensures professional-grade output that can be easily understood and extended by any developer.

### III. Test-Driven Development (NON-NEGOTIABLE)
Tests MUST be written before implementation. Follow Red-Green-Refactor cycle strictly: Write failing test → Implement minimum code to pass → Refactor. No implementation without corresponding tests.

**Rationale**: Ensures feature requirements are clearly defined, prevents regression bugs, and provides living documentation of system behavior while maintaining high code coverage.

### IV. Performance-First Design
All pages MUST load in under 2 seconds on 3G connections. Bundle sizes MUST be minimized through code splitting, lazy loading, and tree shaking. Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1.

**Rationale**: Modern web users expect fast experiences. Static sites have inherent performance advantages that must be preserved through disciplined optimization practices.

### V. Real-Time Multi-User Synchronization
All multi-user features MUST utilize Supabase Realtime channels for state synchronization between game host, players, and display systems. Game state changes MUST propagate to all connected clients with minimal latency. Offline state MUST be handled gracefully with reconnection recovery.

**Rationale**: Enables seamless multi-user trivia game experience where question data and scoring information flow efficiently from host to players and TV displays, maintaining consistent game state across all participants.

### VI. User Experience Consistency
UI components MUST follow established design system patterns. All interactions MUST provide immediate visual feedback. Error states MUST be handled gracefully with clear user guidance. Mobile-first responsive design mandatory.

**Rationale**: Consistent user experience builds trust and reduces cognitive load. Clear feedback patterns prevent user confusion and improve overall satisfaction with the application.

## Architecture Requirements

All features MUST comply with client-server architecture:
- **Frontend**: React 19+ SPA with Shadcn UI components and Tailwind CSS 4+
- **Backend**: Supabase managed services (database, auth, storage, realtime)
- **Data Storage**: Supabase PostgreSQL with row-level security policies
- **Authentication**: Supabase Auth with secure session management
- **Real-time Features**: Supabase Realtime channels for game state synchronization
- **State Management**: Client-side React state with Supabase sync

## Development Workflow

**Code Review Process**:
- All PRs MUST pass automated checks (tests, lint, build)
- Manual review required for UI changes and complex logic
- Performance impact MUST be measured and justified

**Quality Gates**:
- TypeScript strict mode with zero type errors
- 100% test coverage for business logic
- Accessibility compliance (WCAG 2.1 AA minimum)
- Bundle size regression prevention

**Deployment Standards**:
- Static assets only to CDN/hosting service
- Automated builds from main branch
- Preview deployments for all PRs

## Governance

This Constitution supersedes all other development practices and guidelines. All code reviews, architectural decisions, and feature implementations MUST verify compliance with these principles.

**Amendment Process**: Constitution changes require documented justification, impact assessment, and unanimous approval from project maintainers. All template files MUST be updated to reflect changes.

**Compliance Review**: Every feature specification and implementation plan MUST include a Constitution Check section documenting adherence to or justified deviation from these principles.

**Version**: 2.0.0 | **Ratified**: 2025-09-25 | **Last Amended**: 2025-09-26
<!--
Sync Impact Report:
- Version change: none → 1.0.0
- Modified principles: none (initial version)
- Added sections: All core principles, Static Web Requirements, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  ✅ Updated plan-template.md (Constitution Check section)
  ✅ Updated spec-template.md (aligned requirements)
  ✅ Updated tasks-template.md (aligned task categories)
- Follow-up TODOs: none
-->

# Trivia Party Constitution

## Core Principles

### I. Static-First Architecture
Every feature MUST be implementable as a static website with zero server-side dependencies. Use client-side JavaScript, static site generators, and CDN-hosted services only. No backend servers, databases, or server-side processing allowed.

**Rationale**: Ensures maximum reliability, minimal hosting costs, and eliminates server maintenance overhead while maintaining full functionality through modern browser APIs and third-party static services.

### II. Code Quality Standards
All code MUST pass linting, type checking, and formatting standards before commit. Use automated tools (ESLint, Prettier, TypeScript) with strict configurations. Zero warnings policy enforced.

**Rationale**: Maintains consistent code quality, reduces bugs, improves maintainability, and ensures professional-grade output that can be easily understood and extended by any developer.

### III. Test-Driven Development (NON-NEGOTIABLE)
Tests MUST be written before implementation. Follow Red-Green-Refactor cycle strictly: Write failing test → Implement minimum code to pass → Refactor. No implementation without corresponding tests.

**Rationale**: Ensures feature requirements are clearly defined, prevents regression bugs, and provides living documentation of system behavior while maintaining high code coverage.

### IV. Performance-First Design
All pages MUST load in under 2 seconds on 3G connections. Bundle sizes MUST be minimized through code splitting, lazy loading, and tree shaking. Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1.

**Rationale**: Modern web users expect fast experiences. Static sites have inherent performance advantages that must be preserved through disciplined optimization practices.

### V. User Experience Consistency
UI components MUST follow established design system patterns. All interactions MUST provide immediate visual feedback. Error states MUST be handled gracefully with clear user guidance. Mobile-first responsive design mandatory.

**Rationale**: Consistent user experience builds trust and reduces cognitive load. Clear feedback patterns prevent user confusion and improve overall satisfaction with the application.

## Static Web Requirements

All features MUST comply with static-only architecture:
- **Data Storage**: localStorage, sessionStorage, IndexedDB only
- **External APIs**: CORS-enabled public APIs, CDN resources only
- **Authentication**: OAuth flows with static redirect handling
- **File Processing**: Client-side JavaScript libraries only
- **Real-time Features**: WebRTC peer-to-peer, WebSocket clients to public services only

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

**Version**: 1.0.0 | **Ratified**: 2025-09-25 | **Last Amended**: 2025-09-25
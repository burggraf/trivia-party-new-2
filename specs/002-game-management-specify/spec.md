# Feature Specification: Game Management System

**Feature Branch**: `002-game-management-specify`
**Created**: 2025-09-27
**Status**: Draft
**Input**: User description: "game management
/specify game management
create the workflow and UI necessary for a host to create and manage games
- refer to DATABASE_SCHEMA.md to see our current database setup (you can modify the database as necessary to accomplish our goals here, but if you do that, make the necessary schema changes and always update DATABASE_SCHEMA.md so it's never out-of-date)
- after registration and/or login, the user should be presented with a choice between acting as a game host or a game player
- at this time we are only handling the host portion
- a host should be able to create, edit, archive, and delete games
- a host should be able to add rounds and questions to a game
- a host should be able to quickly set up a game (select number of rounds and number of questions per round, and select categories for the
questions)
- a host should also be able to modify the number of questions per round (so some rounds can have more or less questions than others)
- a host should be able to modify the categories used for a specific round (by default the selected categories would be used for all rounds,
but a host may choose to set a different set of categories for each round)
- a host should be able to "generate questions" for a game
- a host should be able to preview the questions for any round and delete and replace questions as desired (question preview mode)
- a host should be able to set the minimum number and maximum number of players per team for a game (1-4 players)
- a host should be able to set the maximum number of teams for a game
- a host should be able to select whether teams can register for a game themselves (self-registration) or if the teams and player should be
pre-set by the host
- a host should be able to create teams for a game and add players to the teams (whether or not self-registration is allowed)
At this point we are not handing the game flow at all, we're just allowing the game host to set up and manage games"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature clearly defines comprehensive game management system for hosts
2. Extract key concepts from description
   → Actors: game hosts, game players, teams; Actions: create/edit/delete games, manage rounds/questions, configure teams; Data: games, rounds, questions, teams, players; Constraints: 1-4 players per team, host vs player roles
3. For each unclear aspect:
   → All requirements are well-specified with clear business logic
4. Fill User Scenarios & Testing section
   → Clear user flow from role selection through game management workflows
5. Generate Functional Requirements
   → Each requirement is testable and implementation-independent
6. Identify Key Entities (if data involved)
   → Games, rounds, questions, teams, players, user roles identified
7. Run Review Checklist
   → Specification is comprehensive and ready for planning phase
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
After completing registration or login, a user is presented with a role selection choice to either host games or play games. As a game host, they need a comprehensive management interface to create trivia events, configure game settings, manage questions across multiple rounds, set team parameters, and control whether teams self-register or are pre-assigned. The host creates engaging trivia experiences by selecting question categories, customizing round structures, and managing team compositions before any live gameplay begins.

### Acceptance Scenarios
1. **Given** a user has completed authentication, **When** they access the dashboard, **Then** they see options to act as either a "Game Host" or "Game Player"
2. **Given** a user selects "Game Host" role, **When** they access the host dashboard, **Then** they see a list of their games with options to create, edit, archive, or delete games
3. **Given** a host creates a new game, **When** they use quick setup, **Then** they can select total rounds, questions per round, and question categories in a single workflow
4. **Given** a host has created a game with multiple rounds, **When** they customize individual rounds, **Then** they can modify question count and categories for each round independently
5. **Given** a host wants to customize questions, **When** they generate questions for a game, **Then** the system populates rounds with questions from selected categories, avoiding previously used questions for that host
6. **Given** a host reviews generated questions, **When** they preview questions for any round, **Then** they can see all questions and replace individual questions with alternatives from the same category
7. **Given** a host configures team settings, **When** they set team parameters, **Then** they can specify min/max players per team (1-4), maximum total teams, and enable/disable self-registration
8. **Given** a host manages teams, **When** they create teams for their game, **Then** they can add team names, assign colors, and add players to teams regardless of self-registration setting

### Edge Cases
- When a host deletes a game with active teams, the system automatically removes all teams and team memberships before deletion
- When generating questions with insufficient unique questions, the system allows duplicate questions from previous games with a clear warning
- When a host attempts to reduce maximum teams below current registered team count, the system blocks the change and shows an error message
- When a host creates conflicting team configurations (e.g., minimum players > maximum players), the system prevents the invalid configuration and shows validation errors

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST present authenticated users with a role selection choice between "Game Host" and "Game Player" before accessing main functionality, and MUST remember this choice persistently until the user manually changes it
- **FR-002**: System MUST provide hosts with a dedicated dashboard showing all their games with status indicators (setup, in_progress, completed, archived)
- **FR-003**: Hosts MUST be able to create new games with basic information including title, location, scheduled date, and initial configuration
- **FR-004**: Hosts MUST be able to edit existing games that are in "setup" status, including all game settings and configurations
- **FR-005**: Hosts MUST be able to archive games to remove them from active lists while preserving data for historical reference
- **FR-006**: Hosts MUST be able to permanently delete games that are in "setup" status, and when deleting games with associated teams, the system MUST automatically remove all teams and team memberships before deletion
- **FR-007**: System MUST provide a quick setup workflow allowing hosts to configure total rounds (1-10), questions per round (1-20), and question categories in a single interface
- **FR-008**: Hosts MUST be able to customize individual rounds by modifying the number of questions and selected categories for each round independently
- **FR-009**: System MUST generate questions for games by automatically assigning questions from selected categories to rounds while avoiding questions previously used by that host
- **FR-010**: Hosts MUST be able to preview all questions assigned to any round and replace individual questions with alternatives from the same category
- **FR-011**: Hosts MUST be able to configure team settings including minimum players per team (1-4), maximum players per team (1-4), and maximum total teams for the game
- **FR-012**: Hosts MUST be able to enable or disable team self-registration, controlling whether players can join teams independently or if teams must be pre-configured
- **FR-013**: Hosts MUST be able to create teams for their games including team names, display colors, and initial player assignments
- **FR-014**: Hosts MUST be able to add and remove players from teams regardless of whether self-registration is enabled
- **FR-015**: System MUST enforce business rules including ensuring minimum players per team ≤ maximum players per team, preventing modification of games in progress or completed status, and blocking attempts to reduce maximum teams below current registered team count
- **FR-016**: System MUST track question usage per host to prevent repetition across multiple games hosted by the same user
- **FR-017**: System MUST validate that sufficient unique questions exist in selected categories before allowing question generation, and when insufficient unique questions are available, the system MUST allow duplicate questions from previous games with a clear warning to the host
- **FR-018**: System MUST maintain data integrity by preventing hosts from modifying games that are in "in_progress" or "completed" status
- **FR-019**: System MUST provide clear visual indicators for game status, team counts, and configuration completeness to guide host workflow
- **FR-020**: System MUST preserve all game configuration and team data when games are archived, allowing hosts to reference historical events

### Key Entities *(include if feature involves data)*
- **Game**: Represents a trivia event with configuration settings including title, schedule, team limits, question categories, and status
- **Round**: Individual segments within a game with customizable question counts and category selections
- **Question Assignment**: Links between specific questions and rounds, maintaining order and tracking usage per host
- **Team**: Groups of players participating in a game with display properties and current score tracking
- **Team Membership**: Relationships between users and teams with role and timestamp information
- **Host Configuration**: User preferences and settings specific to hosting games, including question usage history
- **User Role Context**: Persistent role preference determining whether user operates as host or player, stored until manually changed

## Clarifications

### Session 2025-09-27
- Q: When a host generates questions for a game and there are insufficient unique questions in the selected categories, what should the system do? → A: Allow duplicate questions from previous games with a warning
- Q: How long should the role selection (Host vs Player) persist for a user? → A: Persistent: remember choice until user manually changes it
- Q: When a host tries to delete a game that has active teams, what should happen? → A: Allow deletion but automatically remove all teams first
- Q: When a host attempts to reduce the maximum number of teams below the current number of registered teams, what should happen? → A: Block the change and show error message
- Q: What happens when a host creates conflicting team configurations (e.g., minimum players > maximum players)? → A: do not allow it

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
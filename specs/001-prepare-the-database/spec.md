# Feature Specification: Prepare the Database for Multi-User Games

**Feature Branch**: `001-prepare-the-database`
**Created**: 2025-09-27
**Status**: Draft
**Input**: User description: "prepare the database for multi-user games
we are going to be changing this game into a complete live, multi-user experience where teams of players answer the questions in real time as they are displayed on a large TV screen and also transmitted to phones or tablets held by each team (for answer input).
We do not need to implement any multi-user features at this time, however, we need to prepare the database structures and any local data structures to handle this.  we want the current user (host) to control the entire game, so all game data (games, game sessions, questions, etc.) will be tied to the host.  However, there will be teams answering each question and we'll need to manage and keep track of:
- players (players will be users and stored in the supabase auth system in auth.users as normal.  a user can be a host or a player, or both.)
- teams (teams can have one or more players, and a game can have a limit to the number of players on a team)
- games (games are individual events played at a specific location on a specific date, with a scheduled start time and end time)
- rounds (a game can have one or more rounds of questions)
- round_questions (a round can have one or more questions)
- game_teams (the teams participating in a given game)
- team_players (the players participating on a team for a given game)
teams should exist only for a specific game -- teams do not exist out of the context of a game (i.e. teams do not last past the current game)
- team_answers (answer given by a team for a specific question)
Data should be as clean and simple as possible, with no unnecessary duplication.
Questions should never be repeated for any games or rounds for a given host.  A host who creates and administrates games should never see the same question twice.
Do not create a seaprate players table -- players need to be tied to their auth.users record key so the auth.users table is a single source of truth for an individual (host or player).
Allow for user display names (which will be shown on the TV scorebard, etc.)
Allow for anonymous user functionality (Supabase allows for anonymous user signup. We don't need to implement this now, but just allow for this to make sure that we do not require a user email address in any of the data -- user data should rely on the auth.user.id only as the key.)
We are only doing the data design in this task.  The goal will be to create the underlying database changes and any Typescript or internal data layouts that our application will later need for multi-user play."

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a trivia game host, I need to set up and run live multi-player trivia games where teams of players compete by answering questions in real-time. The game will be displayed on a main screen (TV) while teams use their own devices (phones/tablets) to submit answers. Currently, the application supports single-player games, but the database needs to be restructured to support team-based gameplay while ensuring questions are never repeated for any host across all their games.

### Acceptance Scenarios
1. **Given** a host user with existing game history, **When** they create a new game event, **Then** the system should track the game's location, date, scheduled times, and ensure no previously used questions are selected.

2. **Given** a scheduled game event, **When** teams are formed for that game, **Then** each team should be uniquely associated with only that specific game and should be able to have multiple players assigned.

3. **Given** a game with multiple teams and rounds, **When** a question is presented, **Then** the system should track each team's answer separately and ensure the question has never been shown to this host before.

4. **Given** players joining a game, **When** they are assigned to teams, **Then** the system should track them using their authenticated user identity (including anonymous users) and display their chosen display name.

5. **Given** a completed game, **When** reviewing game data, **Then** the system should show all teams, their players, answers submitted, and scores for each round and question.

### Edge Cases
- System prevents players from joining multiple teams in the same game through database constraints
- How does system handle a player who is both a host and player in different games?
- What happens when teams have unequal numbers of players and there's a team size limit?
- How does the system prevent question repetition across multiple games and rounds for the same host?

## Clarifications

### Session 2025-09-27
- Q: What is the maximum number of players allowed per team? → A: 1-4 players
- Q: When multiple team members submit different answers for the same question, which answer should count? → A: First submitted answer wins
- Q: Can a player join multiple teams in the same game? → A: No, strictly one team per player per game
- Q: What is the maximum number of teams expected per game? → A: 20
- Q: When can team rosters be modified? → A: Until game officially starts

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST support multiple user roles (host and player) where a single user can act as either or both across different games
- **FR-002**: System MUST organize games as discrete events with location, date, scheduled start and end times
- **FR-003**: System MUST support team-based gameplay where teams exist only within the context of a specific game
- **FR-004**: System MUST allow games to have multiple rounds, with each round containing multiple questions
- **FR-005**: System MUST track team membership, ensuring players can only belong to one team per game
- **FR-006**: System MUST record team answers for each question separately from individual player data, using the first submitted answer when multiple team members respond
- **FR-007**: System MUST prevent question repetition across all games and rounds for a given host
- **FR-008**: System MUST support user display names separate from authentication credentials
- **FR-009**: System MUST accommodate anonymous users who authenticate without email addresses
- **FR-010**: System MUST maintain clean data relationships without duplication across entities
- **FR-011**: System MUST enforce team size limits of 1-4 players per team
- **FR-012**: System MUST tie all game data (sessions, questions, rounds) to the host user who controls the game
- **FR-013**: System MUST track which teams are participating in each game
- **FR-014**: System MUST track which players are on each team for a specific game and allow roster modifications only until game start
- **FR-015**: System MUST maintain referential integrity when users (hosts or players) are removed from the system

### Key Entities *(include if feature involves data)*
- **User/Player**: Authenticated user (including anonymous) who can be a host or player, has display name
- **Game**: A specific trivia event with location, date, scheduled times, host, and configuration (supports up to 20 teams)
- **Team**: A group of players existing only within a specific game context
- **Round**: A subset of questions within a game, numbered sequentially
- **Question**: Trivia question tracked to prevent repetition for a host
- **Team Answer**: Response submitted by a team for a specific question
- **Game-Team Relationship**: Links teams to specific games they participate in
- **Team-Player Relationship**: Links players to teams within a specific game

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
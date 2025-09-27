# Research: Multi-User Database Design

## Decision: Database Architecture Pattern
**Choice**: Event-driven game model with team-centric design
**Rationale**: Games are events with scheduled times and locations, teams exist only within game context, supports real-time updates via Supabase channels
**Alternatives considered**:
- Persistent team model (rejected - teams don't last past games)
- Session-based model (rejected - doesn't support event scheduling)

## Decision: Question Uniqueness Strategy
**Choice**: Host-specific question tracking table (`host_used_questions`)
**Rationale**: Simple foreign key relationship, prevents all question repetition per host, efficient index lookups
**Alternatives considered**:
- Game-specific tracking (rejected - allows repetition across different games)
- Category-specific tracking (rejected - too complex, partial repetition still possible)

## Decision: Team Answer Authority
**Choice**: First-submitted answer wins with audit trail
**Rationale**: Clear business rule from clarifications, prevents conflicts, maintains fairness
**Alternatives considered**:
- Team captain model (rejected - adds complexity of role management)
- Majority vote (rejected - requires consensus mechanism)

## Decision: User Display Names
**Choice**: Add display_name to user_profiles table
**Rationale**: Separates display identity from auth credentials, supports anonymous users, TV-friendly names
**Alternatives considered**:
- Team-specific names (rejected - user consistency across games)
- Auth.users metadata (rejected - not part of main data model)

## Decision: Anonymous User Support
**Choice**: Rely on Supabase auth.users.id only, no email requirements
**Rationale**: Supabase supports anonymous auth, maintains single source of truth, future-proofs for anonymous gameplay
**Alternatives considered**:
- Separate guest user table (rejected - breaks auth integration)
- Email required (rejected - conflicts with anonymous support)

## Decision: Real-time Synchronization Strategy
**Choice**: Supabase Realtime channels on team_answers and games tables
**Rationale**: Natural event boundaries, efficient updates, supports host and player views
**Alternatives considered**:
- Single game channel (rejected - too broad, unnecessary data)
- Player-specific channels (rejected - doesn't support host overview)

## Decision: Database Migration Strategy
**Choice**: Sequential migrations preserving existing data
**Rationale**: Maintains compatibility with current single-player games, allows gradual rollout
**Alternatives considered**:
- Drop and recreate (rejected - data loss)
- Parallel table structure (rejected - maintenance overhead)

## Decision: Team Size Enforcement
**Choice**: Database check constraints + application validation
**Rationale**: Ensures data integrity at database level, provides immediate feedback
**Alternatives considered**:
- Application-only validation (rejected - data integrity risk)
- Trigger-based enforcement (rejected - complexity vs check constraints)

## Performance Considerations
- Foreign key indexes on all relationship tables
- Composite indexes on (host_id, question_id) for uniqueness checks
- RLS policies scoped to minimize data access
- team_answers partitioned by game_id for large datasets

## Security Considerations
- Row Level Security on all new tables
- Host-only access to game management operations
- Player access limited to their team data
- Anonymous user data protection via auth.users integration
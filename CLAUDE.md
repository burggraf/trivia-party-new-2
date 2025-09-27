# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a React-based trivia game application with Supabase backend. The architecture is built around a simplified client-side approach without edge functions or complex Postgres functions.

## Technology Stack
- **Frontend**: React 18+, TypeScript ES2022, Vite
- **UI Framework**: Shadcn UI components, Tailwind CSS, Radix UI primitives
- **Backend**: Supabase (PostgreSQL database, authentication)
- **Routing**: React Router v7
- **State Management**: React Context (AuthContext, GameContext)
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest (unit), Playwright (e2e)
- **Build**: Vite with TypeScript

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript check first)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
- `npm test` - Run unit tests (vitest)
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:e2e` - Run end-to-end tests (Playwright)

## Project Architecture

### Directory Structure
```
src/
├── components/          # React components
│   ├── ui/             # Shadcn UI components
│   ├── auth/           # Authentication components
│   ├── game/           # Game-specific components
│   └── layout/         # Layout components
├── contexts/           # React context providers
├── contracts/          # TypeScript type definitions
├── services/           # API service layer
└── lib/               # Utility functions and configs
```

### Core Architecture Patterns

**State Management**: The app uses React Context for global state management:
- `AuthContext` - Handles user authentication state
- `GameContext` - Manages game state, sessions, and game flow with a reducer pattern

**Service Layer**: All API interactions go through service classes:
- `gameService` - Handles all game-related API calls to Supabase
- `authService` - Manages authentication operations

**Type Safety**: Comprehensive TypeScript contracts in `src/contracts/` define all data structures and API interfaces.

**Component Organization**:
- Protected routes use `ProtectedRoute` wrapper
- Extensive error boundaries for error handling
- Shadcn UI components for consistent design system

### Game Flow Architecture
1. **Setup**: User selects categories and game configuration
2. **Session Creation**: Creates game session with questions
3. **Game Play**: Question display → Answer submission → Score update → Next question
4. **Completion**: Game summary and statistics

### Supabase Integration
- Database configuration in `supabase/config.toml`
- Migrations in `supabase/migrations/`
- Local development on ports 54321 (API) and 54322 (DB)
- Client configuration in `src/lib/supabase.ts`

### Path Aliases
Vite is configured with path aliases:
- `@/` → `src/`
- `@/components` → `src/components`
- `@/services` → `src/services`
- `@/contexts` → `src/contexts`
- `@/lib` → `src/lib`
- `@/types` → `src/types`

### Multi-User Game Architecture
The application supports two distinct game modes:

1. **Single-Player Mode** (legacy): Individual trivia sessions with personal scoring
2. **Multi-User Mode** (current focus): Team-based trivia events with live gameplay

**Multi-User Game Flow:**
- **Host Creates Game** → Sets title, date, categories, rounds, questions per round
- **Players Join Teams** → Teams have names, colors, and 1-4 players each
- **Game Progression** → Host controls round progression, teams submit answers simultaneously
- **Real-time Scoring** → Immediate feedback and live leaderboards

**Key Multi-User Components:**
- `gameService` implements both `GameService` (single-player) and `ExtendedGameService` (multi-user)
- `GameContext` manages state with reducer pattern supporting both game modes
- Database schema includes `games`, `teams`, `team_players`, `rounds`, `round_questions`, `team_answers`
- RLS policies ensure hosts control their games and players access only their teams

### Database Integration
- **Schema Documentation**: See `DATABASE_SCHEMA.md` for complete table structure and relationships
- **Local Development**: Supabase runs on ports 54321 (API) and 54322 (Database)
- **Migrations**: Located in `supabase/migrations/` with sequential numbering
- **Row Level Security**: Comprehensive RLS policies protect data access by user role

### Contract Architecture
TypeScript contracts are split across multiple files:
- `src/contracts/game.ts` - Single-player game types and legacy service interface
- `src/contracts/multi-user-types.ts` - Multi-user game entities and data structures
- `src/contracts/multi-user-game.ts` - Extended service interface for team-based operations
- `src/contracts/database.ts` - Edge function contracts (not currently used)

### State Management Patterns
The `GameContext` uses a reducer pattern with actions for:
- Profile and session management
- Multi-user game operations (create, join, start, progress)
- Question display and answer submission
- Loading states and error handling
- Game flow transitions (setup → playing → completed)

## Important Notes
- The project uses a simplified architecture without edge functions
- All game logic is handled client-side with direct Supabase queries
- Error boundaries are extensively used throughout the component tree
- TypeScript is strictly enforced with comprehensive type definitions
- Game state is managed through a reducer pattern in GameContext
- Database queries use RLS for security - ensure authenticated context for all operations
- Multi-user games require careful state synchronization between teams

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

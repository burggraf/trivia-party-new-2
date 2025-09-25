# Quickstart Guide: Single-User Trivia Game

## Prerequisites
- Node.js 18+ installed
- Supabase account with project configured
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

## Environment Setup

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables
Create `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run Supabase migrations:
```bash
# If using Supabase CLI
supabase db reset

# Or apply migrations manually in Supabase dashboard
```

## Development Workflow

### 1. Start Development Server
```bash
npm run dev
# Application available at http://localhost:5173
```

### 2. Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### 3. Build Production
```bash
npm run build
npm run preview
```

## User Journey Testing

### Scenario 1: New User Registration and First Game
1. **Navigate to Application**
   - Open http://localhost:5173
   - Verify landing page loads with sign-up form

2. **Create Account**
   - Click "Sign Up"
   - Enter email: `test@example.com`
   - Enter password: `Password123!`
   - Click "Create Account"
   - **Expected**: Redirected to profile setup page

3. **Setup Profile**
   - Enter username: `TestUser`
   - Select favorite categories: Science, History
   - Click "Complete Setup"
   - **Expected**: Redirected to game dashboard

4. **Start New Game**
   - Click "Start New Game"
   - Configure: 2 rounds, 3 questions per round
   - Select categories: Science, History
   - Click "Begin Game"
   - **Expected**: First question appears with 4 randomized answers

5. **Answer Questions**
   - Select an answer for question 1
   - Click "Submit Answer"
   - **Expected**: Immediate feedback (correct/incorrect), score updates
   - Continue through all 6 questions

6. **View Results**
   - Complete final question
   - **Expected**: Game summary with per-round scores, total time, accuracy

### Scenario 2: Resume Interrupted Game
1. **Start game session**
   - Login as existing user
   - Start new game: 3 rounds, 2 questions per round
   - Answer first 2 questions in round 1

2. **Simulate Interruption**
   - Close browser tab or refresh page
   - Reopen application
   - **Expected**: Prompt to continue existing game or start new one

3. **Resume Game**
   - Click "Continue Game"
   - **Expected**: Returns to round 2, question 1 with progress intact

### Scenario 3: Game Configuration Edge Cases
1. **Category Limitation Test**
   - Select single category with few questions (if any exist)
   - Configure more questions than available
   - **Expected**: System allows duplicates or warns user

2. **Maximum Configuration Test**
   - Configure 10 rounds, 20 questions per round
   - **Expected**: Game handles large configurations without performance issues

## API Integration Testing

### Authentication Flow
```bash
# Test user registration
curl -X POST http://localhost:5173/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Expected: User object with session token
```

### Game session API
```bash
# Create game session
curl -X POST http://localhost:5173/api/game/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"total_rounds":2,"questions_per_round":5,"selected_categories":["Science","History"]}'

# Expected: Game session object with ID
```

## Database Verification

### Check Data Integrity
```sql
-- Verify user profile created
SELECT * FROM user_profiles WHERE id = '<user_id>';

-- Verify game session structure
SELECT gs.*, gr.round_number, COUNT(gq.id) as questions_count
FROM game_sessions gs
JOIN game_rounds gr ON gs.id = gr.game_session_id
JOIN game_questions gq ON gr.id = gq.game_round_id
WHERE gs.user_id = '<user_id>'
GROUP BY gs.id, gr.id, gr.round_number
ORDER BY gr.round_number;

-- Verify question randomization
SELECT gq.question_order, gq.presented_answers
FROM game_questions gq
JOIN game_rounds gr ON gq.game_round_id = gr.id
WHERE gr.game_session_id = '<session_id>'
ORDER BY gq.question_order;
```

## Performance Verification

### Bundle Size Check
```bash
npm run build
npm run analyze-bundle

# Expected: Main bundle < 250KB gzipped
# Expected: No unused dependencies
```

### Core Web Vitals
```bash
npm run lighthouse

# Expected: LCP < 2.5s
# Expected: FID < 100ms
# Expected: CLS < 0.1
```

## Troubleshooting

### Common Issues
1. **Supabase Connection Failed**
   - Verify environment variables are correct
   - Check Supabase project is active
   - Confirm API keys have correct permissions

2. **Authentication Errors**
   - Verify email confirmation if required
   - Check password complexity requirements
   - Confirm auth redirect URLs are configured

3. **Game Logic Errors**
   - Check browser console for client-side errors
   - Verify database constraints are not violated
   - Confirm RLS policies allow data access

### Debug Mode
```bash
# Start with debug logging
VITE_DEBUG=true npm run dev

# View detailed error information in browser console
```

## Deployment Verification

### Static Build Test
```bash
npm run build
cd dist
python -m http.server 8080
# Test all functionality works from static files
```

### Production Environment Test
```bash
# Deploy to staging environment
# Run full test suite against deployed version
npm run test:e2e -- --baseURL=https://your-staging-url.com
```

## Success Criteria
- [ ] User can register and authenticate
- [ ] Game sessions persist across browser sessions
- [ ] Questions display in randomized answer order
- [ ] Scoring and timing work correctly
- [ ] Game resumption works after interruption
- [ ] All edge cases handle gracefully
- [ ] Performance targets met
- [ ] No console errors in production build
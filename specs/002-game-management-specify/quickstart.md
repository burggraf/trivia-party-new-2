# Quickstart: Game Management System

**Date**: 2025-09-27
**Feature**: Game Management System
**Branch**: 002-game-management-specify

## Overview

This guide provides step-by-step instructions to test the complete game management system functionality. Follow these scenarios to validate all major features.

## Prerequisites

- Supabase local development environment running
- Database migrations applied
- Test user accounts created
- Application running on localhost

## Test Scenarios

### Scenario 1: Role Selection and Persistence

**Objective**: Verify role selection and persistence across sessions

**Steps**:
1. Create a new user account or use existing test account
2. Complete authentication (login/register)
3. Verify role selection screen appears
4. Select "Game Host" role
5. Verify redirect to host dashboard
6. Log out and log back in
7. Verify automatic redirect to host dashboard (role persistence)
8. Switch role to "Player" via navigation
9. Verify redirect to player dashboard
10. Log out and log back in
11. Verify redirect to player dashboard (role change persisted)

**Expected Results**:
- Role selection required for new users
- Role preference persists across sessions
- Role switching updates preference
- Appropriate dashboard shown based on role

### Scenario 2: Host Game Creation (Quick Setup)

**Objective**: Verify basic game creation workflow

**Steps**:
1. Navigate to host dashboard as authenticated host
2. Click "Create New Game" button
3. Fill in basic game information:
   - Title: "Test Trivia Night"
   - Location: "Community Center"
   - Date: Tomorrow's date
   - Rounds: 3
   - Questions per round: 5
   - Categories: Select "Science", "History"
   - Max teams: 8
   - Players per team: 2-4
   - Self-registration: Enabled
4. Click "Create Game" button
5. Verify game appears in host dashboard
6. Verify game status is "setup"
7. Verify all configuration matches input

**Expected Results**:
- Game creation succeeds
- All configuration saved correctly
- Game visible in host game list
- Game ready for further configuration

### Scenario 3: Round Customization

**Objective**: Verify per-round customization capabilities

**Steps**:
1. Open the game created in Scenario 2
2. Navigate to "Rounds" section
3. For Round 1:
   - Keep default categories and question count
4. For Round 2:
   - Change categories to "Sports", "Entertainment"
   - Change questions to 7
5. For Round 3:
   - Change categories to "Geography"
   - Change questions to 3
6. Save round configuration
7. Verify each round shows custom settings

**Expected Results**:
- Round customization persists correctly
- Default categories used when not customized
- Custom categories override game defaults
- Question counts can vary per round

### Scenario 4: Question Generation and Preview

**Objective**: Verify automated question assignment and preview functionality

**Steps**:
1. Continue with the game from Scenario 3
2. Navigate to "Questions" section
3. Click "Generate Questions" button
4. Monitor generation progress
5. Verify successful completion or warning about duplicates
6. Click "Preview Round 1" button
7. Verify 5 Science/History questions displayed
8. Select one question and click "Replace"
9. Choose an alternative from the replacement options
10. Verify question updated in preview
11. Repeat preview for Rounds 2 and 3
12. Verify correct categories and counts for each round

**Expected Results**:
- Question generation completes successfully
- Correct number of questions per round
- Questions match specified categories
- Question replacement works correctly
- Duplicate warnings shown if applicable

### Scenario 5: Team Management

**Objective**: Verify team creation and player assignment

**Steps**:
1. Continue with the game from Scenario 4
2. Navigate to "Teams" section
3. Create first team:
   - Name: "Knowledge Seekers"
   - Color: Blue
   - Add 2 test players
4. Create second team:
   - Name: "Quiz Masters"
   - Color: Red
   - Add 3 test players
5. Verify team validation (player count within limits)
6. Edit first team to add one more player
7. Try to add a player who's already on second team
8. Verify error prevention for duplicate assignments
9. Toggle self-registration off
10. Verify teams are now host-managed only

**Expected Results**:
- Teams created successfully
- Player assignments work correctly
- Validation prevents invalid configurations
- Self-registration toggle functions properly
- Team limits enforced

### Scenario 6: Game Lifecycle Management

**Objective**: Verify game status transitions and management operations

**Steps**:
1. Return to host dashboard
2. Create a second test game with minimal configuration
3. Verify both games visible in dashboard
4. Edit the second game's basic information
5. Verify changes saved
6. Archive the second game
7. Verify it's removed from active games list
8. Navigate to archived games view
9. Verify archived game visible
10. Attempt to delete the first game (with teams)
11. Verify teams are removed automatically
12. Verify game deletion successful

**Expected Results**:
- Game editing works for setup status
- Archival removes from active list
- Archived games preserved and accessible
- Deletion removes teams automatically
- Game management operations complete successfully

### Scenario 7: Host Dashboard Analytics

**Objective**: Verify dashboard statistics and game overview

**Steps**:
1. Navigate to host dashboard
2. Verify game statistics show:
   - Total games hosted
   - Active games count
   - Teams and players across games
3. Verify question statistics show:
   - Questions used
   - Favorite categories
   - Available questions by category
4. Create additional test games
5. Refresh dashboard
6. Verify statistics update correctly

**Expected Results**:
- Dashboard shows accurate statistics
- Statistics update with new games
- Question usage tracked correctly
- Category information accurate

### Scenario 8: Error Handling and Validation

**Objective**: Verify proper error handling and validation

**Steps**:
1. Attempt to create game with invalid data:
   - Empty title
   - Invalid date (past date)
   - Zero rounds
   - Min players > max players
2. Verify validation errors displayed
3. Attempt to generate questions with insufficient categories
4. Verify appropriate warning or error
5. Try to modify a game in "in_progress" status
6. Verify modification blocked
7. Test network error scenarios (disconnect during operation)
8. Verify graceful error handling and retry options

**Expected Results**:
- Input validation prevents invalid data
- Clear error messages displayed
- Operations blocked when inappropriate
- Network errors handled gracefully
- User can recover from error states

## Performance Validation

### Load Testing
1. Create 10+ games simultaneously
2. Generate questions for multiple games
3. Create 20 teams with 4 players each
4. Verify performance within constitutional limits

### Bundle Size Testing
1. Check initial page load with network throttling
2. Verify lazy loading for question preview
3. Confirm Core Web Vitals targets met

## Accessibility Testing

### Screen Reader Testing
1. Navigate entire host workflow with screen reader
2. Verify all actions accessible via keyboard
3. Test form validation announcements

### Mobile Responsiveness
1. Complete full workflow on mobile device
2. Verify all components properly scaled
3. Test touch interactions

## Integration Testing

### Real-time Updates
1. Open game management in two browser windows
2. Make changes in one window
3. Verify updates appear in second window
4. Test team registration from player view

### Database Consistency
1. Verify RLS policies prevent unauthorized access
2. Test concurrent game modifications
3. Verify data integrity maintained

## Cleanup

After testing, clean up test data:
1. Delete all test games
2. Remove test teams and players
3. Reset user preferences
4. Clear any cached data

## Success Criteria

✅ All scenarios complete without errors
✅ Performance targets met (< 2s load, Core Web Vitals)
✅ Accessibility compliance verified
✅ Real-time updates functional
✅ Data integrity maintained
✅ Error handling graceful

## Troubleshooting

### Common Issues
- **Role selection not persisting**: Check user_profiles.preferred_role field
- **Questions not generating**: Verify sufficient questions in selected categories
- **Teams not saving**: Check team size validation and RLS policies
- **Dashboard not loading**: Verify Supabase connection and user authentication

### Debug Information
- Check browser console for JavaScript errors
- Monitor network tab for failed API calls
- Verify Supabase logs for database errors
- Test with different user accounts for permission issues

---

**Quickstart Complete**: All test scenarios defined for comprehensive validation
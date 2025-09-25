import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * E2E User Journey Tests
 *
 * These tests simulate complete user journeys through the trivia application.
 * They test the integration of all components, services, and user interactions.
 *
 * These tests WILL FAIL initially as part of the TDD approach until the
 * actual application components and pages are implemented.
 */

// Helper functions for common actions
class TriviaAppActions {
  constructor(private page: Page) {}

  async navigateToApp() {
    await this.page.goto('/');
    // Wait for app to load
    await this.page.waitForLoadState('networkidle');
  }

  async signUp(email: string, password: string, username: string) {
    // Navigate to signup
    await this.page.click('[data-testid="signup-link"]');

    // Fill signup form
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="username-input"]', username);
    await this.page.fill('[data-testid="password-input"]', password);

    // Submit form
    await this.page.click('[data-testid="signup-button"]');

    // Wait for response
    await this.page.waitForLoadState('networkidle');
  }

  async signIn(email: string, password: string) {
    // Navigate to login if not already there
    const loginForm = this.page.locator('[data-testid="login-form"]');
    const isVisible = await loginForm.isVisible();

    if (!isVisible) {
      await this.page.click('[data-testid="login-link"]');
    }

    // Fill login form
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);

    // Submit form
    await this.page.click('[data-testid="login-button"]');

    // Wait for authentication
    await this.page.waitForSelector('[data-testid="user-profile"]', { timeout: 10000 });
  }

  async signOut() {
    await this.page.click('[data-testid="signout-button"]');
    await this.page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });
  }

  async setupGame(rounds: number, questionsPerRound: number, categories: string[]) {
    // Navigate to game setup
    await this.page.click('[data-testid="start-game-button"]');

    // Configure game
    await this.page.selectOption('[data-testid="rounds-select"]', rounds.toString());
    await this.page.selectOption('[data-testid="questions-per-round-select"]', questionsPerRound.toString());

    // Select categories
    for (const category of categories) {
      await this.page.check(`[data-testid="category-${category.toLowerCase()}"]`);
    }

    // Start game
    await this.page.click('[data-testid="begin-game-button"]');

    // Wait for first question
    await this.page.waitForSelector('[data-testid="question-display"]', { timeout: 10000 });
  }

  async answerQuestion(answerLabel: 'A' | 'B' | 'C' | 'D') {
    // Click the selected answer
    await this.page.click(`[data-testid="answer-${answerLabel.toLowerCase()}"]`);

    // Wait for answer feedback or next question
    await this.page.waitForLoadState('networkidle');

    // Check if game continues or ends
    const questionDisplay = this.page.locator('[data-testid="question-display"]');
    const gameResults = this.page.locator('[data-testid="game-results"]');

    const hasNextQuestion = await questionDisplay.isVisible();
    const hasResults = await gameResults.isVisible();

    return { hasNextQuestion, hasResults };
  }

  async completeGame() {
    // Wait for game results
    await this.page.waitForSelector('[data-testid="game-results"]', { timeout: 15000 });

    // Get final score
    const scoreElement = this.page.locator('[data-testid="final-score"]');
    const scoreText = await scoreElement.textContent();

    return { scoreText };
  }

  async playAgain() {
    await this.page.click('[data-testid="play-again-button"]');
    await this.page.waitForSelector('[data-testid="game-setup-form"]', { timeout: 5000 });
  }

  async returnToMenu() {
    await this.page.click('[data-testid="return-to-menu-button"]');
    await this.page.waitForSelector('[data-testid="main-menu"]', { timeout: 5000 });
  }

  async viewProfile() {
    await this.page.click('[data-testid="profile-link"]');
    await this.page.waitForSelector('[data-testid="profile-stats"]', { timeout: 5000 });
  }
}

test.describe('Complete User Journey', () => {
  let actions: TriviaAppActions;
  const testUser = {
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'testpassword123',
    username: `e2euser${Date.now()}`
  };

  test.beforeEach(async ({ page }) => {
    actions = new TriviaAppActions(page);
    await actions.navigateToApp();
  });

  test('should complete full user journey: signup -> play game -> view results', async ({ page }) => {
    // Step 1: Sign up new user
    await actions.signUp(testUser.email, testUser.password, testUser.username);

    // Verify signup success (might show email confirmation message)
    const signupMessage = page.locator('[data-testid="signup-success"]');
    await expect(signupMessage).toBeVisible({ timeout: 5000 });

    // Step 2: Sign in (simulate email confirmation)
    await actions.signIn(testUser.email, testUser.password);

    // Verify successful login
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

    // Step 3: Set up and start a game
    await actions.setupGame(2, 3, ['Science', 'History']);

    // Verify game started
    await expect(page.locator('[data-testid="question-display"]')).toBeVisible();

    // Check game progress indicators
    await expect(page.locator('[data-testid="question-progress"]')).toContainText('Question 1 of 6');
    await expect(page.locator('[data-testid="round-info"]')).toContainText('Round 1');

    // Step 4: Answer questions
    let questionCount = 0;
    let gameComplete = false;

    // Answer up to 6 questions (2 rounds × 3 questions)
    while (!gameComplete && questionCount < 10) { // Safety limit
      const answerResult = await actions.answerQuestion('A'); // Always choose A for simplicity
      questionCount++;

      if (answerResult.hasResults) {
        gameComplete = true;
      } else if (!answerResult.hasNextQuestion) {
        // Something went wrong
        break;
      }
    }

    expect(gameComplete).toBe(true);
    expect(questionCount).toBeGreaterThan(0);

    // Step 5: View game results
    const gameResults = await actions.completeGame();

    // Verify results page
    await expect(page.locator('[data-testid="game-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="accuracy"]')).toBeVisible();
    await expect(page.locator('[data-testid="rounds-summary"]')).toBeVisible();

    // Check that score is reasonable format
    expect(gameResults.scoreText).toMatch(/\d+ \/ \d+/);

    // Step 6: Return to menu and view profile
    await actions.returnToMenu();
    await actions.viewProfile();

    // Verify profile shows game statistics
    await expect(page.locator('[data-testid="profile-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="games-played"]')).toContainText('1'); // First game

    // Step 7: Sign out
    await actions.signOut();

    // Verify signed out
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should handle existing user login and multiple games', async ({ page }) => {
    // Use existing test user or create if first run
    await actions.signIn(testUser.email, testUser.password);

    // Skip if user doesn't exist (create in previous test)
    const loginError = page.locator('[data-testid="login-error"]');
    const isErrorVisible = await loginError.isVisible();

    if (isErrorVisible) {
      // Create user first
      await actions.signUp(testUser.email, testUser.password, testUser.username);
      await actions.signIn(testUser.email, testUser.password);
    }

    // Verify successful login
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

    // Play first game - quick game
    await actions.setupGame(1, 2, ['Science']);

    // Answer all questions
    let gameComplete = false;
    let attempts = 0;

    while (!gameComplete && attempts < 5) {
      const result = await actions.answerQuestion('A');
      gameComplete = result.hasResults;
      attempts++;
    }

    await actions.completeGame();
    await actions.playAgain();

    // Play second game - different configuration
    await actions.setupGame(2, 2, ['History', 'Geography']);

    // Answer questions for second game
    gameComplete = false;
    attempts = 0;

    while (!gameComplete && attempts < 8) {
      const result = await actions.answerQuestion('B');
      gameComplete = result.hasResults;
      attempts++;
    }

    await actions.completeGame();

    // View profile to see updated stats
    await actions.returnToMenu();
    await actions.viewProfile();

    // Should show 2 games played now
    await expect(page.locator('[data-testid="games-played"]')).toContainText('2');

    // Check recent games history
    const recentGames = page.locator('[data-testid="recent-games"] [data-testid="game-session"]');
    await expect(recentGames).toHaveCount(2);
  });

  test('should handle game pause and resume', async ({ page }) => {
    // Login
    await actions.signIn(testUser.email, testUser.password);

    if (await page.locator('[data-testid="login-error"]').isVisible()) {
      await actions.signUp(testUser.email, testUser.password, testUser.username);
      await actions.signIn(testUser.email, testUser.password);
    }

    // Start a longer game
    await actions.setupGame(3, 3, ['Science', 'History', 'Geography']);

    // Answer a few questions
    await actions.answerQuestion('A');
    await actions.answerQuestion('B');

    // Pause the game
    await page.click('[data-testid="pause-game-button"]');

    // Verify pause state
    await expect(page.locator('[data-testid="game-paused"]')).toBeVisible();

    // Navigate away (simulate user leaving)
    await actions.returnToMenu();

    // Resume the game
    await page.click('[data-testid="resume-game-button"]');

    // Should return to the paused question
    await expect(page.locator('[data-testid="question-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="question-progress"]')).toContainText('Question 3');

    // Continue and finish game
    let gameComplete = false;
    let attempts = 0;

    while (!gameComplete && attempts < 10) {
      const result = await actions.answerQuestion('C');
      gameComplete = result.hasResults;
      attempts++;
    }

    await actions.completeGame();

    // Verify completion
    await expect(page.locator('[data-testid="game-results"]')).toBeVisible();
  });

  test('should handle different game configurations and categories', async ({ page }) => {
    // Login
    await actions.signIn(testUser.email, testUser.password);

    if (await page.locator('[data-testid="login-error"]').isVisible()) {
      await actions.signUp(testUser.email, testUser.password, testUser.username);
      await actions.signIn(testUser.email, testUser.password);
    }

    // Test different game configurations
    const gameConfigs = [
      { rounds: 1, questions: 3, categories: ['Science'] },
      { rounds: 2, questions: 5, categories: ['History', 'Geography'] },
      { rounds: 3, questions: 2, categories: ['Science', 'Sports', 'Arts'] }
    ];

    for (const [index, config] of gameConfigs.entries()) {
      // Setup game with current configuration
      await actions.setupGame(config.rounds, config.questions, config.categories);

      // Verify game setup
      const totalQuestions = config.rounds * config.questions;
      await expect(page.locator('[data-testid="question-progress"]'))
        .toContainText(`Question 1 of ${totalQuestions}`);

      // Play through the game quickly
      let gameComplete = false;
      let attempts = 0;
      const maxAttempts = totalQuestions + 2; // Safety margin

      while (!gameComplete && attempts < maxAttempts) {
        const answerChoice = ['A', 'B', 'C', 'D'][attempts % 4] as 'A' | 'B' | 'C' | 'D';
        const result = await actions.answerQuestion(answerChoice);
        gameComplete = result.hasResults;
        attempts++;
      }

      // Complete game
      await actions.completeGame();

      // Verify results show correct total questions
      const scoreText = await page.locator('[data-testid="final-score"]').textContent();
      expect(scoreText).toContain(`/ ${totalQuestions}`);

      // Setup next game (unless it's the last one)
      if (index < gameConfigs.length - 1) {
        await actions.playAgain();
      }
    }

    // Final check - return to menu and verify profile
    await actions.returnToMenu();
    await actions.viewProfile();

    // Should show 3 games played
    await expect(page.locator('[data-testid="games-played"]')).toContainText('3');
  });

  test('should handle authentication errors and edge cases', async ({ page }) => {
    // Test invalid login
    await page.goto('/');

    // Try to login with invalid credentials
    await page.click('[data-testid="login-link"]');
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();

    // Test signup with invalid data
    await page.click('[data-testid="signup-link"]');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'weak');
    await page.click('[data-testid="signup-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="signup-error"]')).toBeVisible();

    // Test successful signup and login
    const uniqueEmail = `edge-test-${Date.now()}@example.com`;
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="username-input"]', `edgeuser${Date.now()}`);
    await page.fill('[data-testid="password-input"]', 'validpassword123');
    await page.click('[data-testid="signup-button"]');

    // Should succeed
    await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();

    // Login with new credentials
    await actions.signIn(uniqueEmail, 'validpassword123');

    // Should be logged in
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });
});

test.describe('Performance and Responsiveness', () => {
  test('should load application within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Key elements should be visible
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.goto('/');

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="responsive-layout"]')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

    // Navigation should work on mobile
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
  });
});

// These tests will fail until implementation exists - this is expected for TDD
test.describe('TDD Failure Tests (Expected to Fail)', () => {
  test('should fail - application not implemented yet', async ({ page }) => {
    await page.goto('/');

    // These selectors won't exist until the app is built
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible({ timeout: 1000 });
  });

  test('should fail - auth components not implemented yet', async ({ page }) => {
    await page.goto('/');

    // These auth components don't exist yet
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 1000 });
  });

  test('should fail - game components not implemented yet', async ({ page }) => {
    await page.goto('/');

    // These game components don't exist yet
    await expect(page.locator('[data-testid="game-setup-form"]')).toBeVisible({ timeout: 1000 });
  });
});
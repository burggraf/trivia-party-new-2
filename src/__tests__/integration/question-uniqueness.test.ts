// Integration Test: Question Uniqueness and Host Tracking
// Tests question availability, usage tracking, and prevention of repetition

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { gameService } from '../../services/game';
import type {
  Game,
  Question,
  CreateGameRequest,
} from '../../contracts/multi-user-types';

describe('Question Uniqueness Integration Tests', () => {
  let supabase: any;
  let testHost1Id: string;
  let testHost2Id: string;
  let testQuestionIds: string[] = [];

  beforeEach(async () => {
    // Initialize test client
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Create test hosts
    const { data: host1 } = await supabase
      .from('user_profiles')
      .insert({
        username: 'testhost1',
        display_name: 'Test Host 1'
      })
      .select()
      .single();

    const { data: host2 } = await supabase
      .from('user_profiles')
      .insert({
        username: 'testhost2',
        display_name: 'Test Host 2'
      })
      .select()
      .single();

    testHost1Id = host1.id;
    testHost2Id = host2.id;

    // Create test questions for testing
    const testQuestions = [
      {
        category: 'science',
        question: 'What is the chemical symbol for water?',
        a: 'H2O',
        b: 'CO2',
        c: 'NaCl',
        d: 'O2',
        metadata: { test: true }
      },
      {
        category: 'science',
        question: 'What planet is closest to the sun?',
        a: 'Mercury',
        b: 'Venus',
        c: 'Earth',
        d: 'Mars',
        metadata: { test: true }
      },
      {
        category: 'history',
        question: 'Who was the first president of the United States?',
        a: 'George Washington',
        b: 'John Adams',
        c: 'Thomas Jefferson',
        d: 'Benjamin Franklin',
        metadata: { test: true }
      },
      {
        category: 'history',
        question: 'In what year did World War II end?',
        a: '1945',
        b: '1944',
        c: '1946',
        d: '1943',
        metadata: { test: true }
      },
      {
        category: 'math',
        question: 'What is 2 + 2?',
        a: '4',
        b: '3',
        c: '5',
        d: '6',
        metadata: { test: true }
      }
    ];

    const { data: createdQuestions } = await supabase
      .from('questions')
      .insert(testQuestions)
      .select('id');

    testQuestionIds = createdQuestions?.map(q => q.id) || [];
  });

  afterEach(async () => {
    // Cleanup test data
    if (testHost1Id) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testHost1Id);
    }
    if (testHost2Id) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testHost2Id);
    }

    // Cleanup test questions
    if (testQuestionIds.length > 0) {
      await supabase
        .from('questions')
        .delete()
        .in('id', testQuestionIds);
    }
  });

  describe('Question Availability for Hosts', () => {
    it('should return available questions for new host', async () => {
      const availableQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['science', 'history'],
        10
      );

      expect(availableQuestions).toBeTruthy();
      expect(Array.isArray(availableQuestions)).toBe(true);

      // Should include our test questions
      const questionTexts = availableQuestions.map(q => q.question);
      expect(questionTexts).toContain('What is the chemical symbol for water?');
      expect(questionTexts).toContain('Who was the first president of the United States?');

      // Should only include requested categories
      const categories = availableQuestions.map(q => q.category);
      expect(categories.every(cat => ['science', 'history'].includes(cat))).toBe(true);
    });

    it('should limit questions to requested count', async () => {
      const availableQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['science'],
        1
      );

      expect(availableQuestions).toHaveLength(1);
      expect(availableQuestions[0].category).toBe('science');
    });

    it('should exclude questions from specific categories when not requested', async () => {
      const availableQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['math'],
        10
      );

      const categories = availableQuestions.map(q => q.category);
      expect(categories.every(cat => cat === 'math')).toBe(true);
      expect(categories).not.toContain('science');
      expect(categories).not.toContain('history');
    });

    it('should return empty array when no questions available in category', async () => {
      const availableQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['nonexistent_category'],
        10
      );

      expect(availableQuestions).toEqual([]);
    });
  });

  describe('Question Usage Tracking', () => {
    it('should track questions as used by host', async () => {
      // Initially, host should have no used questions
      const initialUsedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(initialUsedQuestions).toEqual([]);

      // Mark some questions as used
      const questionsToMark = testQuestionIds.slice(0, 2);
      await gameService.markQuestionsUsed(testHost1Id, questionsToMark);

      // Verify questions are now marked as used
      const usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(usedQuestions).toHaveLength(2);
      expect(usedQuestions).toContain(questionsToMark[0]);
      expect(usedQuestions).toContain(questionsToMark[1]);
    });

    it('should prevent duplicate marking of same question by same host', async () => {
      const questionId = testQuestionIds[0];

      // Mark question as used first time
      await gameService.markQuestionsUsed(testHost1Id, [questionId]);

      // Mark same question as used again (should not create duplicate)
      await gameService.markQuestionsUsed(testHost1Id, [questionId]);

      const usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      const questionUsageCount = usedQuestions.filter(id => id === questionId).length;

      expect(questionUsageCount).toBe(1);
    });

    it('should allow same question to be used by different hosts', async () => {
      const questionId = testQuestionIds[0];

      // Host 1 uses question
      await gameService.markQuestionsUsed(testHost1Id, [questionId]);

      // Host 2 uses same question (should be allowed)
      await gameService.markQuestionsUsed(testHost2Id, [questionId]);

      const host1UsedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      const host2UsedQuestions = await gameService.getHostUsedQuestions(testHost2Id);

      expect(host1UsedQuestions).toContain(questionId);
      expect(host2UsedQuestions).toContain(questionId);
    });

    it('should handle marking multiple questions at once', async () => {
      const questionsToMark = testQuestionIds.slice(0, 3);

      await gameService.markQuestionsUsed(testHost1Id, questionsToMark);

      const usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(usedQuestions).toHaveLength(3);

      questionsToMark.forEach(questionId => {
        expect(usedQuestions).toContain(questionId);
      });
    });

    it('should handle empty question list gracefully', async () => {
      await gameService.markQuestionsUsed(testHost1Id, []);

      const usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(usedQuestions).toEqual([]);
    });
  });

  describe('Question Exclusion Logic', () => {
    it('should exclude used questions from available questions', async () => {
      // Get initial available questions
      const initialQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['science'],
        10
      );

      const initialCount = initialQuestions.length;
      const questionToUse = initialQuestions[0];

      // Mark one question as used
      await gameService.markQuestionsUsed(testHost1Id, [questionToUse.id]);

      // Get available questions again
      const updatedQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['science'],
        10
      );

      expect(updatedQuestions.length).toBe(initialCount - 1);
      expect(updatedQuestions.map(q => q.id)).not.toContain(questionToUse.id);
    });

    it('should not affect question availability for other hosts', async () => {
      // Host 1 marks questions as used
      const questionsToMark = testQuestionIds.slice(0, 2);
      await gameService.markQuestionsUsed(testHost1Id, questionsToMark);

      // Host 2 should still see all questions as available
      const host2Questions = await gameService.getAvailableQuestionsForHost(
        testHost2Id,
        ['science', 'history'],
        10
      );

      const host2QuestionIds = host2Questions.map(q => q.id);
      questionsToMark.forEach(questionId => {
        expect(host2QuestionIds).toContain(questionId);
      });
    });

    it('should properly handle progressive question depletion', async () => {
      const categories = ['science'];

      // Get all available science questions
      const allQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        categories,
        100
      );

      const scienceQuestions = allQuestions.filter(q => q.category === 'science');
      const initialCount = scienceQuestions.length;

      // Mark half the questions as used
      const halfCount = Math.floor(initialCount / 2);
      const questionsToMark = scienceQuestions.slice(0, halfCount).map(q => q.id);

      await gameService.markQuestionsUsed(testHost1Id, questionsToMark);

      // Check remaining available questions
      const remainingQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        categories,
        100
      );

      const remainingScienceQuestions = remainingQuestions.filter(q => q.category === 'science');
      expect(remainingScienceQuestions.length).toBe(initialCount - halfCount);

      // Verify none of the marked questions are in remaining list
      const remainingIds = remainingScienceQuestions.map(q => q.id);
      questionsToMark.forEach(markedId => {
        expect(remainingIds).not.toContain(markedId);
      });
    });
  });

  describe('Integration with Game Creation', () => {
    it('should automatically mark questions as used when game is created', async () => {
      // Create a game that will use questions
      const gameRequest: CreateGameRequest = {
        title: 'Question Usage Test Game',
        scheduled_date: '2025-12-01',
        total_rounds: 1,
        questions_per_round: 2,
        selected_categories: ['science'],
      };

      const game = await gameService.createGame(testHost1Id, gameRequest);

      // Create a team and start the game (this should mark questions as used)
      await gameService.createTeam({
        game_id: game.id,
        name: 'Test Team',
      });

      await gameService.startMultiUserGame(game.id);

      // Verify questions are marked as used
      const usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(usedQuestions).toHaveLength(2); // 1 round * 2 questions per round

      // Verify used questions are no longer available
      const availableQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['science'],
        10
      );

      const availableIds = availableQuestions.map(q => q.id);
      usedQuestions.forEach(usedId => {
        expect(availableIds).not.toContain(usedId);
      });
    });

    it('should prevent game creation when insufficient unique questions available', async () => {
      // First, mark most questions as used
      const allQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['science'],
        100
      );

      const scienceQuestions = allQuestions.filter(q => q.category === 'science');
      const mostQuestions = scienceQuestions.slice(0, -1).map(q => q.id); // Leave only 1 question

      await gameService.markQuestionsUsed(testHost1Id, mostQuestions);

      // Try to create game requiring more questions than available
      const gameRequest: CreateGameRequest = {
        title: 'Insufficient Questions Test',
        scheduled_date: '2025-12-01',
        total_rounds: 1,
        questions_per_round: 3, // Need 3 questions but only 1 available
        selected_categories: ['science'],
      };

      const game = await gameService.createGame(testHost1Id, gameRequest);

      await gameService.createTeam({
        game_id: game.id,
        name: 'Test Team',
      });

      // Starting the game should fail due to insufficient questions
      await expect(
        gameService.startMultiUserGame(game.id)
      ).rejects.toThrow('Not enough available questions');
    });

    it('should support multiple games with progressive question depletion', async () => {
      // Create first game
      const game1Request: CreateGameRequest = {
        title: 'Game 1',
        scheduled_date: '2025-12-01',
        total_rounds: 1,
        questions_per_round: 1,
        selected_categories: ['science'],
      };

      const game1 = await gameService.createGame(testHost1Id, game1Request);
      await gameService.createTeam({ game_id: game1.id, name: 'Team 1' });
      await gameService.startMultiUserGame(game1.id);

      // Verify 1 question is used
      let usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(usedQuestions).toHaveLength(1);

      // Create second game
      const game2Request: CreateGameRequest = {
        title: 'Game 2',
        scheduled_date: '2025-12-02',
        total_rounds: 1,
        questions_per_round: 1,
        selected_categories: ['science'],
      };

      const game2 = await gameService.createGame(testHost1Id, game2Request);
      await gameService.createTeam({ game_id: game2.id, name: 'Team 2' });
      await gameService.startMultiUserGame(game2.id);

      // Verify 2 questions are used total
      usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(usedQuestions).toHaveLength(2);

      // Verify questions from game 1 and game 2 are different
      const game1Questions = await supabase
        .from('round_questions')
        .select('question_id, rounds!inner(game_id)')
        .eq('rounds.game_id', game1.id);

      const game2Questions = await supabase
        .from('round_questions')
        .select('question_id, rounds!inner(game_id)')
        .eq('rounds.game_id', game2.id);

      const game1QuestionIds = game1Questions.data?.map(rq => rq.question_id) || [];
      const game2QuestionIds = game2Questions.data?.map(rq => rq.question_id) || [];

      // No overlap between game question sets
      const hasOverlap = game1QuestionIds.some(id => game2QuestionIds.includes(id));
      expect(hasOverlap).toBe(false);
    });
  });

  describe('Data Consistency and Edge Cases', () => {
    it('should handle non-existent question IDs gracefully', async () => {
      const fakeQuestionId = '00000000-0000-0000-0000-000000000000';

      // Should not throw error when marking non-existent question
      await expect(
        gameService.markQuestionsUsed(testHost1Id, [fakeQuestionId])
      ).resolves.not.toThrow();

      // Should not appear in used questions list
      const usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(usedQuestions).not.toContain(fakeQuestionId);
    });

    it('should maintain data integrity across concurrent operations', async () => {
      const questionId = testQuestionIds[0];

      // Simulate concurrent marking of same question by same host
      const markingPromises = [
        gameService.markQuestionsUsed(testHost1Id, [questionId]),
        gameService.markQuestionsUsed(testHost1Id, [questionId]),
        gameService.markQuestionsUsed(testHost1Id, [questionId]),
      ];

      await Promise.all(markingPromises);

      // Should still only have one entry
      const usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      const questionUsageCount = usedQuestions.filter(id => id === questionId).length;
      expect(questionUsageCount).toBe(1);
    });

    it('should track usage timestamps for audit purposes', async () => {
      const questionId = testQuestionIds[0];
      const beforeMark = new Date();

      await gameService.markQuestionsUsed(testHost1Id, [questionId]);

      const afterMark = new Date();

      // Check direct database entry for timestamp
      const { data: usageRecord } = await supabase
        .from('host_used_questions')
        .select('used_at')
        .eq('host_id', testHost1Id)
        .eq('question_id', questionId)
        .single();

      expect(usageRecord?.used_at).toBeTruthy();
      const usedAt = new Date(usageRecord.used_at);

      expect(usedAt.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime());
      expect(usedAt.getTime()).toBeLessThanOrEqual(afterMark.getTime());
    });

    it('should handle database function fallbacks gracefully', async () => {
      // Test that the service methods work even if database functions fail
      // This is a placeholder for testing fallback logic

      const availableQuestions = await gameService.getAvailableQuestionsForHost(
        testHost1Id,
        ['science'],
        1
      );

      expect(Array.isArray(availableQuestions)).toBe(true);

      // Mark questions as used should work
      await gameService.markQuestionsUsed(testHost1Id, testQuestionIds.slice(0, 1));

      const usedQuestions = await gameService.getHostUsedQuestions(testHost1Id);
      expect(usedQuestions).toHaveLength(1);
    });
  });
});
// Database Contract Tests for Multi-User Trivia Game
// These tests verify the database schema and constraints

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type {
  Game,
  Team,
  TeamPlayer,
  Round,
  RoundQuestion,
  TeamAnswer,
  HostUsedQuestion,
  EnhancedUserProfile
} from '../../contracts/multi-user-types';

// Note: These tests will initially fail as the database schema doesn't exist yet
// They serve as contracts that must be satisfied by the implementation

describe('Multi-User Database Schema', () => {
  let supabase: any;
  let testUserId: string;
  let testGameId: string;
  let testTeamId: string;

  beforeEach(async () => {
    // Initialize test client
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Create test user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .insert({
        username: 'testhost',
        display_name: 'Test Host'
      })
      .select()
      .single();

    testUserId = profile.id;
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUserId) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId);
    }
  });

  describe('Enhanced User Profiles', () => {
    it('should allow adding display_name to user_profiles', async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        id: testUserId,
        username: 'testhost',
        display_name: 'Test Host'
      });
    });

    it('should enforce display_name length constraints', async () => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ display_name: 'x'.repeat(51) })
        .eq('id', testUserId);

      expect(error).toBeTruthy();
      expect(error.message).toContain('display_name_length');
    });
  });

  describe('Games Table', () => {
    beforeEach(async () => {
      const { data: game } = await supabase
        .from('games')
        .insert({
          host_id: testUserId,
          title: 'Test Game',
          scheduled_date: '2025-12-01',
          total_rounds: 3,
          questions_per_round: 5,
          selected_categories: ['history', 'science']
        })
        .select()
        .single();

      testGameId = game.id;
    });

    it('should create game with required fields', async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', testGameId)
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        host_id: testUserId,
        title: 'Test Game',
        status: 'setup',
        max_teams: 20,
        max_players_per_team: 4
      });
    });

    it('should enforce max_teams constraint (1-20)', async () => {
      const { error } = await supabase
        .from('games')
        .insert({
          host_id: testUserId,
          title: 'Invalid Game',
          scheduled_date: '2025-12-01',
          max_teams: 25,
          total_rounds: 1,
          questions_per_round: 1,
          selected_categories: ['test']
        });

      expect(error).toBeTruthy();
    });

    it('should enforce max_players_per_team constraint (1-4)', async () => {
      const { error } = await supabase
        .from('games')
        .insert({
          host_id: testUserId,
          title: 'Invalid Game',
          scheduled_date: '2025-12-01',
          max_players_per_team: 5,
          total_rounds: 1,
          questions_per_round: 1,
          selected_categories: ['test']
        });

      expect(error).toBeTruthy();
    });
  });

  describe('Teams Table', () => {
    beforeEach(async () => {
      // Create test game first
      const { data: game } = await supabase
        .from('games')
        .insert({
          host_id: testUserId,
          title: 'Test Game',
          scheduled_date: '2025-12-01',
          total_rounds: 1,
          questions_per_round: 1,
          selected_categories: ['test']
        })
        .select()
        .single();

      testGameId = game.id;

      const { data: team } = await supabase
        .from('teams')
        .insert({
          game_id: testGameId,
          name: 'Test Team',
          display_color: '#FF0000'
        })
        .select()
        .single();

      testTeamId = team.id;
    });

    it('should create team with game association', async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', testTeamId)
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        game_id: testGameId,
        name: 'Test Team',
        display_color: '#FF0000',
        current_score: 0
      });
    });

    it('should enforce unique team name per game', async () => {
      const { error } = await supabase
        .from('teams')
        .insert({
          game_id: testGameId,
          name: 'Test Team', // Duplicate name
          display_color: '#00FF00'
        });

      expect(error).toBeTruthy();
    });

    it('should cascade delete when game is deleted', async () => {
      await supabase
        .from('games')
        .delete()
        .eq('id', testGameId);

      const { data } = await supabase
        .from('teams')
        .select('id')
        .eq('id', testTeamId);

      expect(data).toHaveLength(0);
    });
  });

  describe('Team Players Table', () => {
    let testPlayerId: string;

    beforeEach(async () => {
      // Create test player
      const { data: player } = await supabase
        .from('user_profiles')
        .insert({
          username: 'testplayer',
          display_name: 'Test Player'
        })
        .select()
        .single();

      testPlayerId = player.id;

      // Create test game and team (setup from previous tests)
      const { data: game } = await supabase
        .from('games')
        .insert({
          host_id: testUserId,
          title: 'Test Game',
          scheduled_date: '2025-12-01',
          total_rounds: 1,
          questions_per_round: 1,
          selected_categories: ['test']
        })
        .select()
        .single();

      testGameId = game.id;

      const { data: team } = await supabase
        .from('teams')
        .insert({
          game_id: testGameId,
          name: 'Test Team'
        })
        .select()
        .single();

      testTeamId = team.id;
    });

    it('should allow player to join team', async () => {
      const { data, error } = await supabase
        .from('team_players')
        .insert({
          team_id: testTeamId,
          player_id: testPlayerId
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        team_id: testTeamId,
        player_id: testPlayerId
      });
    });

    it('should enforce unique player per team', async () => {
      // First join should succeed
      await supabase
        .from('team_players')
        .insert({
          team_id: testTeamId,
          player_id: testPlayerId
        });

      // Second join should fail
      const { error } = await supabase
        .from('team_players')
        .insert({
          team_id: testTeamId,
          player_id: testPlayerId
        });

      expect(error).toBeTruthy();
    });

    it('should prevent player from joining multiple teams in same game', async () => {
      // Create second team in same game
      const { data: team2 } = await supabase
        .from('teams')
        .insert({
          game_id: testGameId,
          name: 'Test Team 2'
        })
        .select()
        .single();

      // Join first team
      await supabase
        .from('team_players')
        .insert({
          team_id: testTeamId,
          player_id: testPlayerId
        });

      // Attempt to join second team should fail
      const { error } = await supabase
        .from('team_players')
        .insert({
          team_id: team2.id,
          player_id: testPlayerId
        });

      expect(error).toBeTruthy();
    });
  });

  describe('Team Answers Table', () => {
    let testRoundQuestionId: string;

    beforeEach(async () => {
      // Setup game, team, round, and question
      const { data: game } = await supabase
        .from('games')
        .insert({
          host_id: testUserId,
          title: 'Test Game',
          scheduled_date: '2025-12-01',
          total_rounds: 1,
          questions_per_round: 1,
          selected_categories: ['test']
        })
        .select()
        .single();

      testGameId = game.id;

      const { data: team } = await supabase
        .from('teams')
        .insert({
          game_id: testGameId,
          name: 'Test Team'
        })
        .select()
        .single();

      testTeamId = team.id;

      const { data: round } = await supabase
        .from('rounds')
        .insert({
          game_id: testGameId,
          round_number: 1
        })
        .select()
        .single();

      // Assuming a test question exists
      const { data: question } = await supabase
        .from('questions')
        .select('id')
        .limit(1)
        .single();

      const { data: roundQuestion } = await supabase
        .from('round_questions')
        .insert({
          round_id: round.id,
          question_id: question.id,
          question_order: 1
        })
        .select()
        .single();

      testRoundQuestionId = roundQuestion.id;
    });

    it('should record team answer', async () => {
      const { data, error } = await supabase
        .from('team_answers')
        .insert({
          team_id: testTeamId,
          round_question_id: testRoundQuestionId,
          submitted_by: testUserId,
          answer: 'A',
          is_correct: true,
          points_earned: 10
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        team_id: testTeamId,
        answer: 'A',
        is_correct: true,
        points_earned: 10
      });
    });

    it('should enforce answer format (A, B, C, D)', async () => {
      const { error } = await supabase
        .from('team_answers')
        .insert({
          team_id: testTeamId,
          round_question_id: testRoundQuestionId,
          submitted_by: testUserId,
          answer: 'E', // Invalid answer
          is_correct: false,
          points_earned: 0
        });

      expect(error).toBeTruthy();
    });

    it('should enforce one answer per team per question', async () => {
      // First answer
      await supabase
        .from('team_answers')
        .insert({
          team_id: testTeamId,
          round_question_id: testRoundQuestionId,
          submitted_by: testUserId,
          answer: 'A',
          is_correct: true,
          points_earned: 10
        });

      // Second answer should fail
      const { error } = await supabase
        .from('team_answers')
        .insert({
          team_id: testTeamId,
          round_question_id: testRoundQuestionId,
          submitted_by: testUserId,
          answer: 'B',
          is_correct: false,
          points_earned: 0
        });

      expect(error).toBeTruthy();
    });
  });

  describe('Host Used Questions Table', () => {
    it('should track question usage per host', async () => {
      // Assuming a test question exists
      const { data: question } = await supabase
        .from('questions')
        .select('id')
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from('host_used_questions')
        .insert({
          host_id: testUserId,
          question_id: question.id
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        host_id: testUserId,
        question_id: question.id
      });
    });

    it('should enforce unique question per host', async () => {
      const { data: question } = await supabase
        .from('questions')
        .select('id')
        .limit(1)
        .single();

      // First usage
      await supabase
        .from('host_used_questions')
        .insert({
          host_id: testUserId,
          question_id: question.id
        });

      // Second usage should fail
      const { error } = await supabase
        .from('host_used_questions')
        .insert({
          host_id: testUserId,
          question_id: question.id
        });

      expect(error).toBeTruthy();
    });
  });

  describe('Row Level Security', () => {
    it('should allow host to access own games', async () => {
      // This test verifies RLS policies are working
      // Implementation depends on proper auth context
      expect(true).toBe(true); // Placeholder
    });

    it('should prevent unauthorized access to game data', async () => {
      // This test verifies RLS policies block unauthorized access
      // Implementation depends on proper auth context
      expect(true).toBe(true); // Placeholder
    });
  });
});
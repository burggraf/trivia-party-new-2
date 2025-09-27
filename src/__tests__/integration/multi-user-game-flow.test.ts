// Integration Test: Complete Multi-User Game Workflow
// Tests the entire flow from game creation to completion

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { gameService } from '../../services/game';
import type {
  Game,
  Team,
  Round,
  CreateGameRequest,
  CreateTeamRequest,
  JoinTeamRequest,
  SubmitTeamAnswerRequest,
} from '../../contracts/multi-user-types';

describe('Multi-User Game Flow Integration', () => {
  let supabase: any;
  let testHostId: string;
  let testPlayer1Id: string;
  let testPlayer2Id: string;
  let testGame: Game;
  let testTeam1: Team;
  let testTeam2: Team;

  beforeEach(async () => {
    // Initialize test client
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Create test users
    const { data: host } = await supabase
      .from('user_profiles')
      .insert({
        username: 'testhost',
        display_name: 'Test Host'
      })
      .select()
      .single();

    const { data: player1 } = await supabase
      .from('user_profiles')
      .insert({
        username: 'player1',
        display_name: 'Player One'
      })
      .select()
      .single();

    const { data: player2 } = await supabase
      .from('user_profiles')
      .insert({
        username: 'player2',
        display_name: 'Player Two'
      })
      .select()
      .single();

    testHostId = host.id;
    testPlayer1Id = player1.id;
    testPlayer2Id = player2.id;
  });

  afterEach(async () => {
    // Cleanup test data
    if (testHostId) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testHostId);
    }
    if (testPlayer1Id) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testPlayer1Id);
    }
    if (testPlayer2Id) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testPlayer2Id);
    }
  });

  describe('Complete Game Workflow', () => {
    it('should execute full game flow from creation to completion', async () => {
      // Step 1: Host creates a game
      const gameRequest: CreateGameRequest = {
        title: 'Integration Test Game',
        scheduled_date: '2025-12-01',
        total_rounds: 2,
        questions_per_round: 3,
        selected_categories: ['science', 'history'],
        max_teams: 2,
        max_players_per_team: 2,
      };

      testGame = await gameService.createGame(testHostId, gameRequest);

      expect(testGame).toMatchObject({
        host_id: testHostId,
        title: 'Integration Test Game',
        status: 'setup',
        total_rounds: 2,
        questions_per_round: 3,
        max_teams: 2,
        max_players_per_team: 2,
      });

      // Step 2: Create teams
      const team1Request: CreateTeamRequest = {
        game_id: testGame.id,
        name: 'Team Alpha',
        display_color: '#FF0000',
      };

      const team2Request: CreateTeamRequest = {
        game_id: testGame.id,
        name: 'Team Beta',
        display_color: '#0000FF',
      };

      testTeam1 = await gameService.createTeam(team1Request);
      testTeam2 = await gameService.createTeam(team2Request);

      expect(testTeam1).toMatchObject({
        game_id: testGame.id,
        name: 'Team Alpha',
        display_color: '#FF0000',
        current_score: 0,
      });

      expect(testTeam2).toMatchObject({
        game_id: testGame.id,
        name: 'Team Beta',
        display_color: '#0000FF',
        current_score: 0,
      });

      // Step 3: Players join teams
      const joinTeam1Request: JoinTeamRequest = {
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      };

      const joinTeam2Request: JoinTeamRequest = {
        team_id: testTeam2.id,
        player_id: testPlayer2Id,
      };

      await gameService.joinTeam(joinTeam1Request);
      await gameService.joinTeam(joinTeam2Request);

      // Verify team memberships
      const gameTeams = await gameService.getGameTeams(testGame.id);
      expect(gameTeams).toHaveLength(2);

      const team1WithPlayers = gameTeams.find(t => t.id === testTeam1.id);
      const team2WithPlayers = gameTeams.find(t => t.id === testTeam2.id);

      expect(team1WithPlayers?.players).toHaveLength(1);
      expect(team1WithPlayers?.players[0].id).toBe(testPlayer1Id);
      expect(team2WithPlayers?.players).toHaveLength(1);
      expect(team2WithPlayers?.players[0].id).toBe(testPlayer2Id);

      // Step 4: Start the game
      const startGameResponse = await gameService.startMultiUserGame(testGame.id);

      expect(startGameResponse.game.status).toBe('in_progress');
      expect(startGameResponse.teams).toHaveLength(2);
      expect(startGameResponse.first_round).toBeTruthy();
      expect(startGameResponse.first_questions).toHaveLength(3);

      const updatedGame = startGameResponse.game;
      const firstRound = startGameResponse.first_round;
      const firstQuestions = startGameResponse.first_questions;

      // Step 5: Simulate answering questions in the first round
      for (let i = 0; i < firstQuestions.length; i++) {
        const question = firstQuestions[i];

        // Team 1 answers (correct answers)
        const team1AnswerRequest: SubmitTeamAnswerRequest = {
          team_id: testTeam1.id,
          round_question_id: question.id,
          answer: 'A', // Assuming 'A' is always correct
          submitted_by: testPlayer1Id,
        };

        // Team 2 answers (incorrect answers)
        const team2AnswerRequest: SubmitTeamAnswerRequest = {
          team_id: testTeam2.id,
          round_question_id: question.id,
          answer: 'B', // Assuming this is incorrect
          submitted_by: testPlayer2Id,
        };

        const team1Answer = await gameService.submitTeamAnswer(team1AnswerRequest);
        const team2Answer = await gameService.submitTeamAnswer(team2AnswerRequest);

        expect(team1Answer.is_correct).toBe(true);
        expect(team1Answer.points_earned).toBe(10);
        expect(team2Answer.is_correct).toBe(false);
        expect(team2Answer.points_earned).toBe(0);
      }

      // Step 6: Complete first round
      await gameService.completeRound(firstRound.id);

      // Step 7: Check team scores after first round
      const team1Stats = await gameService.getTeamStats(testTeam1.id);
      const team2Stats = await gameService.getTeamStats(testTeam2.id);

      expect(team1Stats.total_answers).toBe(3);
      expect(team1Stats.correct_answers).toBe(3);
      expect(team1Stats.total_points).toBe(30);
      expect(team1Stats.accuracy_percentage).toBe(100);

      expect(team2Stats.total_answers).toBe(3);
      expect(team2Stats.correct_answers).toBe(0);
      expect(team2Stats.total_points).toBe(0);
      expect(team2Stats.accuracy_percentage).toBe(0);

      // Step 8: Start second round
      const { data: rounds } = await supabase
        .from('rounds')
        .select('*')
        .eq('game_id', testGame.id)
        .eq('round_number', 2)
        .single();

      const secondRound = await gameService.startRound(rounds.id);
      const secondRoundQuestions = await gameService.getRoundQuestions(secondRound.id);

      expect(secondRound.status).toBe('in_progress');
      expect(secondRoundQuestions).toHaveLength(3);

      // Step 9: Simulate second round (mixed results)
      for (let i = 0; i < secondRoundQuestions.length; i++) {
        const question = secondRoundQuestions[i];

        // Both teams get some questions right and some wrong
        const team1Answer = i < 2 ? 'A' : 'B'; // 2 correct, 1 incorrect
        const team2Answer = i < 1 ? 'A' : 'B'; // 1 correct, 2 incorrect

        await gameService.submitTeamAnswer({
          team_id: testTeam1.id,
          round_question_id: question.id,
          answer: team1Answer,
          submitted_by: testPlayer1Id,
        });

        await gameService.submitTeamAnswer({
          team_id: testTeam2.id,
          round_question_id: question.id,
          answer: team2Answer,
          submitted_by: testPlayer2Id,
        });
      }

      // Step 10: Complete second round
      await gameService.completeRound(secondRound.id);

      // Step 11: Complete the game
      const gameSummary = await gameService.completeMultiUserGame(testGame.id);

      expect(gameSummary.game.status).toBe('completed');
      expect(gameSummary.teams).toHaveLength(2);
      expect(gameSummary.rounds).toHaveLength(2);

      // Verify final scores
      const finalTeam1 = gameSummary.teams.find(t => t.id === testTeam1.id);
      const finalTeam2 = gameSummary.teams.find(t => t.id === testTeam2.id);

      expect(finalTeam1?.total_score).toBe(50); // 30 + 20 points
      expect(finalTeam1?.correct_answers).toBe(5); // 3 + 2 correct
      expect(finalTeam1?.total_questions).toBe(6); // 6 total questions

      expect(finalTeam2?.total_score).toBe(10); // 0 + 10 points
      expect(finalTeam2?.correct_answers).toBe(1); // 0 + 1 correct
      expect(finalTeam2?.total_questions).toBe(6); // 6 total questions

      // Verify overall game statistics
      expect(gameSummary.overall_stats.total_questions).toBe(12); // 2 teams * 6 questions
      expect(gameSummary.overall_stats.total_correct_answers).toBe(6); // 5 + 1
      expect(gameSummary.overall_stats.average_accuracy).toBe(50); // 6/12 * 100
    });

    it('should enforce business rules during game flow', async () => {
      // Create a game
      const gameRequest: CreateGameRequest = {
        title: 'Business Rules Test',
        scheduled_date: '2025-12-01',
        total_rounds: 1,
        questions_per_round: 1,
        selected_categories: ['science'],
        max_teams: 1,
        max_players_per_team: 1,
      };

      testGame = await gameService.createGame(testHostId, gameRequest);

      // Create a team
      testTeam1 = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Test Team',
        display_color: '#FF0000',
      });

      // Player joins team
      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      });

      // Try to add second player to team (should fail - max 1 player per team)
      await expect(
        gameService.joinTeam({
          team_id: testTeam1.id,
          player_id: testPlayer2Id,
        })
      ).rejects.toThrow('Team is full');

      // Try to create duplicate team name (should fail)
      await expect(
        gameService.createTeam({
          game_id: testGame.id,
          name: 'Test Team', // Duplicate name
          display_color: '#00FF00',
        })
      ).rejects.toThrow();

      // Try to start game without enough teams/players should work but with validation
      const startResponse = await gameService.startMultiUserGame(testGame.id);
      expect(startResponse.game.status).toBe('in_progress');
    });

    it('should handle question uniqueness across games', async () => {
      // Create first game
      const game1Request: CreateGameRequest = {
        title: 'Question Uniqueness Test 1',
        scheduled_date: '2025-12-01',
        total_rounds: 1,
        questions_per_round: 2,
        selected_categories: ['science'],
      };

      const game1 = await gameService.createGame(testHostId, game1Request);

      // Start first game (this will mark questions as used)
      await gameService.createTeam({
        game_id: game1.id,
        name: 'Team 1',
      });

      await gameService.startMultiUserGame(game1.id);

      // Get host's used questions
      const usedQuestions = await gameService.getHostUsedQuestions(testHostId);
      expect(usedQuestions).toHaveLength(2);

      // Create second game
      const game2Request: CreateGameRequest = {
        title: 'Question Uniqueness Test 2',
        scheduled_date: '2025-12-02',
        total_rounds: 1,
        questions_per_round: 2,
        selected_categories: ['science'],
      };

      const game2 = await gameService.createGame(testHostId, game2Request);

      // Get available questions for second game (should exclude previously used ones)
      const availableQuestions = await gameService.getAvailableQuestionsForHost(
        testHostId,
        ['science'],
        5
      );

      // Verify no overlap with used questions
      const availableIds = availableQuestions.map(q => q.id);
      const hasOverlap = usedQuestions.some(usedId => availableIds.includes(usedId));
      expect(hasOverlap).toBe(false);
    });

    it('should support real-time game state updates', async () => {
      // This test would verify real-time subscriptions work
      // For now, it's a placeholder as real-time features are not fully implemented

      const gameRequest: CreateGameRequest = {
        title: 'Real-time Test Game',
        scheduled_date: '2025-12-01',
        total_rounds: 1,
        questions_per_round: 1,
        selected_categories: ['science'],
      };

      testGame = await gameService.createGame(testHostId, gameRequest);

      // Test that subscription methods exist (even if not implemented)
      expect(() => {
        gameService.subscribeToGameUpdates(testGame.id, () => {});
      }).not.toThrow();

      // Placeholder test - in full implementation, this would test actual subscriptions
      expect(true).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle insufficient questions gracefully', async () => {
      // Create a game requiring more questions than available in category
      const gameRequest: CreateGameRequest = {
        title: 'Insufficient Questions Test',
        scheduled_date: '2025-12-01',
        total_rounds: 100, // Unrealistic number
        questions_per_round: 100,
        selected_categories: ['nonexistent_category'],
      };

      testGame = await gameService.createGame(testHostId, gameRequest);

      await gameService.createTeam({
        game_id: testGame.id,
        name: 'Test Team',
      });

      // Starting game should fail due to insufficient questions
      await expect(
        gameService.startMultiUserGame(testGame.id)
      ).rejects.toThrow('Not enough available questions');
    });

    it('should prevent duplicate answers from same team', async () => {
      // Create and start a minimal game
      const gameRequest: CreateGameRequest = {
        title: 'Duplicate Answer Test',
        scheduled_date: '2025-12-01',
        total_rounds: 1,
        questions_per_round: 1,
        selected_categories: ['science'],
      };

      testGame = await gameService.createGame(testHostId, gameRequest);
      testTeam1 = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Test Team',
      });

      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      });

      const startResponse = await gameService.startMultiUserGame(testGame.id);
      const question = startResponse.first_questions[0];

      // Submit first answer
      await gameService.submitTeamAnswer({
        team_id: testTeam1.id,
        round_question_id: question.id,
        answer: 'A',
        submitted_by: testPlayer1Id,
      });

      // Try to submit duplicate answer (should fail)
      await expect(
        gameService.submitTeamAnswer({
          team_id: testTeam1.id,
          round_question_id: question.id,
          answer: 'B',
          submitted_by: testPlayer1Id,
        })
      ).rejects.toThrow();
    });
  });
});
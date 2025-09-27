// Integration Test: Team Management and Player Joining
// Tests team formation, player management, and related business rules

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { gameService } from '../../services/game';
import type {
  Game,
  Team,
  TeamPlayer,
  CreateGameRequest,
  CreateTeamRequest,
  JoinTeamRequest,
} from '../../contracts/multi-user-types';

describe('Team Management Integration Tests', () => {
  let supabase: any;
  let testHostId: string;
  let testPlayer1Id: string;
  let testPlayer2Id: string;
  let testPlayer3Id: string;
  let testPlayer4Id: string;
  let testPlayer5Id: string;
  let testGame: Game;

  beforeEach(async () => {
    // Initialize test client
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Create test users
    const users = await Promise.all([
      supabase.from('user_profiles').insert({
        username: 'testhost',
        display_name: 'Test Host'
      }).select().single(),
      supabase.from('user_profiles').insert({
        username: 'player1',
        display_name: 'Player One'
      }).select().single(),
      supabase.from('user_profiles').insert({
        username: 'player2',
        display_name: 'Player Two'
      }).select().single(),
      supabase.from('user_profiles').insert({
        username: 'player3',
        display_name: 'Player Three'
      }).select().single(),
      supabase.from('user_profiles').insert({
        username: 'player4',
        display_name: 'Player Four'
      }).select().single(),
      supabase.from('user_profiles').insert({
        username: 'player5',
        display_name: 'Player Five'
      }).select().single(),
    ]);

    testHostId = users[0].data.id;
    testPlayer1Id = users[1].data.id;
    testPlayer2Id = users[2].data.id;
    testPlayer3Id = users[3].data.id;
    testPlayer4Id = users[4].data.id;
    testPlayer5Id = users[5].data.id;

    // Create a test game
    const gameRequest: CreateGameRequest = {
      title: 'Team Management Test Game',
      scheduled_date: '2025-12-01',
      total_rounds: 1,
      questions_per_round: 1,
      selected_categories: ['science'],
      max_teams: 5,
      max_players_per_team: 4,
    };

    testGame = await gameService.createGame(testHostId, gameRequest);
  });

  afterEach(async () => {
    // Cleanup test data
    const userIds = [testHostId, testPlayer1Id, testPlayer2Id, testPlayer3Id, testPlayer4Id, testPlayer5Id];
    for (const userId of userIds) {
      if (userId) {
        await supabase
          .from('user_profiles')
          .delete()
          .eq('id', userId);
      }
    }
  });

  describe('Team Creation', () => {
    it('should create teams with valid data', async () => {
      const teamRequest: CreateTeamRequest = {
        game_id: testGame.id,
        name: 'Alpha Team',
        display_color: '#FF0000',
      };

      const team = await gameService.createTeam(teamRequest);

      expect(team).toMatchObject({
        game_id: testGame.id,
        name: 'Alpha Team',
        display_color: '#FF0000',
        current_score: 0,
      });
      expect(team.id).toBeTruthy();
      expect(team.created_at).toBeTruthy();
    });

    it('should create team with default color when not specified', async () => {
      const teamRequest: CreateTeamRequest = {
        game_id: testGame.id,
        name: 'Default Color Team',
      };

      const team = await gameService.createTeam(teamRequest);

      expect(team.display_color).toBe('#FF0000'); // Default color
    });

    it('should enforce unique team names within a game', async () => {
      // Create first team
      await gameService.createTeam({
        game_id: testGame.id,
        name: 'Unique Team',
        display_color: '#FF0000',
      });

      // Try to create second team with same name (should fail)
      await expect(
        gameService.createTeam({
          game_id: testGame.id,
          name: 'Unique Team', // Duplicate name
          display_color: '#00FF00',
        })
      ).rejects.toThrow();
    });

    it('should allow same team name across different games', async () => {
      // Create another game
      const game2 = await gameService.createGame(testHostId, {
        title: 'Second Game',
        scheduled_date: '2025-12-02',
        total_rounds: 1,
        questions_per_round: 1,
        selected_categories: ['science'],
      });

      // Create team with same name in first game
      const team1 = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Common Name',
        display_color: '#FF0000',
      });

      // Create team with same name in second game (should succeed)
      const team2 = await gameService.createTeam({
        game_id: game2.id,
        name: 'Common Name',
        display_color: '#00FF00',
      });

      expect(team1.name).toBe('Common Name');
      expect(team2.name).toBe('Common Name');
      expect(team1.game_id).toBe(testGame.id);
      expect(team2.game_id).toBe(game2.id);
    });
  });

  describe('Player Joining and Leaving', () => {
    let testTeam1: Team;
    let testTeam2: Team;

    beforeEach(async () => {
      testTeam1 = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Team Alpha',
        display_color: '#FF0000',
      });

      testTeam2 = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Team Beta',
        display_color: '#0000FF',
      });
    });

    it('should allow player to join a team', async () => {
      const joinRequest: JoinTeamRequest = {
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      };

      const teamPlayer = await gameService.joinTeam(joinRequest);

      expect(teamPlayer).toMatchObject({
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      });
      expect(teamPlayer.id).toBeTruthy();
      expect(teamPlayer.joined_at).toBeTruthy();

      // Verify player is in the team
      const playerTeam = await gameService.getPlayerTeam(testGame.id, testPlayer1Id);
      expect(playerTeam?.id).toBe(testTeam1.id);
    });

    it('should retrieve teams with player details', async () => {
      // Add players to teams
      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      });

      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer2Id,
      });

      await gameService.joinTeam({
        team_id: testTeam2.id,
        player_id: testPlayer3Id,
      });

      const gameTeams = await gameService.getGameTeams(testGame.id);

      expect(gameTeams).toHaveLength(2);

      const team1WithPlayers = gameTeams.find(t => t.id === testTeam1.id);
      const team2WithPlayers = gameTeams.find(t => t.id === testTeam2.id);

      expect(team1WithPlayers?.players).toHaveLength(2);
      expect(team1WithPlayers?.players.map(p => p.id)).toContain(testPlayer1Id);
      expect(team1WithPlayers?.players.map(p => p.id)).toContain(testPlayer2Id);

      expect(team2WithPlayers?.players).toHaveLength(1);
      expect(team2WithPlayers?.players[0].id).toBe(testPlayer3Id);

      // Verify player details are included
      expect(team1WithPlayers?.players[0].display_name).toBeTruthy();
      expect(team1WithPlayers?.players[0].joined_at).toBeTruthy();
    });

    it('should allow player to leave a team', async () => {
      // Player joins team
      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      });

      // Verify player is in team
      const playerTeam = await gameService.getPlayerTeam(testGame.id, testPlayer1Id);
      expect(playerTeam?.id).toBe(testTeam1.id);

      // Player leaves team
      await gameService.leaveTeam(testTeam1.id, testPlayer1Id);

      // Verify player is no longer in team
      const playerTeamAfter = await gameService.getPlayerTeam(testGame.id, testPlayer1Id);
      expect(playerTeamAfter).toBeNull();

      // Verify team is empty
      const gameTeams = await gameService.getGameTeams(testGame.id);
      const team1WithPlayers = gameTeams.find(t => t.id === testTeam1.id);
      expect(team1WithPlayers?.players).toHaveLength(0);
    });

    it('should prevent player from joining multiple teams in same game', async () => {
      // Player joins first team
      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      });

      // Player tries to join second team (should fail)
      await expect(
        gameService.joinTeam({
          team_id: testTeam2.id,
          player_id: testPlayer1Id,
        })
      ).rejects.toThrow('Player is already in a team for this game');
    });

    it('should enforce maximum players per team (4 players)', async () => {
      // Add 4 players to team (should succeed)
      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      });

      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer2Id,
      });

      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer3Id,
      });

      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer4Id,
      });

      // Verify team has 4 players
      const gameTeams = await gameService.getGameTeams(testGame.id);
      const team1WithPlayers = gameTeams.find(t => t.id === testTeam1.id);
      expect(team1WithPlayers?.players).toHaveLength(4);

      // Try to add 5th player (should fail)
      await expect(
        gameService.joinTeam({
          team_id: testTeam1.id,
          player_id: testPlayer5Id,
        })
      ).rejects.toThrow('Team is full');
    });

    it('should prevent duplicate joins by same player to same team', async () => {
      // Player joins team
      await gameService.joinTeam({
        team_id: testTeam1.id,
        player_id: testPlayer1Id,
      });

      // Player tries to join same team again (should fail)
      await expect(
        gameService.joinTeam({
          team_id: testTeam1.id,
          player_id: testPlayer1Id,
        })
      ).rejects.toThrow();
    });

    it('should handle leaving team that player is not in', async () => {
      // Try to leave team without joining first (should not throw)
      await expect(
        gameService.leaveTeam(testTeam1.id, testPlayer1Id)
      ).resolves.not.toThrow();
    });
  });

  describe('Team Management Edge Cases', () => {
    it('should handle team deletion cascade when game is deleted', async () => {
      // Create team
      const team = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Cascade Test Team',
      });

      // Add player to team
      await gameService.joinTeam({
        team_id: team.id,
        player_id: testPlayer1Id,
      });

      // Delete game (should cascade delete team and team_players)
      await supabase
        .from('games')
        .delete()
        .eq('id', testGame.id);

      // Verify team is deleted
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('id', team.id);

      expect(teams).toHaveLength(0);

      // Verify team_players are deleted
      const { data: teamPlayers } = await supabase
        .from('team_players')
        .select('id')
        .eq('team_id', team.id);

      expect(teamPlayers).toHaveLength(0);
    });

    it('should handle non-existent team operations gracefully', async () => {
      const fakeTeamId = '00000000-0000-0000-0000-000000000000';

      // Try to join non-existent team
      await expect(
        gameService.joinTeam({
          team_id: fakeTeamId,
          player_id: testPlayer1Id,
        })
      ).rejects.toThrow('Team not found');

      // Try to leave non-existent team
      await expect(
        gameService.leaveTeam(fakeTeamId, testPlayer1Id)
      ).resolves.not.toThrow();
    });

    it('should return empty array for game with no teams', async () => {
      const gameTeams = await gameService.getGameTeams(testGame.id);
      expect(gameTeams).toEqual([]);
    });

    it('should return null when player is not in any team', async () => {
      const playerTeam = await gameService.getPlayerTeam(testGame.id, testPlayer1Id);
      expect(playerTeam).toBeNull();
    });
  });

  describe('Team Workflow Scenarios', () => {
    it('should support dynamic team roster changes before game starts', async () => {
      const team = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Dynamic Team',
      });

      // Add players
      await gameService.joinTeam({
        team_id: team.id,
        player_id: testPlayer1Id,
      });

      await gameService.joinTeam({
        team_id: team.id,
        player_id: testPlayer2Id,
      });

      // Verify initial roster
      let gameTeams = await gameService.getGameTeams(testGame.id);
      let teamWithPlayers = gameTeams.find(t => t.id === team.id);
      expect(teamWithPlayers?.players).toHaveLength(2);

      // Player 1 leaves
      await gameService.leaveTeam(team.id, testPlayer1Id);

      // Player 3 joins
      await gameService.joinTeam({
        team_id: team.id,
        player_id: testPlayer3Id,
      });

      // Verify updated roster
      gameTeams = await gameService.getGameTeams(testGame.id);
      teamWithPlayers = gameTeams.find(t => t.id === team.id);
      expect(teamWithPlayers?.players).toHaveLength(2);
      expect(teamWithPlayers?.players.map(p => p.id)).toContain(testPlayer2Id);
      expect(teamWithPlayers?.players.map(p => p.id)).toContain(testPlayer3Id);
      expect(teamWithPlayers?.players.map(p => p.id)).not.toContain(testPlayer1Id);
    });

    it('should support minimum viable team configuration (1 player)', async () => {
      const team = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Solo Team',
      });

      // Add single player
      await gameService.joinTeam({
        team_id: team.id,
        player_id: testPlayer1Id,
      });

      const gameTeams = await gameService.getGameTeams(testGame.id);
      const teamWithPlayers = gameTeams.find(t => t.id === team.id);

      expect(teamWithPlayers?.players).toHaveLength(1);
      expect(teamWithPlayers?.players[0].id).toBe(testPlayer1Id);

      // Team should be valid for game start
      expect(teamWithPlayers?.players.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle concurrent team operations', async () => {
      const team = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Concurrent Test Team',
      });

      // Simulate concurrent joins (should all succeed as team has capacity for 4)
      const joinPromises = [
        gameService.joinTeam({
          team_id: team.id,
          player_id: testPlayer1Id,
        }),
        gameService.joinTeam({
          team_id: team.id,
          player_id: testPlayer2Id,
        }),
        gameService.joinTeam({
          team_id: team.id,
          player_id: testPlayer3Id,
        }),
        gameService.joinTeam({
          team_id: team.id,
          player_id: testPlayer4Id,
        }),
      ];

      await Promise.all(joinPromises);

      const gameTeams = await gameService.getGameTeams(testGame.id);
      const teamWithPlayers = gameTeams.find(t => t.id === team.id);
      expect(teamWithPlayers?.players).toHaveLength(4);
    });
  });

  describe('Team Statistics and Metadata', () => {
    it('should track team creation time', async () => {
      const beforeCreate = new Date();

      const team = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Timestamp Test Team',
      });

      const afterCreate = new Date();
      const createdAt = new Date(team.created_at);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should track player join times', async () => {
      const team = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Join Time Test Team',
      });

      const beforeJoin = new Date();

      await gameService.joinTeam({
        team_id: team.id,
        player_id: testPlayer1Id,
      });

      const afterJoin = new Date();

      const gameTeams = await gameService.getGameTeams(testGame.id);
      const teamWithPlayers = gameTeams.find(t => t.id === team.id);
      const player = teamWithPlayers?.players[0];

      expect(player?.joined_at).toBeTruthy();
      const joinedAt = new Date(player!.joined_at);

      expect(joinedAt.getTime()).toBeGreaterThanOrEqual(beforeJoin.getTime());
      expect(joinedAt.getTime()).toBeLessThanOrEqual(afterJoin.getTime());
    });

    it('should maintain team score initialization', async () => {
      const team = await gameService.createTeam({
        game_id: testGame.id,
        name: 'Score Test Team',
      });

      expect(team.current_score).toBe(0);

      // Score should remain 0 until game starts and answers are submitted
      const gameTeams = await gameService.getGameTeams(testGame.id);
      const teamWithPlayers = gameTeams.find(t => t.id === team.id);
      expect(teamWithPlayers?.current_score).toBe(0);
    });
  });
});
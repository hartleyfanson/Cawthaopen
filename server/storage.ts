import {
  users,
  courses,
  holes,
  tournaments,
  tournamentPlayers,
  rounds,
  scores,
  galleryPhotos,
  tournamentHoleTees,
  tournamentRounds,
  achievements,
  playerAchievements,
  playerStats,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type Hole,
  type InsertHole,
  type Tournament,
  type InsertTournament,
  type TournamentPlayer,
  type InsertTournamentPlayer,
  type Round,
  type InsertRound,
  type Score,
  type InsertScore,
  type GalleryPhoto,
  type InsertGalleryPhoto,
  type TournamentHoleTee,
  type InsertTournamentHoleTee,
  type TournamentRound,
  type InsertTournamentRound,
  type Achievement,
  type InsertAchievement,
  type PlayerAchievement,
  type InsertPlayerAchievement,
  type PlayerStats,
  type InsertPlayerStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getCourseHoles(courseId: string): Promise<Hole[]>;
  createHole(hole: InsertHole): Promise<Hole>;
  
  // Tournament operations
  getTournaments(): Promise<Tournament[]>;
  getTournament(id: string): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  getTournamentsByStatus(status: string): Promise<Tournament[]>;
  joinTournament(data: InsertTournamentPlayer): Promise<TournamentPlayer>;
  getTournamentPlayers(tournamentId: string): Promise<TournamentPlayer[]>;
  
  // Scoring operations
  createRound(round: InsertRound): Promise<Round>;
  getRound(tournamentId: string, playerId: string, roundNumber: number): Promise<Round | undefined>;
  createScore(score: InsertScore): Promise<Score>;
  updateScore(scoreId: string, updates: Partial<Score>): Promise<Score>;
  getRoundScores(roundId: string): Promise<Score[]>;
  getTournamentLeaderboard(tournamentId: string): Promise<any[]>;
  getTournamentRoundLeaderboard(tournamentId: string, roundNumber: number): Promise<any[]>;
  getTournamentPlayerScores(tournamentId: string): Promise<any[]>;
  
  // Gallery operations
  createGalleryPhoto(photo: InsertGalleryPhoto): Promise<GalleryPhoto>;
  getTournamentGallery(tournamentId: string): Promise<GalleryPhoto[]>;
  
  // Tournament hole tee operations
  createTournamentHoleTee(holeTee: InsertTournamentHoleTee): Promise<TournamentHoleTee>;
  
  // Tournament round operations
  createTournamentRound(round: InsertTournamentRound): Promise<TournamentRound>;
  getTournamentRounds(tournamentId: string): Promise<TournamentRound[]>;
  
  // Stats operations
  getUserStats(userId: string): Promise<any>;
  getUserDetailedStats(userId: string): Promise<any>;
  
  // Profile operations
  updateUserProfile(id: string, profile: { firstName?: string; lastName?: string; email?: string; profileImageUrl?: string }): Promise<User>;
  
  // Admin operations
  updateTournamentAdmin(id: string, updates: { championsMeal?: string; headerImageUrl?: string }): Promise<Tournament>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getPlayerAchievements(playerId: string): Promise<(PlayerAchievement & { achievement: Achievement })[]>;
  awardAchievement(data: InsertPlayerAchievement): Promise<PlayerAchievement>;
  getPlayerStats(playerId: string): Promise<PlayerStats | undefined>;
  upsertPlayerStats(playerId: string, updates: Partial<PlayerStats>): Promise<PlayerStats>;
  checkAndAwardAchievements(playerId: string, context: { scoreData?: any; tournamentData?: any; roundData?: any }): Promise<PlayerAchievement[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, profile: { firstName?: string; lastName?: string; email?: string; profileImageUrl?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(asc(courses.name));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async getCourseHoles(courseId: string): Promise<Hole[]> {
    return await db
      .select()
      .from(holes)
      .where(eq(holes.courseId, courseId))
      .orderBy(asc(holes.holeNumber));
  }

  async createHole(hole: InsertHole): Promise<Hole> {
    const [newHole] = await db.insert(holes).values(hole).returning();
    return newHole;
  }

  // Tournament operations
  async getTournaments(): Promise<Tournament[]> {
    return await db
      .select()
      .from(tournaments)
      .orderBy(desc(tournaments.createdAt));
  }

  async getTournament(id: string): Promise<Tournament | undefined> {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, id));
    return tournament;
  }

  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const [newTournament] = await db
      .insert(tournaments)
      .values(tournament)
      .returning();
    return newTournament;
  }

  async getTournamentsByStatus(status: string): Promise<Tournament[]> {
    return await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.status, status))
      .orderBy(desc(tournaments.startDate));
  }

  async joinTournament(data: InsertTournamentPlayer): Promise<TournamentPlayer> {
    const [player] = await db
      .insert(tournamentPlayers)
      .values(data)
      .returning();
    return player;
  }

  async getTournamentPlayers(tournamentId: string): Promise<TournamentPlayer[]> {
    return await db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.tournamentId, tournamentId));
  }

  // Scoring operations
  async createRound(round: InsertRound): Promise<Round> {
    const [newRound] = await db.insert(rounds).values(round).returning();
    return newRound;
  }

  async getRound(
    tournamentId: string,
    playerId: string,
    roundNumber: number
  ): Promise<Round | undefined> {
    const [round] = await db
      .select()
      .from(rounds)
      .where(
        and(
          eq(rounds.tournamentId, tournamentId),
          eq(rounds.playerId, playerId),
          eq(rounds.roundNumber, roundNumber)
        )
      );
    return round;
  }

  async createScore(score: InsertScore): Promise<Score> {
    const [newScore] = await db.insert(scores).values(score).returning();
    return newScore;
  }

  async updateScore(scoreId: string, updates: Partial<Score>): Promise<Score> {
    const [updatedScore] = await db
      .update(scores)
      .set(updates)
      .where(eq(scores.id, scoreId))
      .returning();
    return updatedScore;
  }

  async getRoundScores(roundId: string): Promise<any[]> {
    return await db
      .select()
      .from(scores)
      .where(eq(scores.roundId, roundId))
      .innerJoin(holes, eq(scores.holeId, holes.id))
      .orderBy(asc(holes.holeNumber));
  }

  async getTournamentLeaderboard(tournamentId: string): Promise<any[]> {
    const result = await db
      .select({
        playerId: rounds.playerId,
        playerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('playerName'),
        profileImageUrl: users.profileImageUrl,
        totalStrokes: sql<number>`SUM(${rounds.totalStrokes})`.as('totalStrokes'),
        totalPutts: sql<number>`SUM(${rounds.totalPutts})`.as('totalPutts'),
        fairwaysHit: sql<number>`SUM(${rounds.fairwaysHit})`.as('fairwaysHit'),
        greensInRegulation: sql<number>`SUM(${rounds.greensInRegulation})`.as('greensInRegulation'),
        roundsPlayed: sql<number>`COUNT(*)`.as('roundsPlayed'),
      })
      .from(rounds)
      .innerJoin(users, eq(rounds.playerId, users.id))
      .where(eq(rounds.tournamentId, tournamentId))
      .groupBy(rounds.playerId, users.firstName, users.lastName, users.profileImageUrl)
      .orderBy(asc(sql`SUM(${rounds.totalStrokes})`));

    return result;
  }

  async getTournamentRoundLeaderboard(tournamentId: string, roundNumber: number): Promise<any[]> {
    const result = await db
      .select({
        playerId: rounds.playerId,
        playerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('playerName'),
        profileImageUrl: users.profileImageUrl,
        totalStrokes: rounds.totalStrokes,
        totalPutts: rounds.totalPutts,
        fairwaysHit: rounds.fairwaysHit,
        greensInRegulation: rounds.greensInRegulation,
        roundNumber: rounds.roundNumber,
      })
      .from(rounds)
      .innerJoin(users, eq(rounds.playerId, users.id))
      .where(and(
        eq(rounds.tournamentId, tournamentId),
        eq(rounds.roundNumber, roundNumber)
      ))
      .orderBy(asc(rounds.totalStrokes));

    return result;
  }

  async getTournamentPlayerScores(tournamentId: string): Promise<any[]> {
    const result = await db
      .select({
        playerId: rounds.playerId,
        playerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('playerName'),
        profileImageUrl: users.profileImageUrl,
        roundId: rounds.id,
        roundNumber: rounds.roundNumber,
        holeId: scores.holeId,
        holeNumber: holes.holeNumber,
        holePar: holes.par,
        strokes: scores.strokes,
        putts: scores.putts,
        fairwayHit: scores.fairwayHit,
        greenInRegulation: scores.greenInRegulation,
      })
      .from(rounds)
      .innerJoin(users, eq(rounds.playerId, users.id))
      .innerJoin(scores, eq(scores.roundId, rounds.id))
      .innerJoin(holes, eq(scores.holeId, holes.id))
      .where(eq(rounds.tournamentId, tournamentId))
      .orderBy(asc(rounds.playerId), asc(holes.holeNumber));

    return result;
  }

  // Gallery operations
  async createGalleryPhoto(photo: InsertGalleryPhoto): Promise<GalleryPhoto> {
    const [newPhoto] = await db.insert(galleryPhotos).values(photo).returning();
    return newPhoto;
  }

  async getTournamentGallery(tournamentId: string): Promise<GalleryPhoto[]> {
    return await db
      .select()
      .from(galleryPhotos)
      .where(eq(galleryPhotos.tournamentId, tournamentId))
      .orderBy(desc(galleryPhotos.createdAt));
  }

  // Tournament hole tee operations
  async createTournamentHoleTee(holeTee: InsertTournamentHoleTee): Promise<TournamentHoleTee> {
    const [newHoleTee] = await db.insert(tournamentHoleTees).values(holeTee).returning();
    return newHoleTee;
  }

  async createTournamentRound(round: InsertTournamentRound): Promise<TournamentRound> {
    const [newRound] = await db.insert(tournamentRounds).values(round).returning();
    return newRound;
  }

  async getTournamentRounds(tournamentId: string): Promise<TournamentRound[]> {
    return await db
      .select()
      .from(tournamentRounds)
      .where(eq(tournamentRounds.tournamentId, tournamentId))
      .orderBy(asc(tournamentRounds.roundNumber));
  }

  // Stats operations
  async getUserStats(userId: string): Promise<any> {
    const stats = await db
      .select({
        totalRounds: sql<number>`COUNT(*)`.as('totalRounds'),
        averageScore: sql<number>`AVG(${rounds.totalStrokes})`.as('averageScore'),
        totalFairwaysHit: sql<number>`SUM(${rounds.fairwaysHit})`.as('totalFairwaysHit'),
        totalFairwayAttempts: sql<number>`COUNT(*) * 14`.as('totalFairwayAttempts'),
        totalGIR: sql<number>`SUM(${rounds.greensInRegulation})`.as('totalGIR'),
        totalGIRAttempts: sql<number>`COUNT(*) * 18`.as('totalGIRAttempts'),
        averagePutts: sql<number>`AVG(${rounds.totalPutts})`.as('averagePutts'),
      })
      .from(rounds)
      .where(eq(rounds.playerId, userId))
      .groupBy(rounds.playerId);

    const wins = await db
      .select({
        wins: sql<number>`COUNT(*)`.as('wins'),
      })
      .from(tournaments)
      .where(eq(tournaments.winnerId, userId));

    // Calculate handicap from available rounds (remove 20-round requirement)
    let calculatedHandicap = null;
    if (stats[0]?.totalRounds && stats[0].totalRounds > 0) {
      const averageScore = stats[0].averageScore || 72;
      const courseRating = 72.0; // Standard course rating
      const slopeRating = 113; // Standard slope rating
      
      // Simple handicap calculation: (Average Score - Course Rating) * 113 / Slope Rating
      calculatedHandicap = Math.round(((averageScore - courseRating) * 113 / slopeRating) * 10) / 10;
      
      // Cap handicap at reasonable limits
      calculatedHandicap = Math.max(-5, Math.min(36, calculatedHandicap));
    }

    return {
      ...(stats[0] || {}),
      wins: wins[0]?.wins || 0,
      handicap: calculatedHandicap,
    };
  }

  // Get detailed user statistics
  async getUserDetailedStats(userId: string): Promise<any> {
    const userRounds = await db
      .select()
      .from(rounds)
      .innerJoin(tournaments, eq(rounds.tournamentId, tournaments.id))
      .innerJoin(courses, eq(tournaments.courseId, courses.id))
      .where(eq(rounds.playerId, userId));

    const userScores = await db
      .select()
      .from(scores)
      .innerJoin(rounds, eq(scores.roundId, rounds.id))
      .innerJoin(holes, eq(scores.holeId, holes.id))
      .where(eq(rounds.playerId, userId));

    if (userRounds.length === 0) {
      return {
        totalRounds: 0,
        averageScore: null,
        bestRound: null,
        bestHole: null,
        longestFairwayStreak: 0,
        fewestPutts: null,
        totalBirdies: 0,
        greensInRegulation: null,
        fairwaysHit: null,
        puttsPerRound: null,
        birdiePercentage: null
      };
    }

    // Basic round stats
    const totalScore = userRounds.reduce((sum, round) => sum + (round.rounds.totalStrokes || 0), 0);
    const averageScore = totalScore / userRounds.length;
    const bestRoundData = userRounds.reduce((best, current) => 
      (current.rounds.totalStrokes || 999) < (best.rounds.totalStrokes || 999) ? current : best
    );

    // Best hole score (lowest score relative to par)
    let bestHoleScore = null;
    if (userScores.length > 0) {
      bestHoleScore = userScores.reduce((best, current) => {
        const relativeToPar = (current.scores.strokes || 0) - (current.holes.par || 0);
        const bestRelative = best ? ((best.scores.strokes || 0) - (best.holes.par || 0)) : 999;
        return relativeToPar < bestRelative ? current : best;
      });
    }

    // Count birdies (scores 1 under par)
    const birdies = userScores.filter(score => 
      (score.scores.strokes || 0) === (score.holes.par || 0) - 1
    ).length;

    // Calculate fairway streak (excluding par 3s)
    let currentStreak = 0;
    let longestStreak = 0;
    userScores.forEach(score => {
      // Skip par 3 holes for fairway streak calculation
      if (score.holes.par === 3) {
        return;
      }
      
      if (score.scores.fairwayHit) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Fewest putts in a round
    const roundPutts = userRounds.map(round => {
      const roundScores = userScores.filter(score => score.scores.roundId === round.rounds.id);
      return roundScores.reduce((total, score) => total + (score.scores.putts || 0), 0);
    });
    const fewestPutts = roundPutts.length > 0 ? Math.min(...roundPutts) : null;

    // Performance percentages
    const totalHoles = userScores.length;
    const girCount = userScores.filter(score => score.scores.greenInRegulation).length;
    const fairwaysCount = userScores.filter(score => score.scores.fairwayHit).length;
    const totalPutts = userScores.reduce((total, score) => total + (score.scores.putts || 0), 0);

    return {
      totalRounds: userRounds.length,
      averageScore: averageScore.toFixed(1),
      bestRound: {
        score: bestRoundData.rounds.totalStrokes,
        courseName: bestRoundData.courses.name,
        date: bestRoundData.rounds.createdAt
      },
      bestHole: bestHoleScore ? {
        score: bestHoleScore.scores.strokes,
        holeNumber: bestHoleScore.holes.holeNumber,
        par: bestHoleScore.holes.par,
        relativeToPar: (bestHoleScore.scores.strokes || 0) - (bestHoleScore.holes.par || 0)
      } : null,
      longestFairwayStreak: longestStreak,
      fewestPutts: fewestPutts,
      fewestPuttsDate: userRounds[0]?.rounds.createdAt, // Simplified for now
      totalBirdies: birdies,
      greensInRegulation: totalHoles > 0 ? ((girCount / totalHoles) * 100).toFixed(1) : null,
      fairwaysHit: totalHoles > 0 ? ((fairwaysCount / totalHoles) * 100).toFixed(1) : null,
      puttsPerRound: userRounds.length > 0 ? (totalPutts / userRounds.length).toFixed(1) : null,
      birdiePercentage: totalHoles > 0 ? ((birdies / totalHoles) * 100).toFixed(1) : null
    };
  }

  // Admin operations
  async updateTournamentAdmin(id: string, updates: { championsMeal?: string; headerImageUrl?: string }): Promise<Tournament> {
    const [tournament] = await db
      .update(tournaments)
      .set(updates)
      .where(eq(tournaments.id, id))
      .returning();
    return tournament;
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true))
      .orderBy(asc(achievements.category), asc(achievements.name));
  }

  async getPlayerAchievements(playerId: string): Promise<(PlayerAchievement & { achievement: Achievement })[]> {
    const results = await db
      .select()
      .from(playerAchievements)
      .innerJoin(achievements, eq(playerAchievements.achievementId, achievements.id))
      .where(eq(playerAchievements.playerId, playerId))
      .orderBy(desc(playerAchievements.unlockedAt));
    
    return results.map(result => ({
      ...result.player_achievements,
      achievement: result.achievements
    }));
  }

  async awardAchievement(data: InsertPlayerAchievement): Promise<PlayerAchievement> {
    // Check if player already has this achievement
    const existing = await db
      .select()
      .from(playerAchievements)
      .where(
        and(
          eq(playerAchievements.playerId, data.playerId),
          eq(playerAchievements.achievementId, data.achievementId)
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    const [newAchievement] = await db
      .insert(playerAchievements)
      .values(data)
      .returning();

    // Update player stats
    const achievement = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, data.achievementId));

    if (achievement.length > 0) {
      await this.upsertPlayerStats(data.playerId, {
        totalAchievements: sql`total_achievements + 1`,
        achievementPoints: sql`achievement_points + ${achievement[0].points}`,
      } as any);
    }

    return newAchievement;
  }

  async getPlayerStats(playerId: string): Promise<PlayerStats | undefined> {
    const [stats] = await db
      .select()
      .from(playerStats)
      .where(eq(playerStats.playerId, playerId));
    return stats;
  }

  async upsertPlayerStats(playerId: string, updates: Partial<PlayerStats>): Promise<PlayerStats> {
    const [stats] = await db
      .insert(playerStats)
      .values({
        playerId,
        ...updates,
      } as any)
      .onConflictDoUpdate({
        target: playerStats.playerId,
        set: {
          ...updates,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return stats;
  }

  async checkAndAwardAchievements(playerId: string, context: { scoreData?: any; tournamentData?: any; roundData?: any }): Promise<PlayerAchievement[]> {
    const awardedAchievements: PlayerAchievement[] = [];
    const allAchievements = await this.getAchievements();
    const playerAchievements = await this.getPlayerAchievements(playerId);
    const unlockedAchievementIds = new Set(playerAchievements.map(pa => pa.achievementId));

    for (const achievement of allAchievements) {
      if (unlockedAchievementIds.has(achievement.id)) {
        continue; // Already unlocked
      }

      let shouldAward = false;

      switch (achievement.condition) {
        case 'first_tournament':
          if (context.tournamentData && context.tournamentData.isFirstTournament) {
            shouldAward = true;
          }
          break;
        
        case 'hole_in_one':
          if (context.scoreData && context.scoreData.strokes === 1 && context.scoreData.holePar > 1) {
            shouldAward = true;
          }
          break;
        
        case 'eagle':
          if (context.scoreData && context.scoreData.strokes <= (context.scoreData.holePar - 2)) {
            shouldAward = true;
          }
          break;
        
        case 'birdie':
          if (context.scoreData && context.scoreData.strokes === (context.scoreData.holePar - 1)) {
            shouldAward = true;
          }
          break;
        
        case 'under_par_round':
          if (context.roundData && context.roundData.totalStrokes < context.roundData.coursePar) {
            shouldAward = true;
          }
          break;
        
        case 'tournament_win':
          if (context.tournamentData && context.tournamentData.isWinner) {
            shouldAward = true;
          }
          break;
        
        case 'score_under_threshold':
          if (context.roundData && achievement.value && context.roundData.totalStrokes < achievement.value) {
            shouldAward = true;
          }
          break;
      }

      if (shouldAward) {
        const awarded = await this.awardAchievement({
          playerId,
          achievementId: achievement.id,
          tournamentId: context.tournamentData?.tournamentId,
          roundId: context.roundData?.roundId,
          metadata: context,
        });
        awardedAchievements.push(awarded);
      }
    }

    return awardedAchievements;
  }
}

export const storage = new DatabaseStorage();

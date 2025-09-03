import {
  users,
  courses,
  holes,
  tournaments,
  tournamentPlayers,
  rounds,
  scores,
  galleryPhotos,
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
  
  // Gallery operations
  createGalleryPhoto(photo: InsertGalleryPhoto): Promise<GalleryPhoto>;
  getTournamentGallery(tournamentId: string): Promise<GalleryPhoto[]>;
  
  // Stats operations
  getUserStats(userId: string): Promise<any>;
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

    return {
      ...(stats[0] || {}),
      wins: wins[0]?.wins || 0,
    };
  }
}

export const storage = new DatabaseStorage();

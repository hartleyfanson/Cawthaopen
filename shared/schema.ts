import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  handicap: decimal("handicap", { precision: 4, scale: 1 }),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Golf courses
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  location: varchar("location"),
  description: text("description"),
  totalHoles: integer("total_holes").default(18),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course holes
export const holes = pgTable("holes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  holeNumber: integer("hole_number").notNull(),
  par: integer("par").notNull(),
  yardageWhite: integer("yardage_white"),
  yardageBlue: integer("yardage_blue"),
  yardageRed: integer("yardage_red"),
  yardageGold: integer("yardage_gold"),
  handicap: integer("handicap"),
});

// Tournaments
export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status").default("upcoming"), // upcoming, active, completed
  maxPlayers: integer("max_players"),
  numberOfRounds: integer("number_of_rounds").default(1), // number of rounds to be played
  scoringFormat: varchar("scoring_format").default("stroke_play"), // stroke_play, stableford, handicap, callaway
  handicapAllowance: decimal("handicap_allowance", { precision: 3, scale: 2 }).default("1.00"), // percentage of handicap to apply (0.80 = 80%)
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  winnerId: varchar("winner_id").references(() => users.id),
  championsMeal: text("champions_meal"),
  headerImageUrl: varchar("header_image_url"),
});

// Tournament players
export const tournamentPlayers = pgTable("tournament_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  playerId: varchar("player_id").references(() => users.id).notNull(),
  teeSelection: varchar("tee_selection").default("white"), // white, blue, red, gold
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Tournament rounds
export const rounds = pgTable("rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  playerId: varchar("player_id").references(() => users.id).notNull(),
  roundNumber: integer("round_number").notNull(),
  totalStrokes: integer("total_strokes"),
  totalPutts: integer("total_putts"),
  fairwaysHit: integer("fairways_hit"),
  greensInRegulation: integer("greens_in_regulation"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual hole scores
export const scores = pgTable("scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").references(() => rounds.id).notNull(),
  holeId: varchar("hole_id").references(() => holes.id).notNull(),
  strokes: integer("strokes").notNull(),
  putts: integer("putts"),
  fairwayHit: boolean("fairway_hit"),
  greenInRegulation: boolean("green_in_regulation"),
  powerupUsed: boolean("powerup_used").default(false),
  powerupNotes: text("powerup_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament gallery photos
export const galleryPhotos = pgTable("gallery_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  imageUrl: varchar("image_url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament hole tee settings
export const tournamentHoleTees = pgTable("tournament_hole_tees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  holeId: varchar("hole_id").references(() => holes.id).notNull(),
  teeColor: varchar("tee_color").notNull(), // white, blue, red, gold
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament round definitions with dates
export const tournamentRounds = pgTable("tournament_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  roundNumber: integer("round_number").notNull(),
  roundDate: timestamp("round_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tournaments: many(tournaments),
  tournamentPlayers: many(tournamentPlayers),
  rounds: many(rounds),
  galleryPhotos: many(galleryPhotos),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  holes: many(holes),
  tournaments: many(tournaments),
}));

export const holesRelations = relations(holes, ({ one, many }) => ({
  course: one(courses, {
    fields: [holes.courseId],
    references: [courses.id],
  }),
  scores: many(scores),
  tournamentTees: many(tournamentHoleTees),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  course: one(courses, {
    fields: [tournaments.courseId],
    references: [courses.id],
  }),
  creator: one(users, {
    fields: [tournaments.createdBy],
    references: [users.id],
  }),
  winner: one(users, {
    fields: [tournaments.winnerId],
    references: [users.id],
  }),
  players: many(tournamentPlayers),
  rounds: many(rounds),
  galleryPhotos: many(galleryPhotos),
  holeTees: many(tournamentHoleTees),
  tournamentRounds: many(tournamentRounds),
}));

export const tournamentPlayersRelations = relations(tournamentPlayers, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentPlayers.tournamentId],
    references: [tournaments.id],
  }),
  player: one(users, {
    fields: [tournamentPlayers.playerId],
    references: [users.id],
  }),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [rounds.tournamentId],
    references: [tournaments.id],
  }),
  player: one(users, {
    fields: [rounds.playerId],
    references: [users.id],
  }),
  scores: many(scores),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  round: one(rounds, {
    fields: [scores.roundId],
    references: [rounds.id],
  }),
  hole: one(holes, {
    fields: [scores.holeId],
    references: [holes.id],
  }),
}));

export const galleryPhotosRelations = relations(galleryPhotos, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [galleryPhotos.tournamentId],
    references: [tournaments.id],
  }),
  uploader: one(users, {
    fields: [galleryPhotos.uploadedBy],
    references: [users.id],
  }),
}));

export const tournamentHoleTeesRelations = relations(tournamentHoleTees, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentHoleTees.tournamentId],
    references: [tournaments.id],
  }),
  hole: one(holes, {
    fields: [tournamentHoleTees.holeId],
    references: [holes.id],
  }),
}));

export const tournamentRoundsRelations = relations(tournamentRounds, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentRounds.tournamentId],
    references: [tournaments.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertHoleSchema = createInsertSchema(holes).omit({
  id: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentPlayerSchema = createInsertSchema(tournamentPlayers).omit({
  id: true,
  joinedAt: true,
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  createdAt: true,
});

export const insertScoreSchema = createInsertSchema(scores).omit({
  id: true,
  createdAt: true,
});

export const insertGalleryPhotoSchema = createInsertSchema(galleryPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentHoleTeeSchema = createInsertSchema(tournamentHoleTees).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentRoundSchema = createInsertSchema(tournamentRounds).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Hole = typeof holes.$inferSelect;
export type InsertHole = z.infer<typeof insertHoleSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type InsertTournamentPlayer = z.infer<typeof insertTournamentPlayerSchema>;
export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type InsertGalleryPhoto = z.infer<typeof insertGalleryPhotoSchema>;
export type TournamentHoleTee = typeof tournamentHoleTees.$inferSelect;
export type InsertTournamentHoleTee = z.infer<typeof insertTournamentHoleTeeSchema>;
export type TournamentRound = typeof tournamentRounds.$inferSelect;
export type InsertTournamentRound = z.infer<typeof insertTournamentRoundSchema>;

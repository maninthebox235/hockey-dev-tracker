import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Players in the hockey organization
 */
export const players = mysqlTable("players", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  jerseyNumber: int("jerseyNumber"),
  position: varchar("position", { length: 50 }), // e.g., Forward, Defense, Goalie
  dateOfBirth: timestamp("dateOfBirth"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Seasons for tracking development over time
 */
export const seasons = mysqlTable("seasons", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "2024-2025 Season"
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = typeof seasons.$inferInsert;

/**
 * Player development metrics tracked per season
 */
export const playerSeasonMetrics = mysqlTable("player_season_metrics", {
  id: varchar("id", { length: 64 }).primaryKey(),
  playerId: varchar("playerId", { length: 64 }).notNull(),
  seasonId: varchar("seasonId", { length: 64 }).notNull(),
  
  // Performance metrics
  gamesPlayed: int("gamesPlayed").default(0),
  goals: int("goals").default(0),
  assists: int("assists").default(0),
  
  // Skill ratings (1-10 scale)
  skatingRating: int("skatingRating"),
  stickhandlingRating: int("stickhandlingRating"),
  shootingRating: int("shootingRating"),
  passingRating: int("passingRating"),
  defenseRating: int("defenseRating"),
  hockeyIQRating: int("hockeyIQRating"),
  
  // General notes
  strengths: text("strengths"),
  areasForImprovement: text("areasForImprovement"),
  overallNotes: text("overallNotes"),
  
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type PlayerSeasonMetric = typeof playerSeasonMetrics.$inferSelect;
export type InsertPlayerSeasonMetric = typeof playerSeasonMetrics.$inferInsert;

/**
 * Video footage uploaded for analysis
 */
export const videos = mysqlTable("videos", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(), // S3 URL
  thumbnailUrl: text("thumbnailUrl"),
  
  // Metadata
  videoType: mysqlEnum("videoType", ["practice", "game", "drill"]).notNull(),
  recordedAt: timestamp("recordedAt"),
  seasonId: varchar("seasonId", { length: 64 }),
  uploadedBy: varchar("uploadedBy", { length: 64 }).notNull(), // user ID
  
  // Processing status
  processingStatus: mysqlEnum("processingStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * AI-generated feedback for videos (team-wide or player-specific)
 */
export const videoFeedback = mysqlTable("video_feedback", {
  id: varchar("id", { length: 64 }).primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  playerId: varchar("playerId", { length: 64 }), // null for team-wide feedback
  
  // Feedback content
  whatWentWell: text("whatWentWell"),
  areasForImprovement: text("areasForImprovement"),
  recommendedDrills: text("recommendedDrills"),
  
  // Metadata
  feedbackType: mysqlEnum("feedbackType", ["individual", "team"]).notNull(),
  generatedBy: varchar("generatedBy", { length: 64 }).notNull(), // user ID who requested the feedback
  
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type VideoFeedback = typeof videoFeedback.$inferSelect;
export type InsertVideoFeedback = typeof videoFeedback.$inferInsert;

/**
 * Video analysis results from computer vision processing
 */
export const videoAnalysisResults = mysqlTable("videoAnalysisResults", {
  id: varchar("id", { length: 64 }).primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed"]).notNull().default("queued"),
  progress: int("progress").notNull().default(0), // 0-100
  currentFrame: int("currentFrame"),
  totalFrames: int("totalFrames"),
  message: text("message"),
  analysisData: text("analysisData"), // JSON string of full analysis results
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type VideoAnalysisResult = typeof videoAnalysisResults.$inferSelect;
export type InsertVideoAnalysisResult = typeof videoAnalysisResults.$inferInsert;

/**
 * Player associations with videos (for tracking which players are in which videos)
 */
export const videoPlayers = mysqlTable("video_players", {
  id: varchar("id", { length: 64 }).primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  playerId: varchar("playerId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type VideoPlayer = typeof videoPlayers.$inferSelect;
export type InsertVideoPlayer = typeof videoPlayers.$inferInsert;


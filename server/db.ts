import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  players, 
  InsertPlayer,
  seasons,
  InsertSeason,
  playerSeasonMetrics,
  InsertPlayerSeasonMetric,
  videos,
  InsertVideo,
  videoFeedback,
  InsertVideoFeedback,
  videoPlayers,
  InsertVideoPlayer,
  videoAnalysisResults,
  InsertVideoAnalysisResult
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== PLAYER QUERIES ====================

export async function createPlayer(player: InsertPlayer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(players).values(player);
  return player;
}

export async function getAllPlayers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(players).orderBy(players.name);
}

export async function getActivePlayers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(players).where(eq(players.isActive, true)).orderBy(players.name);
}

export async function getPlayerById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePlayer(id: string, data: Partial<InsertPlayer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(players).set({ ...data, updatedAt: new Date() }).where(eq(players.id, id));
}

export async function deletePlayer(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(players).where(eq(players.id, id));
}

// ==================== SEASON QUERIES ====================

export async function createSeason(season: InsertSeason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(seasons).values(season);
  return season;
}

export async function getAllSeasons() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(seasons).orderBy(desc(seasons.startDate));
}

export async function getActiveSeason() {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSeasonById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(seasons).where(eq(seasons.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSeason(id: string, data: Partial<InsertSeason>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(seasons).set({ ...data, updatedAt: new Date() }).where(eq(seasons.id, id));
}

export async function setActiveSeason(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deactivate all seasons first
  await db.update(seasons).set({ isActive: false });
  // Activate the selected season
  await db.update(seasons).set({ isActive: true }).where(eq(seasons.id, id));
}

// ==================== PLAYER SEASON METRICS QUERIES ====================

export async function createPlayerSeasonMetric(metric: InsertPlayerSeasonMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(playerSeasonMetrics).values(metric);
  return metric;
}

export async function getPlayerSeasonMetrics(playerId: string, seasonId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(playerSeasonMetrics)
    .where(and(eq(playerSeasonMetrics.playerId, playerId), eq(playerSeasonMetrics.seasonId, seasonId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllMetricsForPlayer(playerId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(playerSeasonMetrics)
    .where(eq(playerSeasonMetrics.playerId, playerId))
    .orderBy(desc(playerSeasonMetrics.createdAt));
}

export async function getAllMetricsForSeason(seasonId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(playerSeasonMetrics)
    .where(eq(playerSeasonMetrics.seasonId, seasonId));
}

export async function updatePlayerSeasonMetric(id: string, data: Partial<InsertPlayerSeasonMetric>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(playerSeasonMetrics).set({ ...data, updatedAt: new Date() }).where(eq(playerSeasonMetrics.id, id));
}

// ==================== VIDEO QUERIES ====================

export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(videos).values(video);
  return video;
}

export async function getAllVideos() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(videos).orderBy(desc(videos.createdAt));
}

export async function getVideosBySeasonId(seasonId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(videos)
    .where(eq(videos.seasonId, seasonId))
    .orderBy(desc(videos.recordedAt));
}

export async function getVideoById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVideo(id: string, data: Partial<InsertVideo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(videos).set({ ...data, updatedAt: new Date() }).where(eq(videos.id, id));
}

export async function deleteVideo(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(videos).where(eq(videos.id, id));
}

// ==================== VIDEO FEEDBACK QUERIES ====================

export async function createVideoFeedback(feedback: InsertVideoFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(videoFeedback).values(feedback);
  return feedback;
}

export async function getFeedbackByVideoId(videoId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(videoFeedback)
    .where(eq(videoFeedback.videoId, videoId))
    .orderBy(desc(videoFeedback.createdAt));
}

export async function getFeedbackByPlayerId(playerId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(videoFeedback)
    .where(eq(videoFeedback.playerId, playerId))
    .orderBy(desc(videoFeedback.createdAt));
}

export async function getFeedbackById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(videoFeedback).where(eq(videoFeedback.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVideoFeedback(id: string, data: Partial<InsertVideoFeedback>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(videoFeedback).set({ ...data, updatedAt: new Date() }).where(eq(videoFeedback.id, id));
}

export async function deleteVideoFeedback(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(videoFeedback).where(eq(videoFeedback.id, id));
}

// ==================== VIDEO PLAYERS QUERIES ====================

export async function addPlayerToVideo(videoId: string, playerId: string, id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(videoPlayers).values({ id, videoId, playerId });
}

export async function getPlayersForVideo(videoId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(videoPlayers).where(eq(videoPlayers.videoId, videoId));
}

export async function getVideosForPlayer(playerId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(videoPlayers).where(eq(videoPlayers.playerId, playerId));
}

export async function removePlayerFromVideo(videoId: string, playerId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(videoPlayers)
    .where(and(eq(videoPlayers.videoId, videoId), eq(videoPlayers.playerId, playerId)));
}


// ==================== VIDEO ANALYSIS RESULTS ====================

export async function createVideoAnalysisResult(data: InsertVideoAnalysisResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(videoAnalysisResults).values(data);
}

export async function getVideoAnalysisResult(videoId: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(videoAnalysisResults).where(eq(videoAnalysisResults.videoId, videoId)).limit(1);
  return results[0] || null;
}

export async function updateVideoAnalysisProgress(
  videoId: string,
  progress: number,
  currentFrame?: number,
  totalFrames?: number,
  message?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(videoAnalysisResults)
    .set({
      progress,
      currentFrame,
      totalFrames,
      message,
      status: progress === 100 ? "completed" : "processing",
      completedAt: progress === 100 ? new Date() : undefined,
    })
    .where(eq(videoAnalysisResults.videoId, videoId));
}

export async function updateVideoAnalysisData(videoId: string, analysisData: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(videoAnalysisResults)
    .set({ analysisData, status: "completed", progress: 100, completedAt: new Date() })
    .where(eq(videoAnalysisResults.videoId, videoId));
}

export async function setVideoAnalysisFailed(videoId: string, message: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(videoAnalysisResults)
    .set({ status: "failed", message, completedAt: new Date() })
    .where(eq(videoAnalysisResults.videoId, videoId));
}


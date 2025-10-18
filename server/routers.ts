import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as db from "./db";
import { storagePut } from "./storage";
import { generateTeamFeedback, generateBulkIndividualFeedback } from "./aiService";

// ==================== PLAYER ROUTER ====================

const playerRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllPlayers();
  }),

  listActive: protectedProcedure.query(async () => {
    return await db.getActivePlayers();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.getPlayerById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      jerseyNumber: z.number().optional(),
      position: z.string().optional(),
      dateOfBirth: z.date().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const player = {
        id: randomUUID(),
        ...input,
        isActive: true,
      };
      return await db.createPlayer(player);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      jerseyNumber: z.number().optional(),
      position: z.string().optional(),
      dateOfBirth: z.date().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePlayer(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deletePlayer(input.id);
      return { success: true };
    }),
});

// ==================== SEASON ROUTER ====================

const seasonRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllSeasons();
  }),

  getActive: protectedProcedure.query(async () => {
    return await db.getActiveSeason();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.getSeasonById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const season = {
        id: randomUUID(),
        ...input,
        isActive: false,
      };
      return await db.createSeason(season);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateSeason(id, data);
      return { success: true };
    }),

  setActive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.setActiveSeason(input.id);
      return { success: true };
    }),
});

// ==================== METRICS ROUTER ====================

const metricsRouter = router({
  getForPlayer: protectedProcedure
    .input(z.object({ playerId: z.string(), seasonId: z.string() }))
    .query(async ({ input }) => {
      return await db.getPlayerSeasonMetrics(input.playerId, input.seasonId);
    }),

  getAllForPlayer: protectedProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ input }) => {
      return await db.getAllMetricsForPlayer(input.playerId);
    }),

  getAllForSeason: protectedProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ input }) => {
      return await db.getAllMetricsForSeason(input.seasonId);
    }),

  create: protectedProcedure
    .input(z.object({
      playerId: z.string(),
      seasonId: z.string(),
      gamesPlayed: z.number().optional(),
      goals: z.number().optional(),
      assists: z.number().optional(),
      skatingRating: z.number().optional(),
      stickhandlingRating: z.number().optional(),
      shootingRating: z.number().optional(),
      passingRating: z.number().optional(),
      defenseRating: z.number().optional(),
      hockeyIQRating: z.number().optional(),
      strengths: z.string().optional(),
      areasForImprovement: z.string().optional(),
      overallNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const metric = {
        id: randomUUID(),
        ...input,
      };
      return await db.createPlayerSeasonMetric(metric);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      gamesPlayed: z.number().optional(),
      goals: z.number().optional(),
      assists: z.number().optional(),
      skatingRating: z.number().optional(),
      stickhandlingRating: z.number().optional(),
      shootingRating: z.number().optional(),
      passingRating: z.number().optional(),
      defenseRating: z.number().optional(),
      hockeyIQRating: z.number().optional(),
      strengths: z.string().optional(),
      areasForImprovement: z.string().optional(),
      overallNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePlayerSeasonMetric(id, data);
      return { success: true };
    }),
});

// ==================== VIDEO ROUTER ====================

const videoRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllVideos();
  }),

  listBySeason: protectedProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ input }) => {
      return await db.getVideosBySeasonId(input.seasonId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.getVideoById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      videoUrl: z.string(),
      thumbnailUrl: z.string().optional(),
      videoType: z.enum(["practice", "game", "drill"]),
      recordedAt: z.date().optional(),
      seasonId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const video = {
        id: randomUUID(),
        ...input,
        uploadedBy: ctx.user.id,
        processingStatus: "pending" as const,
      };
      return await db.createVideo(video);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      videoType: z.enum(["practice", "game", "drill"]).optional(),
      recordedAt: z.date().optional(),
      seasonId: z.string().optional(),
      processingStatus: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateVideo(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteVideo(input.id);
      return { success: true };
    }),

  getUploadUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const key = `videos/${Date.now()}-${input.filename}`;
      // Return the key that will be used for upload
      return { key, uploadPath: key };
    }),

  confirmUpload: protectedProcedure
    .input(z.object({
      key: z.string(),
      title: z.string(),
      description: z.string().optional(),
      videoType: z.enum(["practice", "game", "drill"]),
      recordedAt: z.date().optional(),
      seasonId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // The video URL will be constructed from the key
      const videoUrl = `https://storage/${input.key}`;
      
      const video = {
        id: randomUUID(),
        title: input.title,
        description: input.description,
        videoUrl: videoUrl,
        videoType: input.videoType,
        recordedAt: input.recordedAt,
        seasonId: input.seasonId,
        uploadedBy: ctx.user.id,
        processingStatus: "pending" as const,
      };
      
      return await db.createVideo(video);
    }),

  addPlayer: protectedProcedure
    .input(z.object({
      videoId: z.string(),
      playerId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.addPlayerToVideo(input.videoId, input.playerId, randomUUID());
      return { success: true };
    }),

  removePlayer: protectedProcedure
    .input(z.object({
      videoId: z.string(),
      playerId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.removePlayerFromVideo(input.videoId, input.playerId);
      return { success: true };
    }),

  getPlayers: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }) => {
      return await db.getPlayersForVideo(input.videoId);
    }),
});

// ==================== FEEDBACK ROUTER ====================

const feedbackRouter = router({
  getByVideoId: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }) => {
      return await db.getFeedbackByVideoId(input.videoId);
    }),

  getByPlayerId: protectedProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ input }) => {
      return await db.getFeedbackByPlayerId(input.playerId);
    }),

  create: protectedProcedure
    .input(z.object({
      videoId: z.string(),
      playerId: z.string().optional(),
      whatWentWell: z.string(),
      areasForImprovement: z.string(),
      recommendedDrills: z.string(),
      feedbackType: z.enum(["individual", "team"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const feedback = {
        id: randomUUID(),
        ...input,
        generatedBy: ctx.user.id,
      };
      return await db.createVideoFeedback(feedback);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      whatWentWell: z.string().optional(),
      areasForImprovement: z.string().optional(),
      recommendedDrills: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateVideoFeedback(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteVideoFeedback(input.id);
      return { success: true };
    }),

  generateTeamFeedback: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const video = await db.getVideoById(input.videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      const aiResult = await generateTeamFeedback({
        videoTitle: video.title,
        videoDescription: video.description || undefined,
        videoType: video.videoType,
      });

      const feedback = {
        id: randomUUID(),
        videoId: input.videoId,
        playerId: null,
        feedbackType: "team" as const,
        generatedBy: ctx.user.id,
        ...aiResult,
      };

      await db.createVideoFeedback(feedback);
      return feedback;
    }),

  generateIndividualFeedback: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const video = await db.getVideoById(input.videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      const videoPlayers = await db.getPlayersForVideo(input.videoId);
      if (videoPlayers.length === 0) {
        throw new Error("No players associated with this video");
      }

      const players = await Promise.all(
        videoPlayers.map(async (vp) => {
          const player = await db.getPlayerById(vp.playerId);
          return player ? { id: player.id, name: player.name, position: player.position || undefined } : null;
        })
      );

      const validPlayers = players.filter((p): p is NonNullable<typeof p> => p !== null);

      const aiResults = await generateBulkIndividualFeedback(
        {
          videoTitle: video.title,
          videoDescription: video.description || undefined,
          videoType: video.videoType,
        },
        validPlayers
      );

      const feedbackRecords = [];
      for (const result of aiResults) {
        const feedback = {
          id: randomUUID(),
          videoId: input.videoId,
          playerId: result.playerId,
          feedbackType: "individual" as const,
          generatedBy: ctx.user.id,
          ...result.feedback,
        };
        await db.createVideoFeedback(feedback);
        feedbackRecords.push(feedback);
      }

      return feedbackRecords;
    }),
});

// ==================== MAIN APP ROUTER ====================

// ==================== VIDEO ANALYSIS ROUTER ====================

const videoAnalysisRouter = router({
  start: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input }) => {
      const video = await db.getVideoById(input.videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      // Check if analysis already exists
      const existing = await db.getVideoAnalysisResult(input.videoId);
      if (existing && existing.status === "processing") {
        return { message: "Analysis already in progress", analysisId: existing.id };
      }

      // Create analysis record
      const analysisId = randomUUID();
      await db.createVideoAnalysisResult({
        id: analysisId,
        videoId: input.videoId,
        status: "queued",
        progress: 0,
        startedAt: new Date(),
      });

      // Start analysis (this will run in background)
      // In production, use a job queue like BullMQ
      // For now, we'll use a simple background process
      const { startVideoAnalysis } = await import("./videoAnalysisService");
      
      // Start the analysis with the video URL
      // The service will handle downloading/accessing the video file
      startVideoAnalysis(input.videoId, video.videoUrl || "").catch((error) => {
        console.error(`Failed to start video analysis for ${input.videoId}:`, error);
        db.setVideoAnalysisFailed(input.videoId, error.message);
      });

      return { message: "Analysis started", analysisId };
    }),

  getProgress: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }) => {
      const result = await db.getVideoAnalysisResult(input.videoId);
      if (!result) {
        return null;
      }

      return {
        videoId: result.videoId,
        status: result.status,
        progress: result.progress,
        currentFrame: result.currentFrame || undefined,
        totalFrames: result.totalFrames || undefined,
        message: result.message || undefined,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
      };
    }),

  getResults: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }) => {
      const result = await db.getVideoAnalysisResult(input.videoId);
      if (!result || result.status !== "completed" || !result.analysisData) {
        return null;
      }

      try {
        return JSON.parse(result.analysisData);
      } catch (e) {
        console.error("Failed to parse analysis data:", e);
        return null;
      }
    }),
});

// ==================== MAIN APP ROUTER ====================

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  players: playerRouter,
  seasons: seasonRouter,
  metrics: metricsRouter,
  videos: videoRouter,
  feedback: feedbackRouter,
  videoAnalysis: videoAnalysisRouter,
});

export type AppRouter = typeof appRouter;


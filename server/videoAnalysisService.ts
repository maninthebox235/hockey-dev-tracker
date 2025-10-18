import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getDb } from "./db";
import { videoAnalysisResults } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface VideoAnalysisProgress {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  message?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface PlayerTracking {
  playerId: string;
  trackId: number;
  frames: Array<{
    frameNumber: number;
    timestamp: number;
    bbox: { x: number; y: number; width: number; height: number };
    confidence: number;
    position: { x: number; y: number }; // center point
  }>;
  metrics: {
    totalDistance: number; // meters
    averageSpeed: number; // km/h
    maxSpeed: number; // km/h
    timeOnIce: number; // seconds
  };
}

export interface PoseAnalysis {
  playerId: string;
  trackId: number;
  frames: Array<{
    frameNumber: number;
    timestamp: number;
    keypoints: Array<{
      name: string;
      x: number;
      y: number;
      confidence: number;
    }>;
    posture: {
      skatingAngle?: number; // body lean angle
      stickPosition?: string; // forehand/backhand
      bodyBalance?: number; // 0-1 score
    };
  }>;
}

export interface VideoAnalysisResult {
  videoId: string;
  totalFrames: number;
  fps: number;
  duration: number; // seconds
  playerTracking: PlayerTracking[];
  poseAnalysis: PoseAnalysis[];
  events: Array<{
    timestamp: number;
    frameNumber: number;
    type: string; // shot, pass, etc.
    confidence: number;
    description: string;
  }>;
  summary: {
    totalPlayers: number;
    averageSpeed: number;
    totalDistance: number;
  };
}

// In-memory progress tracking (in production, use Redis or database)
const analysisProgress = new Map<string, VideoAnalysisProgress>();

/**
 * Start video analysis in background
 */
export async function startVideoAnalysis(
  videoId: string,
  videoUrl: string
): Promise<void> {
  try {
    // Initialize progress
    analysisProgress.set(videoId, {
      videoId,
      status: "queued",
      progress: 0,
      startedAt: new Date(),
    });

    if (!videoUrl) {
      analysisProgress.set(videoId, {
        videoId,
        status: "failed",
        progress: 0,
        message: "No video URL provided",
        startedAt: new Date(),
        completedAt: new Date(),
      });
      return;
    }

    // For S3 URLs, the Python script will download the video
    // For local files, use the path directly
    const videoPath = videoUrl;

    // Run Python analysis script in background
    const scriptPath = path.join(__dirname, "../python/analyze_video.py");
    const outputPath = path.join(__dirname, "../analysis_results", `${videoId}.json`);

    console.log(`[Video Analysis] Script path: ${scriptPath}`);
    console.log(`[Video Analysis] Output path: ${outputPath}`);

    // Check if Python script exists
    if (!fs.existsSync(scriptPath)) {
      const error = `Python script not found at ${scriptPath}`;
      console.error(`[Video Analysis] ${error}`);
      analysisProgress.set(videoId, {
        videoId,
        status: "failed",
        progress: 0,
        message: error,
        startedAt: new Date(),
        completedAt: new Date(),
      });
      return;
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

  // Spawn Python process
  const pythonProcess = spawn("python3", [scriptPath, videoPath, videoId, outputPath]);

  // Update progress to processing
  analysisProgress.set(videoId, {
    videoId,
    status: "processing",
    progress: 5,
    startedAt: new Date(),
    message: "Initializing video analysis...",
  });

  // Update database status to processing
  const db = await getDb();
  if (db) {
    await db
      .update(videoAnalysisResults)
      .set({ status: "processing", progress: 5 })
      .where(eq(videoAnalysisResults.videoId, videoId));
  }

  // Handle stdout (progress updates)
  pythonProcess.stdout.on("data", (data) => {
    const output = data.toString().trim();
    console.log(`[Video Analysis ${videoId}] ${output}`);

    // Parse progress updates from Python script
    try {
      const progressData = JSON.parse(output);
      if (progressData.type === "progress") {
        analysisProgress.set(videoId, {
          videoId,
          status: "processing",
          progress: progressData.progress,
          currentFrame: progressData.currentFrame,
          totalFrames: progressData.totalFrames,
          message: progressData.message,
          startedAt: analysisProgress.get(videoId)?.startedAt,
        });
      }
    } catch (e) {
      // Not JSON, just log message
    }
  });

  // Handle stderr
  pythonProcess.stderr.on("data", (data) => {
    console.error(`[Video Analysis ${videoId}] Error: ${data}`);
  });

  // Handle completion
  pythonProcess.on("close", async (code) => {
    const db = await getDb();
    if (code === 0) {
      // Success
      analysisProgress.set(videoId, {
        videoId,
        status: "completed",
        progress: 100,
        completedAt: new Date(),
        message: "Analysis completed successfully",
        startedAt: analysisProgress.get(videoId)?.startedAt,
      });
      
      // Update database
      if (db) {
        const resultPath = path.join(__dirname, "../analysis_results", `${videoId}.json`);
        let results = null;
        if (fs.existsSync(resultPath)) {
          results = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
        }
        
        await db
          .update(videoAnalysisResults)
          .set({ 
            status: "completed", 
            progress: 100,
            results: results ? JSON.stringify(results) : null,
            completedAt: new Date()
          })
          .where(eq(videoAnalysisResults.videoId, videoId));
      }
      
      console.log(`[Video Analysis ${videoId}] Completed successfully`);
    } else {
      // Failed
      analysisProgress.set(videoId, {
        videoId,
        status: "failed",
        progress: 0,
        completedAt: new Date(),
        message: `Analysis failed with code ${code}`,
        startedAt: analysisProgress.get(videoId)?.startedAt,
      });
      
      // Update database
      if (db) {
        await db
          .update(videoAnalysisResults)
          .set({ 
            status: "failed", 
            progress: 0,
            errorMessage: `Analysis failed with code ${code}`,
            completedAt: new Date()
          })
          .where(eq(videoAnalysisResults.videoId, videoId));
      }
      
      console.error(`[Video Analysis ${videoId}] Failed with code ${code}`);
    }
  });
  } catch (error) {
    console.error(`[Video Analysis] Error starting analysis for ${videoId}:`, error);
    analysisProgress.set(videoId, {
      videoId,
      status: "failed",
      progress: 0,
      message: error instanceof Error ? error.message : "Unknown error",
      startedAt: analysisProgress.get(videoId)?.startedAt || new Date(),
      completedAt: new Date(),
    });
  }
}

/**
 * Get analysis progress for a video
 */
export function getAnalysisProgress(videoId: string): VideoAnalysisProgress | null {
  return analysisProgress.get(videoId) || null;
}

/**
 * Get analysis results for a completed video
 */
export async function getAnalysisResults(videoId: string): Promise<VideoAnalysisResult | null> {
  const progress = analysisProgress.get(videoId);
  if (!progress || progress.status !== "completed") {
    return null;
  }

  const resultPath = path.join(__dirname, "../analysis_results", `${videoId}.json`);
  if (!fs.existsSync(resultPath)) {
    return null;
  }

  const resultData = fs.readFileSync(resultPath, "utf-8");
  return JSON.parse(resultData) as VideoAnalysisResult;
}

/**
 * Clear analysis progress (cleanup)
 */
export function clearAnalysisProgress(videoId: string): void {
  analysisProgress.delete(videoId);
}


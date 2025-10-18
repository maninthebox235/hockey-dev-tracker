/**
 * Video Analysis Microservice Client
 * Calls the standalone video analysis service
 */

import { getDb } from "./db";
import { videoAnalysisResults } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const MICROSERVICE_URL = process.env.VIDEO_ANALYSIS_SERVICE_URL || 'http://localhost:5000';

export interface VideoAnalysisProgress {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  message?: string;
}

// In-memory progress tracking
const analysisProgress = new Map<string, VideoAnalysisProgress>();

export function getAnalysisProgress(videoId: string): VideoAnalysisProgress | undefined {
  return analysisProgress.get(videoId);
}

export async function startVideoAnalysisMicroservice(
  videoId: string,
  videoUrl: string
): Promise<void> {
  console.log(`[Video Analysis Microservice] Starting analysis for ${videoId}`);
  
  // Set initial status
  analysisProgress.set(videoId, {
    videoId,
    status: "queued",
    progress: 0,
    message: "Queued for analysis"
  });

  // Call microservice in background
  callMicroservice(videoId, videoUrl).catch(error => {
    console.error(`[Video Analysis Microservice] Error: ${error.message}`);
    analysisProgress.set(videoId, {
      videoId,
      status: "failed",
      progress: 0,
      message: error.message
    });
  });
}

async function callMicroservice(videoId: string, videoUrl: string): Promise<void> {
  try {
    // Update to processing
    analysisProgress.set(videoId, {
      videoId,
      status: "processing",
      progress: 10,
      message: "Sending to analysis service..."
    });

    const db = await getDb();
    if (db) {
      await db
        .update(videoAnalysisResults)
        .set({ status: "processing", progress: 10 })
        .where(eq(videoAnalysisResults.videoId, videoId));
    }

    // Call the microservice
    console.log(`[Video Analysis Microservice] Calling ${MICROSERVICE_URL}/analyze`);
    
    const response = await fetch(`${MICROSERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl,
        videoId
      }),
      signal: AbortSignal.timeout(600000) // 10 minute timeout
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microservice error: ${error}`);
    }

    const results = await response.json();

    // Update progress to completed
    analysisProgress.set(videoId, {
      videoId,
      status: "completed",
      progress: 100,
      message: "Analysis complete"
    });

    // Save results to database
    if (db) {
      await db
        .update(videoAnalysisResults)
        .set({
          status: "completed",
          progress: 100,
          results: JSON.stringify(results),
          completedAt: new Date()
        })
        .where(eq(videoAnalysisResults.videoId, videoId));
    }

    console.log(`[Video Analysis Microservice] Analysis completed for ${videoId}`);

  } catch (error: any) {
    console.error(`[Video Analysis Microservice] Failed:`, error);
    
    analysisProgress.set(videoId, {
      videoId,
      status: "failed",
      progress: 0,
      message: error.message || "Analysis failed"
    });

    const db = await getDb();
    if (db) {
      await db
        .update(videoAnalysisResults)
        .set({
          status: "failed",
          progress: 0,
          errorMessage: error.message
        })
        .where(eq(videoAnalysisResults.videoId, videoId));
    }
  }
}

/**
 * Check if microservice is available
 */
export async function checkMicroserviceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MICROSERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    console.warn('[Video Analysis Microservice] Health check failed:', error);
    return false;
  }
}


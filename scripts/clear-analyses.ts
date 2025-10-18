import { getDb } from "../server/db";
import { videoAnalysisResults } from "../drizzle/schema";

async function clearAnalyses() {
  console.log("Clearing all video analysis results...");
  
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }
  
  await db.delete(videoAnalysisResults);
  console.log("✅ Cleared all video analysis results");
  process.exit(0);
}

clearAnalyses().catch((error) => {
  console.error("Error clearing analyses:", error);
  process.exit(1);
});


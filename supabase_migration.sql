-- Hockey Development Tracker Schema Migration for PostgreSQL/Supabase
-- Converted from MySQL schema

-- Drop existing tables if they exist (optional - comment out if you want to keep existing data)
-- DROP TABLE IF EXISTS video_players CASCADE;
-- DROP TABLE IF EXISTS video_feedback CASCADE;
-- DROP TABLE IF EXISTS "videoAnalysisResults" CASCADE;
-- DROP TABLE IF EXISTS videos CASCADE;
-- DROP TABLE IF EXISTS player_season_metrics CASCADE;
-- DROP TABLE IF EXISTS seasons CASCADE;
-- DROP TABLE IF EXISTS players CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  "jerseyNumber" INTEGER,
  position VARCHAR(50),
  "dateOfBirth" TIMESTAMP WITH TIME ZONE,
  email VARCHAR(320),
  phone VARCHAR(50),
  notes TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player season metrics table
CREATE TABLE IF NOT EXISTS player_season_metrics (
  id VARCHAR(64) PRIMARY KEY,
  "playerId" VARCHAR(64) NOT NULL,
  "seasonId" VARCHAR(64) NOT NULL,
  "gamesPlayed" INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  "skatingRating" INTEGER,
  "stickhandlingRating" INTEGER,
  "shootingRating" INTEGER,
  "passingRating" INTEGER,
  "defenseRating" INTEGER,
  "hockeyIQRating" INTEGER,
  strengths TEXT,
  "areasForImprovement" TEXT,
  "overallNotes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("playerId") REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY ("seasonId") REFERENCES seasons(id) ON DELETE CASCADE
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "videoUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "videoType" VARCHAR(20) NOT NULL CHECK ("videoType" IN ('practice', 'game', 'drill')),
  "recordedAt" TIMESTAMP WITH TIME ZONE,
  "seasonId" VARCHAR(64),
  "uploadedBy" VARCHAR(64) NOT NULL,
  "processingStatus" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("processingStatus" IN ('pending', 'processing', 'completed', 'failed')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("seasonId") REFERENCES seasons(id) ON DELETE SET NULL,
  FOREIGN KEY ("uploadedBy") REFERENCES users(id) ON DELETE CASCADE
);

-- Video feedback table
CREATE TABLE IF NOT EXISTS video_feedback (
  id VARCHAR(64) PRIMARY KEY,
  "videoId" VARCHAR(64) NOT NULL,
  "playerId" VARCHAR(64),
  "whatWentWell" TEXT,
  "areasForImprovement" TEXT,
  "recommendedDrills" TEXT,
  "feedbackType" VARCHAR(20) NOT NULL CHECK ("feedbackType" IN ('individual', 'team')),
  "generatedBy" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("videoId") REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY ("generatedBy") REFERENCES users(id) ON DELETE CASCADE
);

-- Video players association table
CREATE TABLE IF NOT EXISTS video_players (
  id VARCHAR(64) PRIMARY KEY,
  "videoId" VARCHAR(64) NOT NULL,
  "playerId" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("videoId") REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES players(id) ON DELETE CASCADE
);

-- Video analysis results table
CREATE TABLE IF NOT EXISTS "videoAnalysisResults" (
  id VARCHAR(64) PRIMARY KEY,
  "videoId" VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0,
  "currentFrame" INTEGER,
  "totalFrames" INTEGER,
  message TEXT,
  "analysisData" TEXT,
  results TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("videoId") REFERENCES videos(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_active ON players("isActive");
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons("isActive");
CREATE INDEX IF NOT EXISTS idx_videos_season ON videos("seasonId");
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos("processingStatus");
CREATE INDEX IF NOT EXISTS idx_video_analysis_video ON "videoAnalysisResults"("videoId");
CREATE INDEX IF NOT EXISTS idx_video_analysis_status ON "videoAnalysisResults"(status);
CREATE INDEX IF NOT EXISTS idx_player_metrics_player ON player_season_metrics("playerId");
CREATE INDEX IF NOT EXISTS idx_player_metrics_season ON player_season_metrics("seasonId");
CREATE INDEX IF NOT EXISTS idx_video_players_video ON video_players("videoId");
CREATE INDEX IF NOT EXISTS idx_video_players_player ON video_players("playerId");
CREATE INDEX IF NOT EXISTS idx_video_feedback_video ON video_feedback("videoId");
CREATE INDEX IF NOT EXISTS idx_video_feedback_player ON video_feedback("playerId");

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_season_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE "videoAnalysisResults" ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (adjust based on your auth requirements)
-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read access" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON player_season_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON video_feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON video_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON "videoAnalysisResults" FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete (adjust based on your needs)
CREATE POLICY "Allow authenticated write access" ON players FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON seasons FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON player_season_metrics FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON videos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON video_feedback FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON video_players FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON "videoAnalysisResults" FOR ALL TO authenticated USING (true);


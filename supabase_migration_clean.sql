-- Hockey Development Tracker Schema Migration for PostgreSQL/Supabase
-- This will drop existing tables and create fresh schema

-- Drop existing tables
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS video_players CASCADE;
DROP TABLE IF EXISTS video_feedback CASCADE;
DROP TABLE IF EXISTS "videoAnalysisResults" CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS player_season_metrics CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
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
CREATE TABLE seasons (
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
CREATE TABLE player_season_metrics (
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
CREATE TABLE videos (
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
CREATE TABLE video_feedback (
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
CREATE TABLE video_players (
  id VARCHAR(64) PRIMARY KEY,
  "videoId" VARCHAR(64) NOT NULL,
  "playerId" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("videoId") REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES players(id) ON DELETE CASCADE
);

-- Video analysis results table
CREATE TABLE "videoAnalysisResults" (
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
CREATE INDEX idx_players_active ON players("isActive");
CREATE INDEX idx_seasons_active ON seasons("isActive");
CREATE INDEX idx_videos_season ON videos("seasonId");
CREATE INDEX idx_videos_status ON videos("processingStatus");
CREATE INDEX idx_video_analysis_video ON "videoAnalysisResults"("videoId");
CREATE INDEX idx_video_analysis_status ON "videoAnalysisResults"(status);
CREATE INDEX idx_player_metrics_player ON player_season_metrics("playerId");
CREATE INDEX idx_player_metrics_season ON player_season_metrics("seasonId");
CREATE INDEX idx_video_players_video ON video_players("videoId");
CREATE INDEX idx_video_players_player ON video_players("playerId");
CREATE INDEX idx_video_feedback_video ON video_feedback("videoId");
CREATE INDEX idx_video_feedback_player ON video_feedback("playerId");

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_season_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE "videoAnalysisResults" ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for development
-- Note: Adjust these for production based on your auth requirements

-- Allow all operations for authenticated users (development mode)
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON players FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON seasons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON player_season_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON videos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON video_feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON video_players FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON "videoAnalysisResults" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow service role full access
CREATE POLICY "Allow all for service role" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON players FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON seasons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON player_season_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON videos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON video_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON video_players FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON "videoAnalysisResults" FOR ALL TO service_role USING (true) WITH CHECK (true);


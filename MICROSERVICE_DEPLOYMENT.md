# Microservice Deployment Guide

The hockey tracker now uses a microservice architecture for video analysis.

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐
│   Main App      │────────>│  Video Analysis      │
│   (Node.js)     │         │  Microservice        │
│   Port 3000     │         │  (Python/Flask)      │
└─────────────────┘         │  Port 5000           │
                            └──────────────────────┘
```

## Deployment Options

### Option 1: Deploy Both Services Together

Use the provided `docker-compose.yml`:

```bash
docker-compose up -d
```

This will start:
- Main app on port 3000
- Video analysis service on port 5000

### Option 2: Deploy Services Separately

**Main App:**
```bash
# Build and deploy main app
docker build -t hockey-tracker .
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e VIDEO_ANALYSIS_SERVICE_URL="http://video-analysis:5000" \
  hockey-tracker
```

**Video Analysis Service:**
```bash
# Build and deploy video analysis
cd video-analysis-service
docker build -t hockey-video-analysis .
docker run -p 5000:5000 hockey-video-analysis
```

### Option 3: Main App Only (No Video Analysis)

Deploy just the main app without video analysis:

```bash
docker build -t hockey-tracker .
docker run -p 3000:3000 -e DATABASE_URL="your-db-url" hockey-tracker
```

Video analysis will gracefully fail with a helpful message.

## Environment Variables

### Main App
- `DATABASE_URL`: Database connection string (required)
- `VIDEO_ANALYSIS_SERVICE_URL`: URL of video analysis microservice (optional, defaults to http://localhost:5000)
- `JWT_SECRET`: JWT secret for auth
- `OAUTH_SERVER_URL`: OAuth server URL
- All other env vars from `.env`

### Video Analysis Service
- `PORT`: Port to run on (default: 5000)

## Health Checks

**Main App:** `GET /api/health`
**Video Analysis:** `GET /health`

## Scaling

The video analysis microservice can be scaled independently:

```bash
docker-compose up -d --scale video-analysis=3
```

Add a load balancer in front of multiple instances for better performance.

## Monitoring

Monitor both services:

```bash
# Check logs
docker-compose logs -f app
docker-compose logs -f video-analysis

# Check health
curl http://localhost:3000/api/health
curl http://localhost:5000/health
```

## Production Deployment

For production, deploy to separate services:

1. **Main App** → Deploy to your main hosting (Vercel, Railway, etc.)
2. **Video Analysis** → Deploy to a service with GPU support for better performance

Set `VIDEO_ANALYSIS_SERVICE_URL` in main app to point to the video analysis service URL.

## Fallback Behavior

If the video analysis microservice is unavailable, the main app will:
1. Try to use local Python processing (if available)
2. Fail gracefully with a helpful error message

This ensures the main app stays functional even if video analysis is down.


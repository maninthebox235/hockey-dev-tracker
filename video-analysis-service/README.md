# Video Analysis Microservice

Standalone Flask microservice for analyzing hockey videos using YOLOv8.

## Features

- Player detection and tracking
- Pose estimation
- Movement metrics calculation
- RESTful API
- Health checks

## API Endpoints

### POST /analyze
Analyze a video from URL

**Request:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "videoId": "unique-video-id"
}
```

**Response:**
```json
{
  "videoId": "unique-video-id",
  "status": "completed",
  "metadata": {
    "fps": 30,
    "totalFrames": 1500,
    "duration": 50
  },
  "playerTracking": [...],
  "summary": {
    "totalPlayers": 10,
    "averagePlayersPerFrame": 8.5,
    "framesAnalyzed": 1500
  }
}
```

### GET /health
Health check endpoint

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python src/app.py
```

Service runs on port 5000 by default.

## Docker Deployment

```bash
# Build the image
docker build -t hockey-video-analysis .

# Run the container
docker run -p 5000:5000 hockey-video-analysis
```

## Environment Variables

- `PORT`: Port to run the service on (default: 5000)

## Integration with Main App

The main hockey tracker app should call this microservice:

```typescript
// In main app
const response = await fetch('http://video-analysis-service:5000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoUrl: video.url,
    videoId: video.id
  })
});

const results = await response.json();
```


# Large File Upload System

## Overview

The hockey tracker now supports uploading videos up to **1GB** using a resumable chunked upload system that avoids Cloudflare timeout issues.

## How It Works

### Automatic Upload Strategy Selection

The system automatically chooses the best upload method based on file size:

- **Small files (≤50MB)**: Direct upload to server, then to S3
- **Large files (>50MB)**: Resumable chunked upload with automatic retry

### Resumable Upload Process

```
1. Client initiates upload session
   ↓
2. File is split into 10MB chunks
   ↓
3. Each chunk uploaded sequentially
   ↓
4. Server stores chunks in memory
   ↓
5. Client finalizes upload
   ↓
6. Server assembles chunks and uploads to S3
   ↓
7. Returns final S3 URL
```

## Key Features

### ✅ Reliability
- **Automatic Retry**: Each chunk retries up to 3 times on failure
- **Exponential Backoff**: Waits longer between retries (1s, 2s, 4s)
- **Progress Tracking**: Real-time progress updates for each chunk
- **Session Management**: Automatic cleanup of expired sessions (1 hour)

### ✅ Performance
- **10MB Chunks**: Optimal size to avoid timeouts
- **Sequential Upload**: Ensures reliable delivery
- **Memory Efficient**: Chunks cleared after assembly

### ✅ User Experience
- **Progress Bar**: Shows percentage and chunk count
- **Error Messages**: Clear feedback on failures
- **Cancellation**: Can cancel uploads mid-process

## API Endpoints

### Initialize Upload Session
```http
POST /api/upload/resumable/init
Content-Type: application/json

{
  "fileName": "hockey-game.mp4",
  "fileSize": 524288000,
  "mimeType": "video/mp4",
  "totalChunks": 50
}

Response:
{
  "success": true,
  "uploadId": "uuid-here",
  "fileKey": "videos/timestamp-id-filename.mp4"
}
```

### Upload Chunk
```http
POST /api/upload/resumable/:uploadId/chunk/:chunkIndex
Content-Type: multipart/form-data

Form Data:
- chunk: (binary data)

Response:
{
  "success": true,
  "chunkIndex": 0,
  "received": 1,
  "total": 50
}
```

### Finalize Upload
```http
POST /api/upload/resumable/:uploadId/complete

Response:
{
  "success": true,
  "videoUrl": "https://forge.manus.ai/v1/storage/download/...",
  "fileName": "hockey-game.mp4",
  "fileSize": 524288000
}
```

### Check Status
```http
GET /api/upload/resumable/:uploadId/status

Response:
{
  "success": true,
  "uploadId": "uuid-here",
  "fileName": "hockey-game.mp4",
  "fileSize": 524288000,
  "receivedChunks": 25,
  "totalChunks": 50,
  "progress": 50
}
```

### Cancel Upload
```http
DELETE /api/upload/resumable/:uploadId

Response:
{
  "success": true
}
```

## Frontend Usage

The frontend automatically uses the resumable upload system for large files:

```typescript
import { uploadFileResumable, shouldUseResumableUpload } from "@/lib/resumableUpload";

// Check if file should use resumable upload
if (shouldUseResumableUpload(file.size)) {
  // Upload with progress tracking
  const result = await uploadFileResumable(file, (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
    console.log(`Chunk ${progress.currentChunk}/${progress.totalChunks}`);
  });
  
  console.log(`Video URL: ${result.videoUrl}`);
}
```

## Configuration

### Chunk Size
Default: 10MB (configurable in `resumableUpload.ts`)

```typescript
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
```

### Max Retries
Default: 3 attempts per chunk

```typescript
const MAX_RETRIES = 3;
```

### Session Timeout
Default: 1 hour (automatic cleanup)

```typescript
// In presignedUpload.ts
setInterval(() => {
  // Clean up sessions older than 1 hour
}, 5 * 60 * 1000);
```

## Advantages Over Chunked Upload

The previous chunked upload system had deployment issues (503 errors). The new resumable upload system:

1. **Works with Cloudflare**: Each chunk upload completes quickly (< 30s)
2. **Better Error Handling**: Automatic retry per chunk
3. **Progress Tracking**: More granular progress updates
4. **Session Management**: Can resume failed uploads
5. **Memory Efficient**: Chunks stored temporarily, then cleared

## File Size Limits

| Upload Method | Max Size | Use Case |
|--------------|----------|----------|
| Direct Upload | 50MB | Small videos, quick uploads |
| Resumable Upload | 1GB | Full game footage, long practices |

## Error Handling

### Common Errors

**"Upload session not found"**
- Session expired (>1 hour old)
- Solution: Restart upload

**"Failed to upload chunk X after 3 retries"**
- Network issues
- Solution: Check internet connection, try again

**"Missing chunks: X/Y"**
- Not all chunks received
- Solution: System will retry missing chunks

**"File too large. Maximum size is 1GB"**
- File exceeds limit
- Solution: Compress video or split into segments

## Testing

### Test Small File Upload (Direct)
```bash
# Upload a 10MB file
curl -X POST http://localhost:3001/api/upload/video \
  -F "video=@small-video.mp4"
```

### Test Large File Upload (Resumable)
```bash
# 1. Initialize
curl -X POST http://localhost:3001/api/upload/resumable/init \
  -H "Content-Type: application/json" \
  -d '{"fileName":"large.mp4","fileSize":100000000,"totalChunks":10}'

# 2. Upload chunks (repeat for each chunk)
curl -X POST http://localhost:3001/api/upload/resumable/UUID/chunk/0 \
  -F "chunk=@chunk0.bin"

# 3. Finalize
curl -X POST http://localhost:3001/api/upload/resumable/UUID/complete
```

## Production Considerations

1. **Memory Usage**: Large files held in memory during assembly
   - Consider using disk storage for very large files
   - Monitor server memory usage

2. **Concurrent Uploads**: Multiple users uploading simultaneously
   - Current implementation uses in-memory Map
   - Consider Redis for production scale

3. **Network Reliability**: Retry logic handles temporary failures
   - Works well with mobile networks
   - Handles intermittent connectivity

4. **Storage Costs**: All videos stored in S3
   - Implement lifecycle policies for old videos
   - Consider compression before upload

## Future Enhancements

- [ ] Resume interrupted uploads (persist session state)
- [ ] Parallel chunk uploads (faster for good connections)
- [ ] Client-side compression before upload
- [ ] Thumbnail generation during upload
- [ ] Video format validation
- [ ] Duplicate detection (hash-based)

## Summary

The resumable upload system provides a reliable way to upload large hockey videos (up to 1GB) without timeout issues. It automatically handles:
- Network failures with retry logic
- Progress tracking for user feedback
- Memory management with automatic cleanup
- Cloudflare proxy timeout constraints

Users can now upload full game footage and long practice sessions without worrying about file size limits or connection timeouts.


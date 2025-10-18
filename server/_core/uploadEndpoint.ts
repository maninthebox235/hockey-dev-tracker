import { Router } from "express";
import multer from "multer";
import { uploadVideoToS3 } from "../videoUploadService";

const router = Router();

// Configure multer for memory storage (files stored in RAM temporarily)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max file size
  },
  fileFilter: (req, file, cb) => {
    console.log('[Upload] File MIME type:', file.mimetype);
    // Accept video files and common video formats
    // Some browsers/clients don't send MIME types correctly
    if (file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/octet-stream' ||
        file.originalname.match(/\.(mp4|mov|avi|mkv|webm|flv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Only video files are allowed. Received: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/upload/video
 * Upload a video file to S3 storage
 */
router.post('/video', upload.single('video'), async (req, res) => {
  try {
    console.log('[Upload] Request received');
    
    if (!req.file) {
      console.error('[Upload] No file in request');
      return res.status(400).json({ 
        success: false,
        error: 'No video file provided' 
      });
    }

    console.log(`[Upload] File received: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // Upload to S3
    console.log('[Upload] Starting S3 upload...');
    const result = await uploadVideoToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    
    console.log('[Upload] S3 upload successful:', result.fileName);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Upload] Stack:', errorStack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload video',
      message: errorMessage,
    });
  }
});

export default router;


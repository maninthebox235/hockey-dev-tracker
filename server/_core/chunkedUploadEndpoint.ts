import { Router } from "express";
import multer from "multer";
import { uploadVideoToS3 } from "../videoUploadService";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const router = Router();

// Configure multer for chunked uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per chunk
  },
});

// Store upload sessions in memory (in production, use Redis)
interface UploadSession {
  uploadId: string;
  fileName: string;
  totalChunks: number;
  chunks: Map<number, Buffer>;
  createdAt: Date;
}

const uploadSessions = new Map<string, UploadSession>();

// Cleanup old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [uploadId, session] of Array.from(uploadSessions.entries())) {
    if (session.createdAt < oneHourAgo) {
      uploadSessions.delete(uploadId);
      console.log(`[Chunked Upload] Cleaned up expired session: ${uploadId}`);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

/**
 * POST /api/upload/chunked/init
 * Initialize a chunked upload session
 */
router.post('/init', (req, res) => {
  console.log('[Chunked Upload] Init request received');
  try {
    const { fileName, totalChunks, fileSize } = req.body;
    
    if (!fileName || !totalChunks || !fileSize) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fileName, totalChunks, fileSize',
      });
    }

    const uploadId = randomUUID();
    
    uploadSessions.set(uploadId, {
      uploadId,
      fileName,
      totalChunks: parseInt(totalChunks),
      chunks: new Map(),
      createdAt: new Date(),
    });

    console.log(`[Chunked Upload] Initialized session ${uploadId} for ${fileName} (${totalChunks} chunks)`);

    res.json({
      success: true,
      uploadId,
    });
  } catch (error) {
    console.error('[Chunked Upload] Init error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize upload',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/upload/chunked/chunk
 * Upload a single chunk
 */
router.post('/chunk', upload.single('chunk'), (req, res) => {
  try {
    const { uploadId, chunkIndex } = req.body;
    
    if (!uploadId || chunkIndex === undefined || !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: uploadId, chunkIndex, chunk file',
      });
    }

    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Upload session not found. It may have expired.',
      });
    }

    const index = parseInt(chunkIndex);
    session.chunks.set(index, req.file.buffer);

    console.log(`[Chunked Upload] Received chunk ${index + 1}/${session.totalChunks} for ${uploadId}`);

    res.json({
      success: true,
      receivedChunks: session.chunks.size,
      totalChunks: session.totalChunks,
    });
  } catch (error) {
    console.error('[Chunked Upload] Chunk error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload chunk',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/upload/chunked/complete
 * Complete the chunked upload and assemble the file
 */
router.post('/complete', async (req, res) => {
  try {
    const { uploadId } = req.body;
    
    if (!uploadId) {
      return res.status(400).json({
        success: false,
        error: 'Missing uploadId',
      });
    }

    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Upload session not found',
      });
    }

    // Check if all chunks are received
    if (session.chunks.size !== session.totalChunks) {
      return res.status(400).json({
        success: false,
        error: `Missing chunks. Received ${session.chunks.size}/${session.totalChunks}`,
      });
    }

    console.log(`[Chunked Upload] Assembling ${session.totalChunks} chunks for ${uploadId}`);

    // Assemble chunks in order
    const chunks: Buffer[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = session.chunks.get(i);
      if (!chunk) {
        return res.status(400).json({
          success: false,
          error: `Missing chunk ${i}`,
        });
      }
      chunks.push(chunk);
    }

    const completeFile = Buffer.concat(chunks);
    console.log(`[Chunked Upload] Assembled file size: ${completeFile.length} bytes`);

    // Upload to S3
    console.log(`[Chunked Upload] Uploading to S3...`);
    const result = await uploadVideoToS3(
      completeFile,
      session.fileName,
      'video/mp4' // Default to mp4, could be passed in init
    );

    // Clean up session
    uploadSessions.delete(uploadId);
    console.log(`[Chunked Upload] Upload complete: ${result.videoUrl}`);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Chunked Upload] Complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete upload',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/upload/chunked/cancel
 * Cancel an upload session
 */
router.delete('/cancel', (req, res) => {
  console.log('[Chunked Upload] Cancel request received');
  try {
    const { uploadId } = req.body;
    
    if (!uploadId) {
      return res.status(400).json({
        success: false,
        error: 'Missing uploadId',
      });
    }

    const deleted = uploadSessions.delete(uploadId);
    
    if (deleted) {
      console.log(`[Chunked Upload] Cancelled session: ${uploadId}`);
    }

    res.json({
      success: true,
      cancelled: deleted,
    });
  } catch (error) {
    console.error('[Chunked Upload] Cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel upload',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


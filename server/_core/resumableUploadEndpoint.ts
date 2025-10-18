import express from "express";
import multer from "multer";
import {
  createUploadSession,
  addChunk,
  finalizeUpload,
  getUploadSession,
  cancelUploadSession,
} from "../presignedUpload";

const router = express.Router();

// Use memory storage for chunks
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per chunk
  },
});

/**
 * POST /api/upload/resumable/init
 * Initialize a resumable upload session
 */
router.post("/init", (req, res) => {
  console.log("[Resumable Upload] Init request received");
  try {
    const { fileName, fileSize, mimeType, totalChunks } = req.body;

    if (!fileName || !fileSize || !totalChunks) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fileName, fileSize, totalChunks",
      });
    }

    const uploadId = crypto.randomUUID();
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString("hex");
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `videos/${timestamp}-${randomId}-${sanitizedFileName}`;

    createUploadSession(uploadId, fileKey, fileName, fileSize, mimeType || "video/mp4", totalChunks);

    console.log(`[Resumable Upload] Created session ${uploadId} for ${fileName} (${totalChunks} chunks)`);

    res.json({
      success: true,
      uploadId,
      fileKey,
    });
  } catch (error) {
    console.error("[Resumable Upload] Init error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/upload/resumable/:uploadId/chunk/:chunkIndex
 * Upload a single chunk
 */
router.post("/:uploadId/chunk/:chunkIndex", upload.single("chunk"), (req, res) => {
  try {
    const { uploadId, chunkIndex } = req.params;
    const chunkIndexNum = parseInt(chunkIndex, 10);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No chunk data provided",
      });
    }

    const session = getUploadSession(uploadId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Upload session not found",
      });
    }

    const success = addChunk(uploadId, chunkIndexNum, req.file.buffer);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to add chunk",
      });
    }

    console.log(
      `[Resumable Upload] Received chunk ${chunkIndexNum + 1}/${session.totalChunks} for ${uploadId}`
    );

    res.json({
      success: true,
      chunkIndex: chunkIndexNum,
      received: session.receivedChunks,
      total: session.totalChunks,
    });
  } catch (error) {
    console.error("[Resumable Upload] Chunk upload error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/upload/resumable/:uploadId/complete
 * Finalize the upload and assemble chunks
 */
router.post("/:uploadId/complete", async (req, res) => {
  try {
    const { uploadId } = req.params;

    console.log(`[Resumable Upload] Finalizing upload ${uploadId}`);

    const session = getUploadSession(uploadId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Upload session not found",
      });
    }

    const videoUrl = await finalizeUpload(uploadId);
    if (!videoUrl) {
      return res.status(500).json({
        success: false,
        error: "Failed to finalize upload",
      });
    }

    console.log(`[Resumable Upload] Completed upload ${uploadId} -> ${videoUrl}`);

    res.json({
      success: true,
      videoUrl,
      fileName: session.fileName,
      fileSize: session.fileSize,
    });
  } catch (error) {
    console.error("[Resumable Upload] Finalize error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * DELETE /api/upload/resumable/:uploadId
 * Cancel an upload session
 */
router.delete("/:uploadId", (req, res) => {
  try {
    const { uploadId } = req.params;

    cancelUploadSession(uploadId);

    console.log(`[Resumable Upload] Cancelled session ${uploadId}`);

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("[Resumable Upload] Cancel error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/upload/resumable/:uploadId/status
 * Get upload session status
 */
router.get("/:uploadId/status", (req, res) => {
  try {
    const { uploadId } = req.params;

    const session = getUploadSession(uploadId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Upload session not found",
      });
    }

    res.json({
      success: true,
      uploadId: session.uploadId,
      fileName: session.fileName,
      fileSize: session.fileSize,
      receivedChunks: session.receivedChunks,
      totalChunks: session.totalChunks,
      progress: Math.round((session.receivedChunks / session.totalChunks) * 100),
    });
  } catch (error) {
    console.error("[Resumable Upload] Status error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Add crypto import at the top
import crypto from "crypto";

export default router;


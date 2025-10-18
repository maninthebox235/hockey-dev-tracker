import { storagePut } from "./storage";
import crypto from "crypto";

/**
 * Generate a presigned upload URL for direct browser-to-S3 uploads
 * This bypasses the server for large file uploads, avoiding timeout issues
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<{ uploadUrl: string; fileKey: string; finalUrl: string }> {
  // Generate unique file key
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString("hex");
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileKey = `videos/${timestamp}-${randomId}-${sanitizedFileName}`;

  // For S3 presigned URLs, we need to use the storage service
  // Since our storage service uses Manus's built-in storage, we'll use a different approach:
  // 1. Generate a temporary upload token
  // 2. Return a direct upload endpoint that streams to S3
  
  // For now, we'll use a chunked approach with resumable uploads
  // The client will upload in chunks, and we'll assemble them server-side
  
  const uploadId = crypto.randomUUID();
  
  return {
    uploadUrl: `/api/upload/resumable/${uploadId}`,
    fileKey,
    finalUrl: `pending-${uploadId}`, // Will be replaced with actual S3 URL after upload
  };
}

/**
 * Store upload session metadata
 */
interface UploadSession {
  uploadId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunks: Map<number, Buffer>;
  totalChunks: number;
  receivedChunks: number;
  createdAt: Date;
}

const uploadSessions = new Map<string, UploadSession>();

export function createUploadSession(
  uploadId: string,
  fileKey: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  totalChunks: number
): void {
  uploadSessions.set(uploadId, {
    uploadId,
    fileKey,
    fileName,
    fileSize,
    mimeType,
    chunks: new Map(),
    totalChunks,
    receivedChunks: 0,
    createdAt: new Date(),
  });
}

export function addChunk(uploadId: string, chunkIndex: number, chunkData: Buffer): boolean {
  const session = uploadSessions.get(uploadId);
  if (!session) {
    return false;
  }

  session.chunks.set(chunkIndex, chunkData);
  session.receivedChunks++;

  return true;
}

export async function finalizeUpload(uploadId: string): Promise<string | null> {
  const session = uploadSessions.get(uploadId);
  if (!session) {
    return null;
  }

  // Check if all chunks received
  if (session.receivedChunks !== session.totalChunks) {
    throw new Error(`Missing chunks: ${session.receivedChunks}/${session.totalChunks}`);
  }

  // Assemble chunks in order
  const chunks: Buffer[] = [];
  for (let i = 0; i < session.totalChunks; i++) {
    const chunk = session.chunks.get(i);
    if (!chunk) {
      throw new Error(`Missing chunk ${i}`);
    }
    chunks.push(chunk);
  }

  const completeFile = Buffer.concat(chunks);

  // Upload to S3
  const { url } = await storagePut(session.fileKey, completeFile, session.mimeType);

  // Clean up session
  uploadSessions.delete(uploadId);

  return url;
}

export function getUploadSession(uploadId: string): UploadSession | undefined {
  return uploadSessions.get(uploadId);
}

export function cancelUploadSession(uploadId: string): void {
  uploadSessions.delete(uploadId);
}

// Clean up old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [uploadId, session] of uploadSessions.entries()) {
    if (session.createdAt < oneHourAgo) {
      uploadSessions.delete(uploadId);
      console.log(`[Resumable Upload] Cleaned up expired session ${uploadId}`);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes


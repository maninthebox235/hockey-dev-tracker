import { storagePut } from "./storage";
import { randomUUID } from "crypto";

export interface VideoUploadResult {
  videoUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Upload video file to S3 storage
 */
export async function uploadVideoToS3(
  fileBuffer: Buffer,
  originalFileName: string,
  mimeType: string
): Promise<VideoUploadResult> {
  // Generate unique filename
  const timestamp = Date.now();
  const randomId = randomUUID().substring(0, 8);
  const extension = originalFileName.split('.').pop() || 'mp4';
  const fileName = `videos/${timestamp}-${randomId}.${extension}`;

  // Upload to S3
  const { key, url } = await storagePut(fileName, fileBuffer, mimeType);

  return {
    videoUrl: url,
    fileName: key,
    fileSize: fileBuffer.length,
    mimeType,
  };
}

/**
 * Download video file from S3 for processing
 */
export async function downloadVideoFromS3(videoUrl: string): Promise<string> {
  // For S3 URLs, we can use them directly
  // The Python script will download the file
  return videoUrl;
}


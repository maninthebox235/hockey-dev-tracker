/**
 * Resumable upload utility for large video files
 * Uploads files in chunks with automatic retry on failure
 */

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_RETRIES = 3;

export interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
}

export interface UploadResult {
  success: boolean;
  videoUrl: string;
  fileName: string;
  fileSize: number;
}

/**
 * Upload a file using resumable chunked upload
 */
export async function uploadFileResumable(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // Initialize upload session
  const initResponse = await fetch("/api/upload/resumable/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      totalChunks,
    }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.json();
    throw new Error(error.error || "Failed to initialize upload");
  }

  const { uploadId } = await initResponse.json();

  // Upload chunks
  let uploadedBytes = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    // Retry logic for each chunk
    let retries = 0;
    let success = false;

    while (retries < MAX_RETRIES && !success) {
      try {
        const formData = new FormData();
        formData.append("chunk", chunk);

        const chunkResponse = await fetch(
          `/api/upload/resumable/${uploadId}/chunk/${chunkIndex}`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!chunkResponse.ok) {
          throw new Error(`Chunk upload failed: ${chunkResponse.statusText}`);
        }

        success = true;
        uploadedBytes += chunk.size;

        // Report progress
        if (onProgress) {
          onProgress({
            uploadedBytes,
            totalBytes: file.size,
            percentage: Math.round((uploadedBytes / file.size) * 100),
            currentChunk: chunkIndex + 1,
            totalChunks,
          });
        }
      } catch (error) {
        retries++;
        console.error(`Chunk ${chunkIndex} upload failed (attempt ${retries}):`, error);

        if (retries >= MAX_RETRIES) {
          // Cancel the upload session
          await fetch(`/api/upload/resumable/${uploadId}`, {
            method: "DELETE",
          });
          throw new Error(
            `Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} retries`
          );
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  }

  // Finalize upload
  const completeResponse = await fetch(`/api/upload/resumable/${uploadId}/complete`, {
    method: "POST",
  });

  if (!completeResponse.ok) {
    const error = await completeResponse.json();
    throw new Error(error.error || "Failed to finalize upload");
  }

  const result = await completeResponse.json();
  return result;
}

/**
 * Check if resumable upload should be used based on file size
 */
export function shouldUseResumableUpload(fileSize: number): boolean {
  // Use resumable upload for files larger than 50MB
  return fileSize > 50 * 1024 * 1024;
}


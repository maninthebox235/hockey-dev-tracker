/**
 * Chunked file upload utility to avoid Cloudflare timeouts
 * Splits large files into chunks and uploads them sequentially
 */

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

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
  mimeType: string;
}

/**
 * Upload a file using chunked upload
 */
export async function uploadFileInChunks(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  console.log(`[Chunked Upload] Starting upload: ${file.name}, size: ${file.size}, chunks: ${totalChunks}`);

  // Step 1: Initialize upload session
  const initResponse = await fetch('/api/upload/chunked/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      totalChunks,
      fileSize: file.size,
    }),
  });

  if (!initResponse.ok) {
    throw new Error('Failed to initialize chunked upload');
  }

  const { uploadId } = await initResponse.json();
  console.log(`[Chunked Upload] Session initialized: ${uploadId}`);

  try {
    // Step 2: Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('chunk', chunk);

      const chunkResponse = await fetch('/api/upload/chunked/chunk', {
        method: 'POST',
        body: formData,
      });

      if (!chunkResponse.ok) {
        throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`);
      }

      // Report progress
      if (onProgress) {
        onProgress({
          uploadedBytes: end,
          totalBytes: file.size,
          percentage: Math.round((end / file.size) * 100),
          currentChunk: chunkIndex + 1,
          totalChunks,
        });
      }

      console.log(`[Chunked Upload] Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
    }

    // Step 3: Complete upload
    const completeResponse = await fetch('/api/upload/chunked/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uploadId }),
    });

    if (!completeResponse.ok) {
      throw new Error('Failed to complete upload');
    }

    const result = await completeResponse.json();
    console.log(`[Chunked Upload] Upload complete:`, result);

    return result;
  } catch (error) {
    // Cancel upload on error
    try {
      await fetch('/api/upload/chunked/cancel', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId }),
      });
    } catch (cancelError) {
      console.error('[Chunked Upload] Failed to cancel upload:', cancelError);
    }

    throw error;
  }
}

/**
 * Determine if a file should use chunked upload
 * Files larger than 50MB use chunked upload to avoid timeouts
 */
export function shouldUseChunkedUpload(fileSize: number): boolean {
  return fileSize > 50 * 1024 * 1024; // 50MB threshold
}


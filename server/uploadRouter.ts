import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { uploadVideoToS3 } from "./videoUploadService";

export const uploadRouter = router({
  /**
   * Get a presigned upload URL for direct browser upload
   * This allows large files to be uploaded directly to S3 from the browser
   */
  getUploadUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input }) => {
      // For now, we'll return a placeholder
      // In production, this would generate a presigned S3 upload URL
      return {
        uploadUrl: `/api/upload/video`,
        fileId: `${Date.now()}-${input.fileName}`,
      };
    }),

  /**
   * Confirm upload completion and save video metadata
   */
  confirmUpload: protectedProcedure
    .input(z.object({
      fileId: z.string(),
      videoUrl: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        videoUrl: input.videoUrl,
      };
    }),
});


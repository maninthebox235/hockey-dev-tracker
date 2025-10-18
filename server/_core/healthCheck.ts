import { Request, Response } from "express";

/**
 * Health check endpoint for deployment monitoring
 */
export function healthCheck(req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}


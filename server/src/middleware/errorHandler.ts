import { Request, Response, NextFunction } from "express";

// Custom error class so we can attach an HTTP status code to thrown errors
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// This MUST be registered last in app.ts, after all routes.
// Express recognizes it as an error handler because it takes 4 arguments.
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).json({
    status: "error",
    message,
  });
}

// Catches requests to routes that don't exist
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

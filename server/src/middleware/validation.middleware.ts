import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "@/middleware/errorHandler";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const message = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
        return next(new AppError(message, 400));
    }

    req.body = result.data; // replace with the parsed/validated version
    next();
  };
}
import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price cannot be negative").optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  thumbnailUrl: z.url({ message: "Must be a valid URL"}).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  published: z.boolean().optional(),
});
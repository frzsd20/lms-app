import z from "zod";

export const createLessonSchema = z.object({
    title: z.string().min(3, "Title too short"), 
    content: z.string().min(10, "Content must be 10 characters long").optional(), 
    videoUrl: z.url({ message: "Must be a valid URL"}).optional(), 
    attachmentUrl: z.url({ message: "Must be a valid URL"}).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();
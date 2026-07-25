import z from "zod";

export const createModuleSchema = z.object({
    title: z.string().min(3, "Title is too short"),
});

export const updateModuleSchema = createModuleSchema;
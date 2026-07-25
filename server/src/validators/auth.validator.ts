import z from "zod";

export const registerSchema = z.object({
    name: z.string().min(3, "Name too short"),
    email: z.email(),
    password: z.string().min(8, "Password must be 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
});

export const updateUserSchema = z.object({
    name: z.string().min(3, "Name too short").optional(),
    password: z.string().min(8, "Password must be 8 characters long").optional(),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1, "Password is required"), 
})
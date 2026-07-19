import { Router } from "express";
import { updateLessonProgress, getCourseProgress } from "@/controllers/lesson_progress.controller";
import { protectRoute } from "@/middleware/auth.middleware";

const router = Router();

router.patch("/lessons/:lessonId/progress", protectRoute, updateLessonProgress);
router.get("/courses/:courseId/progress", protectRoute, getCourseProgress);

export default router;
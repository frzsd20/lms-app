import { Router } from 'express';

const router = Router();

import { createLesson, updateLesson, deleteLesson } from '@/controllers/lesson.controller';
import { protectRoute } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import { createLessonSchema, updateLessonSchema } from '@/validators/lesson.validator';

router.post('/modules/:moduleId/lessons', protectRoute, validate(createLessonSchema), createLesson);

router.patch('/lessons/:lessonId', protectRoute, validate(updateLessonSchema), updateLesson);

router.delete('/lessons/:lessonId', protectRoute, deleteLesson);

export default router;
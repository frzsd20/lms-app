import { Router } from 'express';

const router = Router();

import { createLesson, updateLesson, deleteLesson } from '@/controllers/lesson.controller';
import { protectRoute } from '@/middleware/auth.middleware';

router.post('/modules/:moduleId/lessons', protectRoute,createLesson);

router.patch('/lessons/:lessonId', protectRoute, updateLesson);

router.delete('/lessons/:lessonId', protectRoute, deleteLesson);

export default router;
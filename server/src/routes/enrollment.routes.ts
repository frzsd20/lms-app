import { Router } from 'express';

const router = Router();

import { enrollStudent, getMyEnrollments, getEnrollmentsByCourse } from '@/controllers/enrollment.controller';
import { protectRoute } from '@/middleware/auth.middleware';

router.post('/courses/:courseId/enroll', protectRoute, enrollStudent);

router.get('/enrollments/my', protectRoute, getMyEnrollments);

router.get('/courses/:courseId/enrollments', protectRoute, getEnrollmentsByCourse);

export default router;
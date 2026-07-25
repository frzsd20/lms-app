import { attachUserIfPresent } from "@/middleware/auth.middleware";
import { createCourse, deleteCourse, getAllCourses, getCourseById, updateCourse } from "@/controllers/course.controller";
import { AuthorizeRoles, protectRoute } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validation.middleware";
import { createCourseSchema, updateCourseSchema } from "@/validators/course.validator";
import { Router } from "express";

const router = Router();

router.post("/", protectRoute, AuthorizeRoles("ADMIN", "INSTRUCTOR"), validate(createCourseSchema), createCourse);

router.get("/", getAllCourses);

router.get("/:id", attachUserIfPresent, getCourseById);

router.patch("/:id", protectRoute, validate(updateCourseSchema), updateCourse);

router.delete("/:id", protectRoute, deleteCourse);

export default router;
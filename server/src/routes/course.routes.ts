import { attachUserIfPresent } from "@/controllers/auth.controller";
import { createCourse, getAllCourses, getCourseById, updateCourse } from "@/controllers/course.controller";
import { AuthorizeRoles, protectRoute } from "@/middleware/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/", protectRoute, AuthorizeRoles("ADMIN", "INSTRUCTOR"), createCourse);

router.get("/", getAllCourses);

router.get("/:id", attachUserIfPresent, getCourseById);

router.patch("/:id", protectRoute, updateCourse);

export default router;
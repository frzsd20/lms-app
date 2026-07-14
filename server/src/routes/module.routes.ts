import { createModule, deleteModule, updateModule } from "@/controllers/module.controller";
import { protectRoute } from "@/middleware/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/courses/:courseId/modules", protectRoute, createModule);

router.patch("/modules/:moduleId", protectRoute, updateModule);

router.delete("/modules/:moduleId", protectRoute, deleteModule);

export default router;
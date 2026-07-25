import { createModule, deleteModule, updateModule } from "@/controllers/module.controller";
import { protectRoute } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validation.middleware";
import { createModuleSchema, updateModuleSchema } from "@/validators/module.validator";
import { Router } from "express";

const router = Router();

router.post("/courses/:courseId/modules", protectRoute, validate(createModuleSchema), createModule);

router.patch("/modules/:moduleId", protectRoute, validate(updateModuleSchema), updateModule);

router.delete("/modules/:moduleId", protectRoute, deleteModule);

export default router;
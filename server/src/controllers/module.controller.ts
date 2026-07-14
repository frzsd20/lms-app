import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/db';
import { AppError } from '@/middleware/errorHandler';

export async function createModule(req: Request, res: Response, next: NextFunction) {
  try {

    const user = req.user;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const courseId = req.params.courseId;

    const course = await prisma.course.findUnique({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }
    
    const isOwner = user.id === course.instructorId;
    const isAdmin = user.role === "ADMIN";

    const hasFullAccess = isOwner || isAdmin;

    if (!hasFullAccess) {
      throw new AppError("You do not have permission to create a module for this course", 403);
    }

    const { title } = req.body;

    if (!title) {
        throw new AppError("Title is required", 400);
    }

    const moduleCount = await prisma.module.count({
      where: { courseId: course.id },
    });

    const order = moduleCount + 1;

    const module = await prisma.module.create({
      data: {
        title,
        order,
        courseId: course.id,
      },
    });

    res.status(201).json({
      status: "ok",
      module,
    });

  } catch (error) {
    next(error);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const module = await prisma.module.findUnique({
      where: { id: req.params.moduleId },
      include: { course: { select: { instructorId: true, deletedAt: true } } },
    });

    if (!module) {
      throw new AppError("Module not found", 404);
    }

    if (module.course.deletedAt !== null) {
      throw new AppError("Course has been deleted", 404);
    }

    const isOwner = user.id === module.course.instructorId;
    const isAdmin = user.role === "ADMIN";

    const hasFullAccess = isOwner || isAdmin;

    if (!hasFullAccess) {
      throw new AppError("You do not have permission to update this module", 403);
    }

    const { title } = req.body;

    if (!title) {
      throw new AppError("Title is required", 400);
    }

    const updatedModule = await prisma.module.update({
      where: { id: req.params.moduleId },
      data: { title },
    });

    res.status(200).json({
      status: "ok",
      module: updatedModule,
    });

  } catch (error) {
    next(error);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const module = await prisma.module.findUnique({
      where: { id: req.params.moduleId },
      include: { course: { select: { instructorId: true, deletedAt: true } } },
    });

    if (!module) {
      throw new AppError("Module not found", 404);
    }

    if (module.course.deletedAt !== null) {
      throw new AppError("Course already deleted", 404);
    }

    const isOwner = user.id === module.course.instructorId;
    const isAdmin = user.role === "ADMIN";

    const hasFullAccess = isOwner || isAdmin;

    if (!hasFullAccess) {
      throw new AppError("You do not have permission to delete this module", 403);
    }

    await prisma.module.delete({
      where: { id: req.params.moduleId },
    });

    res.status(200).json({
      status: "ok",
      message: "Module deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

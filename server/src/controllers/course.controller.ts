import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/db";
import { AppError } from "@/middleware/errorHandler";

export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, price, level, thumbnailUrl } = req.body;

    if (!title || !description) {
        throw new AppError("Title and description are required", 400);
    }

    if (!req.user) {
        throw new AppError("Not authenticated", 401);
    }

    const instructorId = req.user.id;
    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        price,
        level,
        thumbnailUrl,
        instructorId: instructorId,
      },
    });
    
    res.status(201).json({
      status: "ok",
      course: newCourse,
    });

  } catch (error) {
    next(error);
  }
}

export async function getAllCourses(req: Request, res: Response, next: NextFunction) {
  try {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [courses, totalCount] = await Promise.all([
        prisma.course.findMany({
            where: { published: true, deletedAt: null },
            include: { instructor: { select: { id: true, name: true } } },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.course.count({ where: { published: true, deletedAt: null } }),
    ]);

    res.status(200).json({
        status: "ok",
        courses,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    });

  } catch (error) {
    next(error);
  }
}

export async function getCourseById(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.params.id;
    
    const course = await prisma.course.findUnique({
      where: { id: courseId, deletedAt: null },
      include: {
        instructor: { select: { id: true, name: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            }
          }
        },
      },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Determine access level
    const isOwner = req.user?.id === course.instructorId;
    const isAdmin = req.user?.role === "ADMIN";

    let hasFullAccess = isOwner || isAdmin;

    if (!hasFullAccess && req.user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: course.id,
          },
        },
      });
      hasFullAccess = !!enrollment;
    }

    if (!hasFullAccess) {
      // Strip lesson content, keep titles/structure visible
      course.modules.forEach((module) => {
        module.lessons.forEach((lesson) => {
          lesson.content = null;
          lesson.videoUrl = null;
          lesson.attachmentUrl = null;
        });
      });
    }

    res.status(200).json({
      status: "ok",
      course,
      hasFullAccess,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.params.id;
    const { title, description, price, level, thumbnailUrl, published } = req.body;

    const course = await prisma.course.findUnique({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Determine access level
    const isOwner = req.user?.id === course.instructorId;
    const isAdmin = req.user?.role === "ADMIN";

    let hasFullAccess = isOwner || isAdmin;

    if (!hasFullAccess) {
      throw new AppError("You do not have permission to update this course", 403);
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { title, description, price, level, thumbnailUrl, published },
    });

    res.status(200).json({
      status: "ok",
      course: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.params.id;
    const course = await prisma.course.findUnique({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Determine access level
    const isOwner = req.user?.id === course.instructorId;
    const isAdmin = req.user?.role === "ADMIN";

    let hasFullAccess = isOwner || isAdmin;

    if (!hasFullAccess) {
      throw new AppError("You do not have permission to delete this course", 403);
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({
      status: "ok",
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
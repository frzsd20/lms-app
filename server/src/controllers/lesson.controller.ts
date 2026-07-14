import { AppError } from '@/middleware/errorHandler';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '@/config/db';

export async function createLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {

    const user = req.user;

    if (!user) {
      throw new AppError('User not Authenticated', 401);
    }

    const module = await prisma.module.findUnique({
      where: { id: req.params.moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new AppError('Module not found', 404);
    }

    const isOwner = user.id === module.course.instructorId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to create a lesson for this module', 403);
    }

    const { title, content, videoUrl, attachmentUrl } = req.body;

    if (!title) {
      throw new AppError('Missing title fields', 400);
    }

    const totalLessons = await prisma.lesson.count({ where: { moduleId: req.params.moduleId } });
    const order = totalLessons + 1;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        attachmentUrl,
        order,
        moduleId: req.params.moduleId,
      },
    });

    res.status(201).json({
      status: "ok",
      lesson,
    });

  } catch (error) {
    next(error);
  }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('User not Authenticated', 401);
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    const isOwner = user.id === lesson.module.course.instructorId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to update a lesson for this module', 403);
    }

    const { title, content, videoUrl, attachmentUrl } = req.body;

    if (!title) {
      throw new AppError('Missing title fields', 400);
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: req.params.lessonId },
      data: {
        title,
        content,
        videoUrl,
        attachmentUrl,
      },
    });

    res.status(200).json({
      status: "ok",
      lesson: updatedLesson,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('User not Authenticated', 401);
    }
    
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    const isOwner = user.id === lesson.module.course.instructorId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to delete this lesson', 403);
    }

    await prisma.lesson.delete({
      where: { id: req.params.lessonId },
    });

    res.status(200).json({
      status: "ok",
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

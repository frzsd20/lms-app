import { AppError } from "@/middleware/errorHandler";
import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/db";

export async function updateLessonProgress(req: Request, res: Response, next: NextFunction){

    try{
        const user = req.user;

        if(!user){
            throw new AppError('User not Authenticated', 401);
        }

        const lesson = await prisma.lesson.findUnique({
            where: {
                id: req.params.lessonId
            },
            include: {
                module: true
            }
        });

        if(!lesson){
            throw new AppError("Lesson not found", 404);
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: user.id,
                    courseId: lesson.module.courseId
                }
            }
        });

        if(!enrollment){
            throw new AppError("You are not enrolled in this course", 403);
        }

        const progress = await prisma.lessonProgress.upsert({
            where: {
                studentId_lessonId: {
                    lessonId: req.params.lessonId,
                    studentId: user.id
                }
            },
            update: {
                videoPositionSeconds: req.body.videoPositionSeconds,
                completed: req.body.completed,
                completedAt: req.body.completed ? new Date() : undefined,
            },
            create: {
                studentId: user.id,
                lessonId: lesson.id,
                videoPositionSeconds: req.body.videoPositionSeconds ?? 0,
                completed: req.body.completed ?? false,
                completedAt: req.body.completed ? new Date() : null,
            }
        });

        res.status(200).json({
            status: "ok", 
            progress
        });
    }catch(error){
        next(error);
    }
}

export async function getCourseProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError("User not Authenticated", 401);
    }

    const courseId = req.params.courseId;

    const course = await prisma.course.findUnique({
      where: { id: courseId, deletedAt: null },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId: course.id,
        },
      },
    });

    if (!enrollment) {
      throw new AppError("You are not enrolled in this course", 403);
    }

    const progressRecords = await prisma.lessonProgress.findMany({
      where: {
        studentId: user.id,
        lesson: { module: { courseId: course.id } },
      },
    });

    const progressMap = new Map(
      progressRecords.map((record) => [record.lessonId, record])
    );

    const modulesWithProgress = course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      order: module.order,
      lessons: module.lessons.map((lesson) => {
        const progress = progressMap.get(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          completed: progress?.completed ?? false,
          videoPositionSeconds: progress?.videoPositionSeconds ?? 0,
        };
      }),
    }));

    const allLessons = course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter((lesson) =>
      progressMap.get(lesson.id)?.completed
    ).length;

    const progressPercent =
      totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    res.status(200).json({
      status: "ok",
      courseId: course.id,
      progressPercent,
      completedLessons,
      totalLessons,
      modules: modulesWithProgress,
    });
  } catch (error) {
    next(error);
  }
}
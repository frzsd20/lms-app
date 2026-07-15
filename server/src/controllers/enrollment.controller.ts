import { AppError } from '@/middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/db';

export async function enrollStudent(req: Request, res: Response, next: NextFunction) {
    try{
        const user = req.user;
        if(!user){
            throw new AppError('User not Authenticated', 401);
        }

        const courseId = req.params.courseId;

        if(!courseId){
            throw new AppError('Course ID is required', 400);
        }

        const course = await prisma.course.findUnique({
            where: {
                id: req.params.courseId,
                deletedAt: null,
                published: true
            },
            include: { modules: { include: { lessons: true }}, prerequisites: true }
        });

        if(!course){
            throw new AppError('Course not found', 404);
        }

        const alreadyEnrolled = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: user.id,
                    courseId: course.id
                },
            }
        });

        if(alreadyEnrolled){
            throw new AppError('You are already enrolled in this course', 409);
        }

        const prerequisiteChecks = await Promise.all(
            course.prerequisites.map(async (prereq) => {
                const [totalLessons, completedCount] = await Promise.all([
                prisma.lesson.count({
                    where: { module: { courseId: prereq.id } },
                }),
                prisma.lessonProgress.count({
                    where: {
                    studentId: user.id,
                    completed: true,
                    lesson: { module: { courseId: prereq.id } },
                    },
                }),
            ]);

            return {
                title: prereq.title,
                isComplete: completedCount >= totalLessons,
                };
            })
        );

        const incompletePrerequisites = prerequisiteChecks.filter((check) => !check.isComplete).map((check) => check.title);

        if (incompletePrerequisites.length > 0) {
            throw new AppError(
                `You must complete the following course(s) first: ${incompletePrerequisites.join(", ")}`,
                403
            );
        }

        const enrollment = await prisma.enrollment.create({
            data:{
                studentId: user.id,
                courseId: course.id
            }
        });

        res.status(201).json({
            message: "Successfully enrolled in the course",
            enrollment
        });

    } catch (error) {
        next(error);
    }
}

export async function getMyEnrollments(req: Request, res: Response, next: NextFunction){
    try{
        const user = req.user;

        if(!user){
            throw new AppError('User not Authenticated', 401);
        }

        const enrollments = await prisma.enrollment.findMany({
            where: {
                studentId: user.id
            },
            include: {
                course:{
                    select: {
                        id: true,
                        title: true,
                        thumbnailUrl: true,
                        price: true,
                        instructor: {
                            select: { id: true, name: true },
                        },
                    }
                }
            }
        });

        res.status(200).json({
            message: "Successfully retrieved all enrollments",
            enrollments
        });

    }catch (error){
        next(error)
    }
}

export async function getEnrollmentsByCourse(req: Request, res: Response, next: NextFunction){
    try{
        const user = req.user;

        if(!user){
            throw new AppError('User not authenticated', 401);
        }

        const courseId = req.params.courseId;

        if(!courseId){
            throw new AppError('Course ID is required', 400);
        }

        const course = await prisma.course.findUnique({
            where: {
                id: courseId,
                deletedAt: null
            },
            include: { enrollments: { include: { student: { select: { name: true, email: true}}}}}
        });

        if(!course){
            throw new AppError('Course not found', 404);
        }

        const isOwner = course.instructorId === user.id;
        const isAdmin = user.role === 'ADMIN';

        if(!isOwner && !isAdmin){
            throw new AppError('You are not authorized to view enrollments for this course', 403);
        }

        res.status(200).json({
            message: "Successfully retrieved all enrollments for the course",
            enrollments: course.enrollments
        });

    }catch(error){
        next(error);
    }
}
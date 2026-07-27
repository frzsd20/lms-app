import { prisma } from "@/config/db";

export async function cleanDatabase() {
  // Delete in an order that respects foreign key constraints -
  // children before parents.
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}
import app from "@/app";
import { prisma } from "@/config/db";
import request from "supertest";
import { cleanDatabase } from "./helpers/cleanDb";

describe("Enrollment - Prerequisites", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("should block enrollment until the prerequisite course is completed, then allow it", async () => {
    // Set up an instructor
    await request(app).post("/api/auth/register").send({
      name: "Instructor",
      email: "instructor@example.com",
      password: "Password123",
    });
    await prisma.user.update({
      where: { email: "instructor@example.com" },
      data: { role: "INSTRUCTOR" },
    });
    const instructorLogin = await request(app).post("/api/auth/login").send({
      email: "instructor@example.com",
      password: "Password123",
    });
    const instructorToken = instructorLogin.body.accessToken;

    // Create the prerequisite course
    const prereqCourseRes = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        title: "Prerequisite Course",
        description: "Must be completed first.",
        price: 0,
      });

    const prereqCourseId = prereqCourseRes.body.course.id;

    await request(app)
      .patch(`/api/courses/${prereqCourseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ published: true });

    const prereqModuleRes = await request(app)
      .post(`/api/courses/${prereqCourseId}/modules`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ title: "Module 1" });
    const prereqModuleId = prereqModuleRes.body.module.id;

    const prereqLessonRes = await request(app)
      .post(`/api/modules/${prereqModuleId}/lessons`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ title: "Lesson 1", content: "Some lesson content here." });
    const prereqLessonId = prereqLessonRes.body.lesson.id;

    // Create the main course, requiring the prerequisite
    const mainCourseRes = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        title: "Advanced Course",
        description: "Requires the prerequisite course first.",
        price: 0,
      });
    const mainCourseId = mainCourseRes.body.course.id;

    await request(app)
      .patch(`/api/courses/${mainCourseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ published: true });

    // Link the prerequisite directly via Prisma - no API exists for this yet
    await prisma.course.update({
      where: { id: mainCourseId },
      data: {
        prerequisites: {
          connect: { id: prereqCourseId },
        },
      },
    });

    // Set up a student (auto loggedIn after registration)
    const student = await request(app).post("/api/auth/register").send({
      name: "Student",
      email: "student@example.com",
      password: "Password123",
    });

    const studentToken = student.body.accessToken;

    // Attempt to enroll in the main course before completing the prerequisite
    const blockedResponse = await request(app)
    .post(`/api/courses/${mainCourseId}/enroll`)
    .set("Authorization", `Bearer ${studentToken}`);

    expect(blockedResponse.status).toBe(403);
    expect(blockedResponse.body.message).toContain("Prerequisite Course");

    // Enroll in and complete the prerequisite course
    await request(app)
      .post(`/api/courses/${prereqCourseId}/enroll`)
      .set("Authorization", `Bearer ${studentToken}`);

    await request(app)
      .patch(`/api/lessons/${prereqLessonId}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ completed: true });

    // Now enrollment in the main course should succeed
    const successResponse = await request(app)
      .post(`/api/courses/${mainCourseId}/enroll`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(successResponse.status).toBe(201);
    expect(successResponse.body.enrollment.courseId).toBe(mainCourseId);
  });
});
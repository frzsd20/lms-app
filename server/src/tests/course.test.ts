import app from "@/app";
import { prisma } from "@/config/db";
import request from "supertest";
import { cleanDatabase } from "./helpers/cleanDb";

describe("Courses - Create", () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it("should allow an instructor to create a course", async () => {
        await request(app).post("/api/auth/register").send({
            name: "Instructor One",
            email: "instructor@example.com",
            password: "Password123",
        });

        //Because not API available for promote to instructor
        await prisma.user.update({
            where: { email: "instructor@example.com" },
            data: { role: "INSTRUCTOR" },
        });

        const loginResponse = await request(app).post("/api/auth/login").send({
            email: "instructor@example.com",
            password: "Password123",
        });

        const token = loginResponse.body.accessToken;

        const response = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Intro to Testing",
                description: "Learn how to write backend tests properly.",
                price: 0,
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("ok");
        expect(response.body.course.title).toBe("Intro to Testing");
        expect(response.body.course.published).toBe(false);
    });

    it("should not allow an student to create a course", async () => {

        const register = await request(app).post("/api/auth/register").send({
            name: "New Student",
            email: "student@example.com",
            password: "Password123"
        });

        const token = register.body.accessToken;

        const response = await request(app).post("/api/courses")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Intro to Testing",
                description: "Learn how to write backend tests properly.",
                price: 0,
            });

        expect(response.status).toBe(403);
        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("You do not have permission to perform this action.");
    });
});

describe("Courses - Update Ownership", () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it("should reject a course update from an instructor who doesn't own it", async () => {
        // Instructor A - creates the course
        await request(app).post("/api/auth/register").send({
            name: "Instructor A",
            email: "instructorA@example.com",
            password: "Password123",
        });
        await prisma.user.update({
            where: { email: "instructorA@example.com" },
            data: { role: "INSTRUCTOR" },
        });
        const loginA = await request(app).post("/api/auth/login").send({
            email: "instructorA@example.com",
            password: "Password123",
        });
        const tokenA = loginA.body.accessToken;

        const createResponse = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({
                title: "Instructor A's Course",
                description: "A course owned by instructor A.",
                price: 0,
            });
        const courseId = createResponse.body.course.id;

        // Instructor B - tries to update it
        await request(app).post("/api/auth/register").send({
            name: "Instructor B",
            email: "instructorB@example.com",
            password: "Password123",
        });
        await prisma.user.update({
            where: { email: "instructorB@example.com" },
            data: { role: "INSTRUCTOR" },
        });
        const loginB = await request(app).post("/api/auth/login").send({
            email: "instructorB@example.com",
            password: "Password123",
        });
        const tokenB = loginB.body.accessToken;

        const response = await request(app)
            .patch(`/api/courses/${courseId}`)
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ title: "Hijacked Title" });

        expect(response.status).toBe(403);
        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("You do not have permission to update this course");
    });
});

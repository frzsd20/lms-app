import request from "supertest";
import app from "@/app";
import { cleanDatabase } from "./helpers/cleanDb";

describe("Auth - Register", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("should register a new user successfully", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("ok");
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.role).toBe("STUDENT");
  });

  it("should reject registration with a duplicate email", async () => {
    // First registration - should succeed
    await request(app).post("/api/auth/register").send({
      name: "Instructor 2",
      email: "test_in2@example.com",
      password: "Password456",
    });

    // Second registration, same email - should be rejected
    const response = await request(app).post("/api/auth/register").send({
      name: "New Instructor",
      email: "test_in2@example.com",
      password: "Password456789",
    });

    expect(response.status).toBe(409);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("An account with this email already exists");
  });
});

describe("Auth - Login", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("Login the user successfully", async () => {

    await request(app).post("/api/auth/register").send({
      name: "New Student",
      email: "test@example.com",
      password: "Password123"
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "Password123"
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.accessToken).toBeDefined();
  });

  it("should reject login with wrong password", async() => {

    await request(app).post("/api/auth/register").send({
      name: "New Instructor",
      email: "instructor@example.com",
      password: "CorrectPassword111"
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "instructor@example.com",
      password: "wrongPassword101"
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("should reject login with wrong email", async () => {

    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123"
    });

    const response = await request(app).post('/api/auth/login').send({
      email: "student@example.com",
      password: "Password123"
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Invalid email or password");
  });
});
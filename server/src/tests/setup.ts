import dotenv from "dotenv";
import path from "path";

// Force-load .env.test, overriding any already-loaded .env values
dotenv.config({ path: path.resolve(__dirname, "../../.env.test"), override: true });

import { prisma } from "@/config/db";

// Runs once after ALL test suites finish
afterAll(async () => {
  await prisma.$disconnect();
});
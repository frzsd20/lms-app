import { Router } from "express";
import { prisma } from "@/config/db";

const router = Router();

// GET /api/health - confirms the server is up and can talk to the database
router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

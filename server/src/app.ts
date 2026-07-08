import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import healthRoutes from "@/routes/health.routes";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";

const app: Application = express();

// --- Global middleware ---
app.use(helmet()); // secure HTTP headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // allows cookies (refresh tokens) to be sent
  })
);
app.use(express.json()); // parses JSON request bodies
app.use(cookieParser()); // parses cookies

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // logs each request to the console
}

// --- Routes ---
app.use("/api/health", healthRoutes);
// More routes get mounted here in later phases:
// app.use("/api/auth", authRoutes);
// app.use("/api/courses", courseRoutes);

// --- Error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

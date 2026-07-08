import { PrismaClient } from "@prisma/client";

// In dev mode, ts-node-dev restarts on every file change, which would
// normally create a new PrismaClient (and new DB connection) each time.
// Attaching it to `global` reuses the same instance across reloads.

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

import { PrismaClient } from "@prisma/client";
import { env } from "../../config/index.js";
import { logger } from "../logger/index.js";

// Helper to define log levels dynamically
const createLogLevels = () => {
  const logLevels = ["error"];
  if (env.NODE_ENV !== "production") logLevels.push("warn");
  if (env.PRISMA_LOG_QUERIES === "true") logLevels.push("query");
  return logLevels;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: createLogLevels(),
    datasources: { db: { url: env.DATABASE_URL } },
  });
};

// Global singleton (hot-reload safe)
const prisma = globalThis.prisma ?? prismaClientSingleton();

if (env.NODE_ENV !== "production") globalThis.prisma = prisma;

// Optional: expose helper functions
export const getClient = () => prisma;

export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    logger.error({ err }, "❌ DB health check failed");
    return false;
  }
}

// can be called when cleanup
export async function disconnect() {
  await prisma.$disconnect();
  logger.info("Prisma disconnected cleanly");
}

export default prisma;

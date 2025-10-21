import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { httpLogger, requestContext } from "./infra/logger/index.js";
import { env } from "./config/index.js";
import { logger } from "./infra/logger/index.js";
import container from "./container.js";
import { authRouter } from "./api/v1/auth/auth.router.js";
import { usersRouter } from "./api/v1/users/users.router.js";
import { errorHandler } from "./api/middleware/errorHandler.middleware.js";
import { authLimiter, apiLimiter } from "./api/middleware/ratelimit.middleware.js";
import { healthRouter } from "./api/v1/system/health.router.js";

const app = express();
app.set("trust proxy", 1); // if behind a proxy/CDN

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Your API Documentation",
    swaggerOptions: {
      persistAuthorization: true, // Keeps auth token after refresh
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.FRONTEND_URL ?? false, // false = block if unset
    credentials: true,
    exposedHeaders: ["X-Request-Id"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // Parse cookies

// Logging
app.use(httpLogger);
app.use(requestContext);

// Global rate limiting
app.use("/api", apiLimiter);

// Inject DI container into requests
app.use((req, res, next) => {
  req.scope = container.createScope();
  next();
});

// JSON endpoint for Swagger spec
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/healthz", healthRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
const SHUTDOWN_TIMEOUT = env.SHUTDOWN_TIMEOUT;

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  const timer = setTimeout(() => {
    logger.error("Force exiting after timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT).unref();

  server.close(async () => {
    try {
      await container.cradle.prisma.$disconnect();
      clearTimeout(timer);
      process.exit(0);
    } catch (e) {
      logger.error({ e }, "Error during shutdown");
      clearTimeout(timer);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

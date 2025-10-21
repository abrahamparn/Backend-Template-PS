import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

  // Database
  DATABASE_URL: z.string().url(),
  PRISMA_LOG_QUERIES: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Bcrypt
  BCRYPT_ROUNDS: z.string().default("10").transform(Number),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SERVICE: z.string().optional(),
  //   SMTP_SECURE: z.string().optional(),
  //   SMTP_POOL: z.string().optional(),
  //   SMTP_MAX_CONNECTIONS: z.string().optional(),
  //   SMTP_MAX_MESSAGES: z.string().optional(),
  //   SMTP_VERIFY_ON_BOOT: z.string().optional(),
  //   SMTP_CONN_TIMEOUT_MS: z.string().optional(),
  //   SMTP_GREET_TIMEOUT_MS: z.string().optional(),
  //   SMTP_SOCKET_TIMEOUT_MS: z.string().optional(),
  //   SMTP_TLS_REJECT_UNAUTHORIZED: z.string().optional(),
  //   EMAIL_FROM: z.string().email().optional(),

  // File upload
  MAX_FILE_SIZE: z.string().default("5242880").transform(Number), // 5MB

  // URLs
  FRONTEND_URL: z.string().url().optional(),

  // Cookie settings
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  SHUTDOWN_TIMEOUT: z.string().default("10000").transform(Number),
  APP_URL: z.string(),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error("❌  Invalid environment variables:\n", _env.error.format());
  process.exit(1);
}

export const env = _env.data;

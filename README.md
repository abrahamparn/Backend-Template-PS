# Node.js Clean Architecture Template - Project Setup Guide

## Building Enterprise-Grade REST APIs with Node.js + Express + Prisma

**Template Version**: 1.0  
**Last Updated**: October 13, 2025

> **Note**: This is a project-agnostic template. This is just a foundational template.

> **Not**: if you think specific parts need to be documented, please add a .md documentation at /Guide. Thank you

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why This Architecture?](#why-this-architecture)
3. [Architecture Philosophy](#architecture-philosophy)
4. [Project Setup from Scratch](#project-setup-from-scratch)
5. [Project Structure](#project-structure)
6. [Core Implementation Guide](#core-implementation-guide)
7. [API Documentation with Swagger](#api-documentation-with-swagger)

---

## Introduction

This guide will help you build a structured Node.js REST API using Clean Architecture principles.

### Tech Stack

- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 14+ with Prisma ORM 5.x
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod 3.x
- **Logging**: Pino + Pino-HTTP
- **DI Container**: Awilix 12.x
- **Image Processing**: Sharp
- **Security**: Helmet, CORS, bcrypt, express-rate-limit
- **Documentation**: Swagger JSDoc + Swagger UI Express
- **Testing**: Jest + Supertest

### Prerequisites

Before starting, ensure you have:

- **Node.js 18.x or higher** installed ([Download](https://nodejs.org/))
- **PostgreSQL 14.x or higher** installed and running
- **npm 9.x or higher** (comes with Node.js)
- A code editor (VS Code recommended)

---

## Why This Architecture?

### The Problem with Monolithic Code

Many Node.js projects start simple but become unmaintainable as they grow:

### The Clean Architecture Solution

```javascript
// Route handler (thin, just HTTP concerns)
router.post("/", validate(createUserSchema), async (req, res, next) => {
  try {
    const userService = req.scope.resolve("userService");
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error); // Centralized error handling
  }
});

// Service (business logic, reusable)
export function makeUserService({ userRepository, mailerService, logger }) {
  return {
    async createUser(data) {
      // Business validation
      const existing = await userRepository.findByEmail(data.email);
      if (existing) throw new ConflictError("Email already in use");

      // Create user
      const user = await userRepository.create(data);

      // Send email (can be mocked in tests)
      await mailerService.sendEmail({
        to: user.email,
        subject: "Welcome!",
        html: `<p>Welcome ${user.name}!</p>`,
      });

      logger.info({ userId: user.id }, "User created");
      return user;
    },
  };
}
```

**Benefits:**

- Easy to test (mock dependencies)
- Easy to reuse (call service from anywhere)
- Easy to maintain (business logic in one place)
- Easy to scale (loose coupling, swap implementations)

### Key Principles Explained

1. **Separation of Concerns**: Each layer has one job
   - Controllers handle HTTP requests/responses
   - Services contain business logic
   - Repositories handle data access
   - Infrastructure handles external services

2. **Dependency Injection**: Dependencies are injected, not imported
   - Makes testing easier (inject mocks)
   - Makes swapping implementations easier
   - Makes dependencies explicit

3. **Factory Pattern**: Use functions to create objects
   - Better than classes for dependency injection
   - More functional programming style
   - Easier to understand

4. **Error Handling**: Centralized and consistent
   - All errors go through one handler
   - Consistent error format
   - No leaked stack traces in production

---

## Architecture Philosophy

### The Four Layers

```
┌─────────────────────────────────────────────────────┐
│           API Layer (HTTP Interface)                │
│  • Express routes and controllers                   │
│  • Request/response handling                        │
│  • Middleware (auth, validation, error handling)    │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│        Service Layer (Business Logic)               │
│  • Domain business rules                            │
│  • Orchestrates repositories                        │
│  • Business validations                             │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│      Repository Layer (Data Access)                 │
│  • Database queries (Prisma)                        │
│  • Data mapping                                     │
│  • Query optimization                               │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│    Infrastructure Layer (External Services)         │
│  • Database connection                              │
│  • Email service                                    │
│  • File storage                                     │
│  • Third-party APIs                                 │
└─────────────────────────────────────────────────────┘
```

### Key Principles

1. **Dependency Inversion**: High-level modules don't depend on low-level modules
2. **Single Responsibility**: Each class/function has one reason to change
3. **Factory Pattern**: Services and repositories created via factory functions
4. **Scoped Injection**: Each request gets its own DI scope with user context

---

## Project Setup from Scratch

### Step 1: Initialize Project

```bash
# Create project directory
mkdir my-awesome-api
cd my-awesome-api

# Initialize npm project
npm init -y

# Configure ES modules
npm pkg set type="module"

# Set Node version (optional)
echo "18.0.0" > .nvmrc
```

### Step 2: Install Core Dependencies

```bash
# Core framework
npm install express

# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication & Security
npm install jsonwebtoken bcrypt
npm install helmet cors express-rate-limit

# Validation
npm install zod

# Logging
npm install pino pino-http pino-pretty

# Dependency Injection
npm install awilix

# File handling
npm install multer sharp

# Email
npm install nodemailer

# Utilities
npm install dotenv uuid
```

### Step 3: Install Dev Dependencies

```bash
# Development tools
npm install -D nodemon

# Testing
npm install -D jest supertest @types/jest

# Code quality
npm install -D eslint prettier eslint-config-prettier

# API Documentation
npm install swagger-jsdoc swagger-ui-express
```

### Step 4: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "NODE_ENV=development nodemon src/server.js",
    "start": "NODE_ENV=production node src/server.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "node prisma/seed.js",
    "db:studio": "prisma studio",
    "test": "NODE_ENV=test jest --watchAll",
    "test:ci": "NODE_ENV=test jest --ci",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

### Step 5: Create Project Structure

```bash
# Create directory structure
mkdir -p src/{api/{middleware,v1},config,core/{errors,repositories,services},infra/{db,logger,mailer,security}}
mkdir -p prisma/migrations
mkdir -p uploads/{temp,profile-pictures}
mkdir -p tests/{unit,integration}

# Create initial files
touch src/server.js
touch src/container.js
touch src/config/index.js
touch prisma/schema.prisma
touch prisma/seed.js
touch .env.example
touch .env
touch .gitignore
```

### Step 6: Create .gitignore

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Environment
.env
.env.local

# Logs
logs/
*.log

# Uploads
uploads/
!uploads/.gitkeep

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/

# Build
dist/
build/
EOF
```

---

## Project Structure

```
my-awesome-api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.js               # Initial data
│   └── migrations/           # Migration history
├── src/
│   ├── server.js             # App entry point
│   ├── container.js          # DI configuration
│   ├── api/
│   │   ├── middleware/       # Custom middleware
│   │   │   ├── authorization.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   └── upload.middleware.js
│   │   └── v1/               # API version 1
│   │       ├── auth/
│   │       │   ├── auth.router.js
│   │       │   ├── auth.controller.js
│   │       │   └── auth.validator.js
│   │       └── users/
│   │           ├── users.router.js
│   │           ├── users.controller.js
│   │           └── users.validator.js
│   ├── config/
│   │   └── index.js          # Environment validation
|   ├── utils/
│   ├── core/
│   │   ├── errors/
│   │   │   └── httpErrors.js # Custom error classes
│   │   ├── repositories/
│   │   │   ├── auth.repository.js
│   │   │   └── user.repository.js
│   │   └── services/
│   │       ├── auth.service.js
│   │       └── user.service.js
│   └── infra/
│       ├── db/
│       │   └── index.js      # Prisma client
│       ├── logger/
│       │   └── index.js      # Pino logger
│       ├── mailer/
│       │   └── index.js      # Email service
│       └── security/
│           └── auth.middleware.js
├── tests/
│   ├── unit/
│   └── integration/
├── uploads/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Core Implementation Guide

### 1. Environment Configuration

**`src/config/index.js`**

```javascript
// With this, if you tried to run the project and one of the data is missing,
// it will directly throw and error so that there will be no fractured api calls.
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),

  // Database
  DATABASE_URL: z.string().url(),

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

  // File upload
  MAX_FILE_SIZE: z.string().default("5242880").transform(Number), // 5MB

  // URLs
  FRONTEND_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

**`.env.example`**

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_ROUNDS=10

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880

# Frontend
FRONTEND_URL=http://localhost:3001
```

### 2. Database Setup (Prisma)

**`prisma/schema.prisma`**

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model with improved relations and field names
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  username          String    @unique
  name              String
  profilePictureUrl String?   @map("profile_picture_url")
  phoneNumber       String?   @map("phone_number")
  passwordHash      String    @map("password_hash")
  role              Role      @default(USER)
  status            Status    @default(ACTIVE)

  // Timestamps
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  lastLoginAt       DateTime? @map("last_login_at")
  emailVerifiedAt   DateTime? @map("email_verified_at") // Replaces verifiedEmail/verifiedUser booleans

  // Auth & Versioning
  refreshTokenHash    String?   @unique @map("refresh_token_hash")
  refreshTokenVersion Int       @default(0) @map("refresh_token_version") // Renamed for clarity

  // OTP
  otpCode      String?   @map("otp_code")
  otpExpiresAt DateTime? @map("otp_expires_at")
  otpVersion   Int       @default(0) @map("otp_version")

  // Password Reset
  passwordResetToken   String?   @unique @map("password_reset_token")
  passwordResetExpires DateTime? @map("password_reset_expires_at")

  // Soft Delete
  deletedAt       DateTime? @map("deleted_at")
  deletedByUserId String?   @map("deleted_by_user_id")
  deletedBy       User?     @relation("UsersDeletedBy", fields: [deletedByUserId], references: [id], onDelete: SetNull)

  // Audit Trail - Who updated this user?
  updatedByUserId String?   @map("updated_by_user_id")
  updatedBy       User?     @relation("UsersUpdatedBy", fields: [updatedByUserId], references: [id], onDelete: SetNull)

  // Relations to track actions performed BY this user
  // These fields replace the problematic `deletedUsers` and `updatedUsers` lists
  actionsAsDeleter  User[]    @relation("UsersDeletedBy")
  actionsAsUpdater  User[]    @relation("UsersUpdatedBy")
  logsAsActor       UserLog[] @relation("LogsByActor")

  // Relation to logs ABOUT this user
  logsAboutUser UserLog[] @relation("LogsAboutTargetUser")

  @@map("users")
  @@index([email])
  @@index([username])
  @@index([status])
}

// UserLog model with proper relations and structure
model UserLog {
  id          String         @id @default(uuid())
  action      UserActionType // What action was performed?
  changedData Json?          @map("changed_data") // Use JSON for structured change data

  // Who performed the action?
  actorId     String?        @map("actor_id")
  actor       User?          @relation("LogsByActor", fields: [actorId], references: [id], onDelete: SetNull)

  // Which user was this action about?
  targetUserId String         @map("target_user_id")
  targetUser   User           @relation("LogsAboutTargetUser", fields: [targetUserId], references: [id], onDelete: Cascade)

  // Timestamp
  createdAt   DateTime       @default(now()) @map("created_at")

  @@map("user_logs")
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

enum Status {
  ACTIVE
  INACTIVE
  // The DELETED status is often redundant when using a soft-delete pattern (deletedAt).
  // Consider removing it unless you have a specific use case for it alongside soft-deleting.
  DELETED
}

// Enum for tracking specific actions in the log
enum UserActionType {
  USER_CREATED
  USER_UPDATED_PROFILE
  USER_UPDATED_ROLE
  USER_UPDATED_STATUS
  PASSWORD_RESET_REQUESTED
  PASSWORD_RESET_COMPLETED
  PASSWORD_CHANGED
  EMAIL_VERIFIED
  USER_SOFT_DELETED
  USER_RESTORED
}
```

**Initialize Prisma:**

```bash
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Infrastructure Layer

**`src/infra/db/index.js`** - Prisma Client

```javascript
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

// Factory function for Prisma client
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
    logger.error({ err }, "DB health check failed");
    return false;
  }
}

export async function disconnect() {
  await prisma.$disconnect();
  logger.info("Prisma disconnected cleanly");
}

export default prisma;
```

**`src/infra/logger/index.js`** - Pino Logger

```javascript
// src/logger/index.js
import pino from "pino";
import { pinoHttp } from "pino-http";
import { AsyncLocalStorage } from "node:async_hooks";
import { v4 as uuid } from "uuid";
import { env } from "../../config/index.js";

const als = new AsyncLocalStorage();

export const logger = pino({
  level: env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug"),
  base: null, // omit pid/hostname for cleaner logs
  timestamp: pino.stdTimeFunctions.isoTime, // consistent ISO timestamps
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.pass",
      "req.body.token",
      "res.headers.set-cookie",
    ],
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

// Helper: get or create a request id (prefer upstream)
function resolveReqId(req) {
  return (
    req.headers["x-request-id"] ||
    req.headers["x-correlation-id"] ||
    req.id || // added by some frameworks
    uuid()
  );
}

export const httpLogger = pinoHttp({
  logger,
  // Make req/res objects compact but useful
  serializers: {
    err: pino.stdSerializers.err,
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.socket?.remoteAddress,
        userAgent: req.headers["user-agent"],
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  genReqId: (req, res) => {
    const id = resolveReqId(req);
    // expose to client for correlation
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  // cut noise from health checks, etc.
  autoLogging: {
    ignorePaths: ["/health", "/healthz", "/metrics"],
  },
  // nice success line with timing
  customSuccessMessage: function (req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
});

export const requestContext = (req, _res, next) => {
  // ensure req.id exists (pino-http sets it)
  const reqId = req.id || resolveReqId(req);
  const child = logger.child({ reqId });

  // store both id and a child logger bound to this request
  als.run(
    new Map([
      ["reqId", reqId],
      ["logger", child],
    ]),
    next
  );
};

// Fetch the current request id anywhere
export const getReqId = () => als.getStore()?.get("reqId");

// Get a bound logger anywhere (falls back to base logger)
export const getLogger = () => als.getStore()?.get("logger") || logger;
```

**`src/infra/mailer/index.js`** - Email Service

```javascript
// src/services/mailer.js
import nodemailer from "nodemailer";
import { env as appEnv } from "../../config/index.js";

/**
 * Parse & normalize config once (avoid raw env usage in core logic)
 */
function buildMailerConfig(env = appEnv) {
  const port = Number(env.SMTP_PORT || 587);
  const secure = env.SMTP_SECURE ? String(env.SMTP_SECURE).toLowerCase() === "true" : port === 465; // 465 usually needs secure: true

  return {
    host: env.SMTP_HOST,
    port,
    secure,
    service: env.SMTP_SERVICE || undefined, // optional; leave undefined if using host/port
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    pool: String(env.SMTP_POOL || "true").toLowerCase() === "true",
    maxConnections: Number(env.SMTP_MAX_CONNECTIONS || 5),
    maxMessages: Number(env.SMTP_MAX_MESSAGES || 100),
    connectionTimeout: Number(env.SMTP_CONN_TIMEOUT_MS || 30_000),
    greetingTimeout: Number(env.SMTP_GREET_TIMEOUT_MS || 10_000),
    socketTimeout: Number(env.SMTP_SOCKET_TIMEOUT_MS || 30_000),
    tls: {
      // In prod we normally keep strict TLS on. Allow override for lab envs.
      rejectUnauthorized:
        env.SMTP_TLS_REJECT_UNAUTHORIZED === undefined
          ? true
          : String(env.SMTP_TLS_REJECT_UNAUTHORIZED).toLowerCase() === "true",
    },
    defaultFrom: env.EMAIL_FROM || env.SMTP_USER, // fallback
    verifyOnBoot: String(env.SMTP_VERIFY_ON_BOOT || "true").toLowerCase() === "true",
    maxRetries: Number(env.SMTP_MAX_RETRIES || 3),
    backoffMs: Number(env.SMTP_RETRY_BACKOFF_MS || 500), // base backoff
    nodeEnv: env.NODE_ENV || "development",
  };
}

/**
 * Decide if error is transient (worth retrying).
 * You can expand this map as you meet providers.
 */
function isTransientSmtpError(err) {
  const code = err?.code || err?.responseCode;
  // Common transient patterns: 421 (Service not available), 451/452 (local failures)
  if (code === 421 || code === 451 || code === 452) return true;
  // Network issues
  if (err?.code === "ETIMEDOUT" || err?.code === "ECONNECTION" || err?.code === "EAI_AGAIN")
    return true;
  return false;
}

/**
 * Create the mailer service.
 * @param {{ logger: {info:Function, error:Function, warn?:Function}, transporter?: nodemailer.Transporter, env?: any }} deps
 */
export function makeMailerService({ logger, transporter: injectedTransporter, env } = {}) {
  const cfg = buildMailerConfig(env);

  // Validate minimal config early (fail fast)
  for (const key of ["host", "auth.user", "auth.pass"]) {
    const val = key === "host" ? cfg.host : key === "auth.user" ? cfg.auth.user : cfg.auth.pass;
    if (!val && !cfg.service) {
      throw new Error(`Mailer config invalid: missing ${key} (or provide SMTP_SERVICE)`);
    }
  }

  const transporter =
    injectedTransporter ||
    nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      service: cfg.service, // if provided, nodemailer will prefer it
      auth: cfg.auth,
      pool: cfg.pool,
      maxConnections: cfg.maxConnections,
      maxMessages: cfg.maxMessages,
      connectionTimeout: cfg.connectionTimeout,
      greetingTimeout: cfg.greetingTimeout,
      socketTimeout: cfg.socketTimeout,
      tls: cfg.tls,
    });

  // Optional verification at boot (useful to fail early in non-serverless)
  if (cfg.verifyOnBoot) {
    transporter
      .verify()
      .then(() =>
        logger.info({ host: cfg.host, service: cfg.service }, "Mailer verified and ready")
      )
      .catch((err) => {
        logger.error({ err }, "Mailer verification failed");
        // In strict environments you may want to throw here:
        if (cfg.nodeEnv === "production") {
          // throw err; // Uncomment if you want hard fail at boot in prod
        }
      });
  }

  /**
   * Send an email with retries on transient failures.
   * @param {{ to: string|string[], subject: string, html?: string, text?: string, cc?: string|string[], bcc?: string|string[], replyTo?: string, attachments?: Array<any>, headers?: Record<string,string> }} opts
   * @returns {Promise<{messageId: string, accepted: string[], rejected: string[]}>}
   */
  async function sendEmail(opts) {
    const { to, subject, html, text, cc, bcc, replyTo, attachments, headers } = opts;

    if (!to || !subject) {
      throw new Error("sendEmail requires at least { to, subject }");
    }

    // Provide a plain-text fallback when only HTML is supplied (some MTAs prefer it)
    const textFallback =
      text ||
      (html
        ? html
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .trim()
        : undefined);

    const mailOptions = {
      from: cfg.defaultFrom,
      to,
      subject,
      html,
      text: textFallback,
      cc,
      bcc,
      replyTo,
      attachments,
      headers,
    };

    let attempt = 0;
    // Simple exponential backoff
    while (true) {
      try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(
          {
            to,
            subject,
            messageId: info?.messageId,
            accepted: info?.accepted,
            rejected: info?.rejected,
          },
          "Email sent"
        );
        return {
          messageId: info?.messageId,
          accepted: info?.accepted || [],
          rejected: info?.rejected || [],
        };
      } catch (err) {
        attempt += 1;
        const shouldRetry = attempt < cfg.maxRetries && isTransientSmtpError(err);
        logger.error(
          { err, to, subject, attempt, maxRetries: cfg.maxRetries, willRetry: shouldRetry },
          "Email send failed"
        );
        if (!shouldRetry) throw err;
        const delay = cfg.backoffMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  return { sendEmail, transporter }; // exporter transporter for health/metrics if you want
}
```

### 4. Custom Error Classes

**`src/core/errors/httpErrors.js`**

```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}
```

### 5. Repository Layer

**`src/core/repositories/user.repository.js`**

```javascript
export function makeUserRepository({ prisma }) {
  return {
    async findById(id) {
      return prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });
    },

    async findByEmail(email) {
      return prisma.user.findUnique({
        where: { email },
      });
    },

    async findByUsername(username) {
      return prisma.user.findUnique({
        where: { username },
      });
    },

    async findMany({ page = 1, limit = 10, search = "" }) {
      const skip = (page - 1) * limit;
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
            ],
            status: { not: "DELETED" },
          }
        : { status: { not: "DELETED" } };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return { users, total, page, limit };
    },

    async create(data) {
      return prisma.user.create({
        data,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          status: true,
        },
      });
    },

    async update(id, data) {
      return prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          status: true,
        },
      });
    },

    async delete(id, deletedByUserId) {
      return prisma.user.update({
        where: { id },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
          deletedByUserId,
        },
      });
    },
  };
}
```

### 6. Service Layer

**`src/core/services/auth.service.js`**

```javascript
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UnauthorizedError, NotFoundError } from "../errors/httpErrors.js";

export function makeAuthService({ userRepository, env, logger }) {
  return {
    async login({ username, password }) {
      const user = await userRepository.findByUsername(username);

      if (!user || user.status === "DELETED") {
        throw new UnauthorizedError("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials");
      }

      if (user.status !== "ACTIVE") {
        throw new UnauthorizedError("Account is not active");
      }

      const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
      });

      const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      });

      // Hash refresh token before storing
      const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

      await userRepository.update(user.id, {
        refreshTokenHash,
        lastLoginAt: new Date(),
      });

      logger.info({ userId: user.id }, "User logged in");

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      };
    },

    async refreshToken({ refreshToken }) {
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      } catch (error) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const user = await userRepository.findById(decoded.userId);
      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

      if (user.refreshTokenHash !== hashedToken) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
      });

      return { accessToken: newAccessToken };
    },

    async logout({ userId }) {
      await userRepository.update(userId, {
        refreshTokenHash: null,
      });
      logger.info({ userId }, "User logged out");
    },
  };
}
```

**`src/core/services/user.service.js`**

```javascript
import bcrypt from "bcrypt";
import { ConflictError, NotFoundError } from "../errors/httpErrors.js";

export function makeUserService({ userRepository, env, logger, mailerService }) {
  return {
    async getUsers(options) {
      return userRepository.findMany(options);
    },

    async getUserById(id) {
      const user = await userRepository.findById(id);
      if (!user || user.status === "DELETED") {
        throw new NotFoundError("User not found");
      }
      return user;
    },

    async createUser(data) {
      const existingEmail = await userRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictError("Email already in use");
      }

      const existingUsername = await userRepository.findByUsername(data.username);
      if (existingUsername) {
        throw new ConflictError("Username already in use");
      }

      const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

      const user = await userRepository.create({
        ...data,
        passwordHash,
        password: undefined,
      });

      logger.info({ userId: user.id }, "User created");

      // Send welcome email (optional)
      if (mailerService) {
        await mailerService
          .sendEmail({
            to: user.email,
            subject: "Welcome!",
            html: `<p>Welcome ${user.name}! Your account has been created.</p>`,
          })
          .catch((err) => logger.error({ err }, "Failed to send welcome email"));
      }

      return user;
    },

    async updateUser(id, data) {
      const user = await this.getUserById(id);

      if (data.email && data.email !== user.email) {
        const existing = await userRepository.findByEmail(data.email);
        if (existing) throw new ConflictError("Email already in use");
      }

      if (data.username && data.username !== user.username) {
        const existing = await userRepository.findByUsername(data.username);
        if (existing) throw new ConflictError("Username already in use");
      }

      if (data.password) {
        data.passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
        delete data.password;
      }

      return userRepository.update(id, data);
    },

    async deleteUser(id, deletedByUserId) {
      await this.getUserById(id);
      return userRepository.delete(id, deletedByUserId);
    },
  };
}
```

### 7. Middleware

**`src/infra/security/auth.middleware.js`** - JWT Verification

```javascript
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../../core/errors/httpErrors.js";
import { env } from "../../config/index.js";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      next(new UnauthorizedError("Invalid token"));
    } else if (error.name === "TokenExpiredError") {
      next(new UnauthorizedError("Token expired"));
    } else {
      next(error);
    }
  }
};
```

**`src/api/middleware/authorization.middleware.js`** - Role-based Access

```javascript
import { ForbiddenError } from "../../core/errors/httpErrors.js";

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
};
```

**`src/api/middleware/validate.middleware.js`** - Zod Validation

```javascript
// src/api/middleware/validate.middleware.js
import { ZodError } from "zod";
import { AppError } from "../../core/errors/appError.js"; // your helper (name as you wish)

/**
 * validate(schema, opts)
 * schema: Zod schema for { body?, query?, params? } (any subset)
 * opts:
 *  - assign: boolean (default false) -> if true, override req.body/query/params with parsed
 *  - statusCode: number (default 422) -> HTTP status for validation failures
 *  - mapDetails: (issue) => any (optional custom mapper)
 */
export const validate = (schema, opts = {}) => {
  const {
    assign = false,
    statusCode = 422,
    mapDetails, // optional custom detail mapper
  } = opts;

  return async (req, _res, next) => {
    // Build input only with fields the schema expects
    const input = {};
    if ("shape" in schema && schema.shape) {
      if (schema.shape.body !== undefined) input.body = req.body;
      if (schema.shape.query !== undefined) input.query = req.query;
      if (schema.shape.params !== undefined) input.params = req.params;
    } else {
      // Fallback: assume full envelope
      input.body = req.body;
      input.query = req.query;
      input.params = req.params;
    }

    const result = await schema.safeParseAsync(input);

    if (result.success) {
      // expose parsed values without surprising others
      req.validated = result.data;
      if (assign) {
        if (result.data.body !== undefined) req.body = result.data.body;
        if (result.data.query !== undefined) req.query = result.data.query;
        if (result.data.params !== undefined) req.params = result.data.params;
      }
      return next();
    }

    // Map Zod issues to stable details
    const details = result.error.issues.map((i) => {
      const base = {
        path: Array.isArray(i.path) ? i.path.join(".") : String(i.path ?? ""),
        message: i.message,
        code: i.code, // e.g., invalid_type, too_small, custom, etc.
      };
      // Include expected/received when available (invalid_type)
      if (i.expected !== undefined) base.expected = i.expected;
      if (i.received !== undefined) base.received = i.received;
      // Include min/max where useful (too_small/too_big)
      if (i.minimum !== undefined) base.minimum = i.minimum;
      if (i.maximum !== undefined) base.maximum = i.maximum;
      if (mapDetails) return mapDetails(i, base);
      return base;
    });

    // Bubble to your centralized error handler
    return next(
      new AppError("Validation Error", {
        statusCode,
        code: "VALIDATION_ERROR",
        isOperational: true,
        details,
      })
    );
  };
};
```

**Error Handler Middleware:**

```javascript
// src/api/middleware/errorHandler.middleware.js
export const errorHandler = (err, req, res, next) => {
  const { logger } = req.scope.cradle;

  logger.error(
    {
      err,
      url: req.url,
      method: req.method,
      userId: req.user?.userId,
    },
    "Request error"
  );

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
```

### 8. API Layer (Controllers & Routes)

**`src/api/v1/auth/auth.validator.js`**

```javascript
import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});
```

**`src/api/v1/auth/auth.controller.js`**

```javascript
export default {
  async login(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const result = await authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const result = await authService.refreshToken(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      await authService.logout({ userId: req.user.userId });
      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  },
};
```

**`src/api/v1/auth/auth.router.js`**

```javascript
import express from "express";
import authController from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { loginSchema, refreshTokenSchema } from "./auth.validator.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);
router.post("/logout", authMiddleware, authController.logout);

export { router as authRouter };
```

**`src/api/v1/users/users.controller.js`**

```javascript
export default {
  async getUsers(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      const result = await userService.getUsers(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      await userService.deleteUser(req.params.id, req.user.userId);
      res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
      next(error);
    }
  },
};
```

**`src/api/v1/users/users.router.js`**

```javascript
import express from "express";
import usersController from "./users.controller.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { authorize } from "../../middleware/authorization.middleware.js";

const router = express.Router();

router.use(authMiddleware); // All routes require authentication

router.get("/", usersController.getUsers);
router.get("/:id", usersController.getUserById);
router.post("/", authorize(["ADMIN", "SUPER_ADMIN"]), usersController.createUser);
router.patch("/:id", authorize(["ADMIN", "SUPER_ADMIN"]), usersController.updateUser);
router.delete("/:id", authorize(["SUPER_ADMIN"]), usersController.deleteUser);

export { router as usersRouter };
```

### 9. Dependency Injection Container

**`src/container.js`**

```javascript
import { createContainer, asFunction, asValue } from "awilix";
import prisma from "./infra/db/index.js";
import logger from "./infra/logger/index.js";
import { env } from "./config/index.js";
import { makeMailerService } from "./infra/mailer/index.js";
import { makeAuthService } from "./core/services/auth.service.js";
import { makeUserService } from "./core/services/user.service.js";
import { makeUserRepository } from "./core/repositories/user.repository.js";

const container = createContainer();

// Register infrastructure
container.register({
  prisma: asValue(prisma),
  logger: asValue(logger),
  env: asValue(env),
});

// Register services
container.register({
  mailerService: asFunction(makeMailerService).singleton(),
  authService: asFunction(makeAuthService).singleton(),
  userService: asFunction(makeUserService).singleton(),
});

// Register repositories
container.register({
  userRepository: asFunction(makeUserRepository).singleton(),
});

export default container;
```

### 10. Express Server Setup

**`src/server.js`**

```javascript
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { httpLogger, requestContext } from "./infra/logger/index.js";
import { env } from "./config/index.js";
import logger from "./infra/logger/index.js";
import container from "./container.js";
import { authRouter } from "./api/v1/auth/auth.router.js";
import { usersRouter } from "./api/v1/users/users.router.js";
import { errorHandler } from "./api/middleware/errorHandler.middleware.js";

const app = express();

import rateLimit from "express-rate-limit";
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Logging
app.use(httpLogger);
app.use(requestContext);

// Inject DI container into requests
app.use((req, res, next) => {
  req.scope = container.createScope();
  next();
});

// Health check
app.get("/api/v1/healthz", async (req, res) => {
  const { prisma } = container.cradle;

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

// API routes
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/users", usersRouter);

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
  logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
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
```

---

## API Documentation with Swagger

### Why Swagger?

**The Problem Without Documentation:**

- Frontend developers constantly asking "What's the endpoint?"
- "What fields do I need to send?"
- "What's the response format?"
- Outdated Postman collections
- Manual API testing is tedious

**The Solution: Swagger/OpenAPI**

- Interactive API documentation
- Test endpoints directly in browser
- Auto-generated from code comments
- Always up-to-date
- Standard format (OpenAPI 3.0)

### Step 1: Install Dependencies

Already installed in Step 3, but if not:

```bash
npm install swagger-jsdoc swagger-ui-express
```

### Step 2: Create Swagger Configuration

**`src/config/swagger.config.js`**

```javascript
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./index.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your API Name",
      version: "1.0.0",
      description: "A production-ready REST API built with Node.js, Express, and Prisma",
      contact: {
        name: "API Support",
        email: "support@yourapi.com",
        url: "https://yourapi.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url:
          env.NODE_ENV === "production"
            ? "https://api.yourapp.com"
            : `http://localhost:${env.PORT}`,
        description: env.NODE_ENV === "production" ? "Production server" : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: "The specified resource was not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "Resource not found" },
                },
              },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "Validation Error" },
                  details: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        path: { type: "string", example: "body.email" },
                        message: { type: "string", example: "Invalid email format" },
                        code: { type: "string", example: "invalid_string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication and authorization endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Health",
        description: "System health and status endpoints",
      },
    ],
  },
  // Paths to files containing JSDoc comments
  apis: ["./src/api/v1/**/*.router.js", "./src/api/v1/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
```

### Step 3: Add Swagger Route to Server

**Update `src/server.js`:**

```javascript
import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config.js";
// ... other imports

const app = express();

// ... security middleware

// Swagger Documentation (before other routes)
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

// JSON endpoint for Swagger spec
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ... rest of your routes
```

### Step 4: Document Your Endpoints

#### Health Check Example

**`src/api/v1/system/health.router.js`:**

```javascript
import express from "express";

const router = express.Router();

/**
 * @swagger
 * /api/v1/healthz:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and database connection
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-10-13T10:30:00.000Z
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                   description: Server uptime in seconds
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 database:
 *                   type: string
 *                   example: disconnected
 */
router.get("/", async (req, res) => {
  const { prisma } = req.scope.cradle;

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

export { router as healthRouter };
```

#### Authentication Endpoints

**`src/api/v1/auth/auth.router.js`:**

```javascript
import express from "express";
import authController from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { loginSchema, refreshTokenSchema } from "./auth.validator.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           example: johndoe
 *           description: User's username
 *         password:
 *           type: string
 *           minLength: 1
 *           example: SecurePass123!
 *           description: User's password
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             refreshToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: 123e4567-e89b-12d3-a456-426614174000
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: john@example.com
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 role:
 *                   type: string
 *                   enum: [USER, ADMIN, SUPER_ADMIN]
 *                   example: USER
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return access and refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate the user's refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/logout", authMiddleware, authController.logout);

export { router as authRouter };
```

#### User Management Endpoints

**`src/api/v1/users/users.router.js`:**

```javascript
import express from "express";
import usersController from "./users.controller.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { authorize } from "../../middleware/authorization.middleware.js";

const router = express.Router();

router.use(authMiddleware); // All routes require authentication

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         username:
 *           type: string
 *           example: johndoe
 *         name:
 *           type: string
 *           example: John Doe
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, SUPER_ADMIN]
 *           example: USER
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, DELETED]
 *           example: ACTIVE
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-13T10:30:00.000Z
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: 2025-10-13T12:00:00.000Z
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a paginated list of users with optional search
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or username
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", usersController.getUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/:id", usersController.getUserById);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create new user
 *     description: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: newuser
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: New User
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123!
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, SUPER_ADMIN]
 *                 default: USER
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: Email or username already exists
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/", authorize(["ADMIN", "SUPER_ADMIN"]), usersController.createUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Update user
 *     description: Update user information (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, SUPER_ADMIN]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch("/:id", authorize(["ADMIN", "SUPER_ADMIN"]), usersController.updateUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Soft delete a user (Super Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete("/:id", authorize(["SUPER_ADMIN"]), usersController.deleteUser);

export { router as usersRouter };
```

### Step 5: Access Your Documentation

1. **Start your server:**

   ```bash
   npm run dev
   ```

2. **Open in browser:**

   ```
   http://localhost:3000/api-docs
   ```

3. **You'll see:**
   - Interactive API documentation
   - All endpoints organized by tags
   - Try-it-out functionality
   - Request/response examples
   - Schema definitions

### Step 6: How to Use Swagger UI

#### Testing Authentication

1. **Click on the "Auth" section**
2. **Click on "POST /api/v1/auth/login"**
3. **Click "Try it out"**
4. **Enter credentials:**
   ```json
   {
     "username": "admin",
     "password": "password123"
   }
   ```
5. **Click "Execute"**
6. **Copy the `accessToken` from the response**
7. **Click the "Authorize" button at the top**
8. **Enter: `Bearer <your-access-token>`**
9. **Click "Authorize"**

Now all subsequent requests will include this token!

#### Testing Protected Endpoints

1. **After authorizing, go to "Users" section**
2. **Click "GET /api/v1/users"**
3. **Click "Try it out"**
4. **Optionally set parameters (page, limit, search)**
5. **Click "Execute"**
6. **See the response**

### Swagger Best Practices

#### 1. Use Reusable Schemas

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     PaginationParams:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 */
```

#### 2. Document All Possible Responses

```javascript
/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
```

#### 3. Include Examples

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "MacBook Pro"
 *         price: 1299.99
 *         stock: 50
 */
```

#### 4. Group Related Endpoints

```javascript
/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management endpoints
 *   - name: Orders
 *     description: Order management endpoints
 */
```

### Exporting Swagger Spec

Generate a static OpenAPI spec file:

```javascript
// scripts/generate-swagger.js
import fs from "fs";
import { swaggerSpec } from "../src/config/swagger.config.js";

fs.writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));
console.log("Swagger spec generated at ./swagger.json");
```

Run it:

```bash
node scripts/generate-swagger.js
```

This file can be:

- Imported into Postman
- Used by code generation tools
- Shared with frontend teams
- Stored in version control

---

## Team Development Workflow

### Adding a New Feature Module

Let's say you want to add a **"Products"** feature:

#### 1. Database Schema (Prisma)

```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Float
  stock       Int      @default(0)
  status      Status   @default(ACTIVE)

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  createdBy   User     @relation(fields: [createdByUserId], references: [id])
  createdByUserId String @map("created_by_user_id")

  @@map("products")
  @@index([status])
  @@index([name])
}
```

```bash
npx prisma migrate dev --name add_products
```

#### 2. Repository Layer

```javascript
// src/core/repositories/product.repository.js
export function makeProductRepository({ prisma }) {
  return {
    async findMany({ page = 1, limit = 10, search = "" }) {
      const skip = (page - 1) * limit;
      const where = search
        ? {
            name: { contains: search, mode: "insensitive" },
            status: "ACTIVE",
          }
        : { status: "ACTIVE" };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ]);

      return { products, total, page, limit };
    },

    async findById(id) {
      return prisma.product.findUnique({ where: { id } });
    },

    async create(data) {
      return prisma.product.create({ data });
    },

    async update(id, data) {
      return prisma.product.update({ where: { id }, data });
    },

    async delete(id) {
      return prisma.product.update({
        where: { id },
        data: { status: "DELETED" },
      });
    },
  };
}
```

#### 3. Service Layer

```javascript
// src/core/services/product.service.js
import { NotFoundError, ConflictError } from "../errors/httpErrors.js";

export function makeProductService({ productRepository, logger }) {
  return {
    async getProducts(options) {
      return productRepository.findMany(options);
    },

    async getProductById(id) {
      const product = await productRepository.findById(id);
      if (!product || product.status === "DELETED") {
        throw new NotFoundError("Product not found");
      }
      return product;
    },

    async createProduct(data, userId) {
      logger.info({ userId }, "Creating product");
      return productRepository.create({
        ...data,
        createdByUserId: userId,
      });
    },

    async updateProduct(id, data) {
      await this.getProductById(id); // Verify exists
      return productRepository.update(id, data);
    },

    async deleteProduct(id) {
      await this.getProductById(id); // Verify exists
      return productRepository.delete(id);
    },
  };
}
```

#### 4. Validation Schemas

```javascript
// src/api/v1/products/products.validator.js
import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive"),
    stock: z.number().int().min(0, "Stock cannot be negative").default(0),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
  }),
});
```

#### 5. Controller

```javascript
// src/api/v1/products/products.controller.js
export default {
  async getProducts(req, res, next) {
    try {
      const productService = req.scope.resolve("productService");
      const result = await productService.getProducts(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getProductById(req, res, next) {
    try {
      const productService = req.scope.resolve("productService");
      const product = await productService.getProductById(req.params.id);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async createProduct(req, res, next) {
    try {
      const productService = req.scope.resolve("productService");
      const product = await productService.createProduct(req.body, req.user.userId);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const productService = req.scope.resolve("productService");
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async deleteProduct(req, res, next) {
    try {
      const productService = req.scope.resolve("productService");
      await productService.deleteProduct(req.params.id);
      res.status(200).json({ success: true, message: "Product deleted" });
    } catch (error) {
      next(error);
    }
  },
};
```

#### 6. Router

```javascript
// src/api/v1/products/products.router.js
import express from "express";
import productsController from "./products.controller.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { authorize } from "../../middleware/authorization.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createProductSchema, updateProductSchema } from "./products.validator.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", productsController.getProducts);
router.get("/:id", productsController.getProductById);
router.post(
  "/",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  validate(createProductSchema),
  productsController.createProduct
);
router.patch(
  "/:id",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  validate(updateProductSchema),
  productsController.updateProduct
);
router.delete("/:id", authorize(["SUPER_ADMIN"]), productsController.deleteProduct);

export { router as productsRouter };
```

#### 7. Register in DI Container

```javascript
// src/container.js - Add these lines
import { makeProductService } from "./core/services/product.service.js";
import { makeProductRepository } from "./core/repositories/product.repository.js";
import { logger } from "./infra/logger/index.js";
import { env } from "./config/index.js";
import getClient from "./infra/db/index.js";

container.register({
  logger: asValue(logger),
  env: asValue(env),
  prisma: asValue(getClient()),
  requestLogger: asValue(getLogger()),
});

container.register({
  // ... existing
  productService: asFunction(makeProductService).singleton(),
  productRepository: asFunction(makeProductRepository).singleton(),
});
```

#### 8. Add Route to Server

```javascript
// src/server.js
import { productsRouter } from "./api/v1/products/products.router.js";

app.use("/api/v1/products", productsRouter);
```

---

import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../../config/index.js";

/**
 * Rate limiter for authentication endpoints (login, register, password reset)
 * Stricter limits to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    if (req.user?.id) return `uid:${req.user.id}`;

    const u = (req.body?.username || "").toLowerCase();
    if (u) return `login:${u}:${ipKeyGenerator(req.ip)}`;

    return ipKeyGenerator(req.ip); // IPv6-safe
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many authentication attempts. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000), // Unix timestamp
    });
  },
});

/**
 * General API rate limiter
 * Applied to all API routes
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "production" ? 600 : 50000, // More lenient in dev
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests. Please slow down.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000),
    });
  },
});

/**
 * Strict rate limiter for sensitive operations
 * (e.g., password reset, email verification)
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: "Too many attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many attempts. Please try again in 1 hour.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000),
    });
  },
});

/**
 * File upload rate limiter
 * Prevents abuse of upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Too many upload requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Upload limit exceeded. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000),
    });
  },
});

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
  return req.headers["x-request-id"] || req.headers["x-correlation-id"] || req.id || uuid();
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

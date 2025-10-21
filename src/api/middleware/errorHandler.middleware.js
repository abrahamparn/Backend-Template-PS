import { env } from "../../config/index.js";
import { getLogger } from "../../infra/logger/index.js";

export const errorHandler = (err, req, res, next) => {
  const logger = req.scope?.resolve("logger") || getLogger();

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

  const response = {
    success: false,
    error: message,
  };

  if (err.details) {
    response.details = err.details;
  }

  if (env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

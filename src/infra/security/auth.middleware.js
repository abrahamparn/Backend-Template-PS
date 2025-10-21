import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../../core/errors/httpErrors.js";
import { env } from "../../config/index.js";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Validate that decoded token has required fields
    if (!decoded.userId) {
      throw new UnauthorizedError("Invalid token format");
    }

    // Get user repository to check current user version
    const authRepository = req.scope.resolve("authRepository");
    const user = await authRepository.findById(decoded.userId);

    // Check if user exists and is active
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("Account is not active");
    }

    //! CRITICAL: Check if user version in JWT matches current user version in DB
    // If admin changed user's role/permissions, userVersion is incremented
    // This forces user to re-login and get new JWT with updated role
    if (decoded.userVersion !== user.userVersion) {
      throw new UnauthorizedError("Token invalidated - please login again");
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: user.role, // Use fresh role from DB (though version check should catch this)
      userVersion: decoded.userVersion,
    };

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
}

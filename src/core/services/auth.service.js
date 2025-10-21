import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Status } from "@prisma/client";
import { UnauthorizedError, NotFoundError, ValidationError } from "../errors/httpErrors.js";
import { buildSendVerificationEmail } from "../../infra/mailer/templates/sendVerification/sendVerification.js";
export function makeAuthService({
  userRepository,
  authRepository,
  mailerService,
  rbacRepository,
  env,
  logger,
}) {
  return {
    async login({ username, password }) {
      const user = await userRepository.findByUsernameForAuth(username);

      if (!user || user.status === Status.DELETED) {
        throw new UnauthorizedError("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials");
      }

      if (user.status !== "ACTIVE") {
        throw new UnauthorizedError("Account is not active");
      }

      if (!user.emailVerifiedAt) {
        throw new UnauthorizedError("Email not verified");
      }

      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          username: user.username,
          userVersion: user.userVersion,
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN,
        }
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          refreshTokenVersion: user.refreshTokenVersion,
        },
        env.JWT_REFRESH_SECRET,
        {
          expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        }
      );

      const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

      await userRepository.update(user.id, {
        refreshTokenHash,
        lastLoginAt: new Date(),
      });

      const permissions = await rbacRepository.getUserPermissions(user.id);

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

          permissions: permissions.map((p) => p.code),
        },
      };
    },

    /**
     * Get current user details with fresh permissions
     */
    async getCurrentUser({ userId }) {
      const user = await authRepository.findById(userId);
      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedError("User not found or inactive");
      }

      // Get fresh permissions from database
      const permissions = await rbacRepository.getUserPermissions(userId);
      logger.info(
        {
          userId,
          permissionCount: permissions.length,
          permissions: permissions.map((p) => p.code),
        },
        "User permissions fetched"
      );
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        profilePictureUrl: user.profilePictureUrl,
        permissions: permissions.map((p) => p.code),
      };
    },

    async refreshToken({ refreshToken }) {
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      } catch (error) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const user = await authRepository.findById(decoded.userId);
      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedError("Invalid refresh token");
      }

      if (decoded.refreshTokenVersion !== user.refreshTokenVersion) {
        logger.warn({ userId: user.id }, "Refresh token version mismatch - possible replay attack");
        throw new UnauthorizedError("Invalid refresh token");
      }

      const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

      if (user.refreshTokenHash !== hashedToken) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const newAccessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          username: user.username,
          userVersion: user.userVersion,
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN,
        }
      );

      return { accessToken: newAccessToken };
    },

    async logout({ userId }) {
      await userRepository.update(userId, {
        refreshTokenHash: null,
      });
      logger.info({ userId }, "User logged out");
    },

    /**
     * Invalidate all user sessions (both access and refresh tokens)
     */
    async invalidateAllSessions({ userId }) {
      const user = await authRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      await userRepository.update(userId, {
        userVersion: user.userVersion + 1, // Invalidate all access tokens
        refreshTokenVersion: user.refreshTokenVersion + 1, // Invalidate all refresh tokens
        refreshTokenHash: null, // Clear stored refresh token
      });

      logger.info({ userId }, "All user sessions invalidated");
    },

    /**
     * Invalidate only access tokens (user needs to refresh to get new role/permissions)
     */
    async invalidateAccessTokens({ userId }) {
      const user = await authRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      await userRepository.update(userId, {
        userVersion: user.userVersion + 1, // Invalidate all access tokens
      });

      logger.info({ userId }, "User access tokens invalidated");
    },

    async createUser(data) {
      const { email, username, name, phoneNumber, password } = data;

      const emailExists = await authRepository.findByEmail(email);
      const usernameExists = await authRepository.findByUsername(username);
      const role = await authRepository.findRoleByName("User"); // TODO: validate this

      if (emailExists) {
        throw new ValidationError("Email already exists");
      }

      if (usernameExists) {
        throw new ValidationError("Username already exists");
      }

      if (!role) {
        throw new ValidationError("Default role User not found");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await authRepository.create({
        email,
        username,
        name,
        ...(phoneNumber ? { phoneNumber } : {}),
        passwordHash: hashedPassword,
        roleId: role.id,
      });

      const verificationEmail = buildSendVerificationEmail({
        appUrl: env.APP_URL,
        token: crypto.randomBytes(32).toString("hex"),
        name: newUser.name,
        username: newUser.username,
      });

      await mailerService.sendEmail({
        to: newUser.email,
        ...verificationEmail,
        appUrl: env.APP_URL,
      });
    },
  };
}

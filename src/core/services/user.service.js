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

      // CRITICAL: If role is being changed, increment userVersion to invalidate existing JWTs
      // This forces the user to re-login and get new JWT with updated role/permissions
      if (data.roleId && data.roleId !== user.roleId) {
        data.userVersion = user.userVersion + 1;
        logger.info(
          { userId: id, oldRole: user.roleId, newRole: data.roleId },
          "User role changed - invalidating access tokens"
        );
      }

      return userRepository.update(id, data);
    },

    async deleteUser(id, deletedByUserId) {
      await this.getUserById(id);
      return userRepository.delete(id, deletedByUserId);
    },
  };
}

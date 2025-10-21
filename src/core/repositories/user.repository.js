/**
 * Creates a user repository with methods to interact with the User model in the database.
 * @param {{ prisma: import('@prisma/client').PrismaClient }}
 * @returns {object} The user repository object.
 */
import { Status } from "@prisma/client";
export function makeUserRepository({ prisma }) {
  // A reusable select object to avoid returning sensitive fields
  const safeUserSelect = {
    id: true,
    email: true,
    username: true,
    name: true,
    role: true,
    status: true,
    profilePictureUrl: true,
    createdAt: true,
    lastLoginAt: true,
    emailVerifiedAt: true,
  };

  return {
    /**
     * Finds a user by their unique ID.
     * @param {string} id - The ID of the user.
     * @returns {Promise<object|null>} The user object or null if not found.
     */
    // TODO: Change this to include what you need, maybe verified? maybe notDeleted?
    async findById(id) {
      return prisma.user.findUnique({
        where: { id },
        select: safeUserSelect,
      });
    },

    /**
     * Finds a user by their email address, including sensitive fields needed for auth.
     * @param {string} email - The email of the user.
     * @returns {Promise<object|null>} The full user object or null if not found.
     */
    async findByEmailForAuth(email) {
      return prisma.user.findUnique({
        where: { email },
      });
    },

    /**
     * Finds a user by their email address, returning only safe, non-sensitive fields.
     * @param {string} email - The email of the user.
     * @returns {Promise<object|null>} The user object or null if not found.
     */
    async findByEmail(email) {
      return prisma.user.findUnique({
        where: { email },
        select: safeUserSelect,
      });
    },

    /**
     * Finds a user by their username, returning only safe, non-sensitive fields.
     * @param {string} username - The username of the user.
     * @returns {Promise<object|null>} The user object or null if not found.
     */
    async findByUsername(username) {
      return prisma.user.findUnique({
        where: { username },
        select: safeUserSelect,
      });
    },

    /**
     * Finds a user by their username, including sensitive fields needed for auth.
     * @param {string} username - The username of the user.
     * @returns {Promise<object|null>} The full user object or null if not found.
     */
    async findByUsernameForAuth(username) {
      return prisma.user.findUnique({
        where: { username },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    },

    /**
     * Retrieves a paginated and searchable list of active users.
     * @param {{ page?: number, limit?: number, search?: string }} options
     * @returns {Promise<{users: object[], total: number, page: number, limit: number}>}
     */
    async findMany({ page = 1, limit = 10, search = "" }) {
      page = Number(page);
      limit = Number(limit);
      const skip = (page - 1) * limit;

      const baseWhere = {
        deletedAt: null,
      };

      const searchWhere = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const where = { ...baseWhere, ...searchWhere };

      // Use a transaction to ensure count and findMany are consistent
      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: safeUserSelect,
        }),
        prisma.user.count({ where }),
      ]);

      return { data, meta: { total, page, limit } };
    },

    /**
     * Creates a new user.
     * @param {object} data - The user data, including a `passwordHash`.
     * @returns {Promise<object>} The newly created user object (safe fields only).
     */
    async create(data) {
      return prisma.user.create({
        data,
        select: safeUserSelect,
      });
    },

    /**
     * Updates a user's data.
     * @param {string} id - The ID of the user to update.
     * @param {object} data - The data to update.
     * @param {string} [updatedByUserId] - The ID of the user performing the update (for auditing).
     * @returns {Promise<object>} The updated user object (safe fields only).
     */
    async update(id, data, updatedByUserId) {
      return prisma.user.update({
        where: { id },
        data: {
          ...data,
          // Conditionally add updatedByUserId if it's provided
          ...(updatedByUserId && { updatedByUserId }),
        },
        select: safeUserSelect,
      });
    },

    /**
     * Soft deletes a user by setting the `deletedAt` timestamp and `deletedByUserId`.
     * @param {string} id - The ID of the user to delete.
     * @param {string} deletedByUserId - The ID of the user performing the deletion.
     * @returns {Promise<object>} The soft-deleted user object.
     */
    async delete(id, deletedByUserId) {
      return prisma.user.update({
        where: { id },
        data: {
          status: Status.DELETED, // Optional: useful for quick status checks
          deletedAt: new Date(),
          deletedByUserId,
        },
        select: {
          id: true,
          status: true,
          deletedAt: true,
        },
      });
    },
  };
}

/**
 * Creates a user log repository with methods to interact with the UserLog model.
 * @param {{ prisma: import('@prisma/client').PrismaClient }}
 * @returns {object} The user log repository object.
 */
export function makeUserLogRepository({ prisma }) {
  return {
    /**
     * Creates a new user log entry.
     * @param {object} logData
     * @param {string} logData.targetUserId - The ID of the user the log is about.
     * @param {import('@prisma/client').UserActionType} logData.action - The type of action performed.
     * @param {string} [logData.actorId] - The ID of the user who performed the action (optional).
     * @param {object} [logData.changedData] - A JSON object detailing what changed (optional).
     * @returns {Promise<object>} The created log entry.
     */
    async create({ targetUserId, action, actorId, changedData }) {
      return prisma.userLog.create({
        data: {
          targetUserId,
          action,
          actorId,
          changedData,
        },
      });
    },

    /**
     * Finds all log entries for a specific user, with pagination.
     * @param {string} userId - The ID of the target user.
     * @param {{ page?: number, limit?: number }} options
     * @returns {Promise<{logs: object[], total: number, page: number, limit: number}>}
     */
    async findManyByUserId(userId, { page = 1, limit = 20 }) {
      const skip = (page - 1) * limit;
      const where = { targetUserId: userId };

      const [logs, total] = await prisma.$transaction([
        prisma.userLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            // Optionally include the actor's basic info
            actor: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        }),
        prisma.userLog.count({ where }),
      ]);

      return { logs, total, page, limit };
    },
  };
}

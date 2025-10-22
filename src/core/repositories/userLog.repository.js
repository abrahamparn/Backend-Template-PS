export function makeUserLogRepository({ prisma }) {
  return {
    async getActionCounts({ startDate, endDate }) {
      return prisma.userLog.groupBy({
        by: ["action"],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          action: true,
        },
      });
    },

    async getLogsInRange({ startDate, endDate }) {
      return prisma.userLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          action: true,
          createdAt: true,
          actorId: true,
        },
        orderBy: { createdAt: "asc" },
      });
    },

    async getTopActors({ startDate, endDate, limit = 5 }) {
      const grouped = await prisma.userLog.groupBy({
        by: ["actorId"],
        where: {
          actorId: { not: null },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          actorId: true,
        },
        orderBy: {
          _count: {
            actorId: "desc",
          },
        },
        take: limit,
      });

      if (!grouped.length) return [];

      const actorIds = grouped.map((item) => item.actorId);
      const actors = await prisma.user.findMany({
        where: {
          id: { in: actorIds },
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      });

      const actorMap = new Map(actors.map((actor) => [actor.id, actor]));

      return grouped.map((item) => ({
        count: item._count.actorId,
        actor: actorMap.get(item.actorId) ?? { id: item.actorId },
      }));
    },

    async getRecentLogs({ limit = 10 }) {
      return prisma.userLog.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });
    },
  };
}

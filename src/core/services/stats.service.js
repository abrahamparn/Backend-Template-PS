import { ValidationError } from "../errors/httpErrors.js";

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("Invalid date format");
  }
  return date;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function buildDateRange(start, end) {
  const days = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

export function makeStatsService({ userLogRepository, logger }) {
  return {
    async getUserActivityStats({ startDate, endDate } = {}) {
      const now = new Date();
      const end = endOfDay(parseDate(endDate) ?? now);
      const defaultStart = new Date(end);
      defaultStart.setUTCDate(defaultStart.getUTCDate() - 29); // last 30 days
      const start = startOfDay(parseDate(startDate) ?? defaultStart);

      if (start > end) {
        throw new ValidationError("startDate must be before endDate");
      }

      const maxRangeDays = 120;
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > maxRangeDays) {
        throw new ValidationError(`Date range cannot exceed ${maxRangeDays} days`);
      }

      const [{ actionCounts, logsInRange, topActors }, recentActivity] = await Promise.all([
        (async () => {
          const [actionCounts, logsInRange, topActors] = await Promise.all([
            userLogRepository.getActionCounts({ startDate: start, endDate: end }),
            userLogRepository.getLogsInRange({ startDate: start, endDate: end }),
            userLogRepository.getTopActors({ startDate: start, endDate: end }),
          ]);

          return { actionCounts, logsInRange, topActors };
        })(),
        userLogRepository.getRecentLogs({ limit: 10 }),
      ]);

      const totalActions = actionCounts.reduce((sum, item) => sum + item._count.action, 0);
      const actionsByType = actionCounts.map((item) => ({
        action: item.action,
        count: item._count.action,
        percentage: totalActions ? Math.round((item._count.action / totalActions) * 1000) / 10 : 0,
      }));

      const days = buildDateRange(start, end);
      const dailyMap = new Map(
        days.map((d) => [startOfDay(d).toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), count: 0 }])
      );

      logsInRange.forEach((log) => {
        const key = startOfDay(log.createdAt).toISOString().slice(0, 10);
        const dayEntry = dailyMap.get(key);
        if (dayEntry) {
          dayEntry.count += 1;
        }
      });

      const dailyActivity = Array.from(dailyMap.values());

      const mostActiveDay = dailyActivity.reduce(
        (acc, day) => (day.count > acc.count ? day : acc),
        { date: null, count: 0 }
      );

      logger.debug(
        {
          start,
          end,
          totalActions,
          topActors: topActors.length,
        },
        "Computed user activity stats"
      );

      return {
        range: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          days: dailyActivity.length,
        },
        totals: {
          actions: totalActions,
          uniqueActors: topActors.length,
        },
        actionsByType,
        dailyActivity,
        mostActiveDay: mostActiveDay.date ? mostActiveDay : null,
        topActors,
        recentActivity: recentActivity.map((log) => ({
          id: log.id,
          action: log.action,
          createdAt: log.createdAt,
          actor: log.actor,
          targetUser: log.targetUser,
        })),
      };
    },
  };
}

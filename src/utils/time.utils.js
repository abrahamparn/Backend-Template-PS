/**
 * Parse time string to milliseconds
 * @param {string} expiry - Time string like "7d", "24h", "60m", "30s"
 * @returns {number} Milliseconds
 * @example
 * parseExpiryToMs("7d") // 604800000 (7 days)
 * parseExpiryToMs("24h") // 86400000 (24 hours)
 * parseExpiryToMs("15m") // 900000 (15 minutes)
 */
export function parseExpiryToMs(expiry) {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    console.warn(`Invalid expiry format: ${expiry}, using default 7 days`);
    return 7 * 24 * 60 * 60 * 1000; // default 7 days
  }

  const [, value, unit] = match;
  const multipliers = {
    s: 1000, // seconds
    m: 60000, // minutes
    h: 3600000, // hours
    d: 86400000, // days
  };

  return parseInt(value, 10) * multipliers[unit];
}

/**
 * Parse milliseconds to human-readable time
 * @param {number} ms - Milliseconds
 * @returns {string} Human-readable time like "7 days", "24 hours"
 */
export function msToHumanReadable(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return `${seconds} second${seconds > 1 ? "s" : ""}`;
}

/**
 * Add time to a date
 * @param {Date} date - Base date
 * @param {string} expiry - Time to add (e.g., "7d")
 * @returns {Date} New date with added time
 */
export function addTime(date, expiry) {
  const ms = parseExpiryToMs(expiry);
  return new Date(date.getTime() + ms);
}

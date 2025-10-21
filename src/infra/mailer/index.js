// src/services/mailer.js
import nodemailer from "nodemailer";
import { env as appEnv } from "../../config/index.js";

/**
 * Parse & normalize config once (avoid raw env usage in core logic)
 */
function buildMailerConfig(env = appEnv) {
  const port = Number(env.SMTP_PORT || 587);
  const secure = env.SMTP_SECURE ? String(env.SMTP_SECURE).toLowerCase() === "true" : port === 465; // 465 usually needs secure: true

  return {
    host: env.SMTP_HOST,
    port,
    secure,
    service: env.SMTP_SERVICE || undefined, // optional; leave undefined if using host/port
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    pool: String(env.SMTP_POOL || "true").toLowerCase() === "true",
    maxConnections: Number(env.SMTP_MAX_CONNECTIONS || 5),
    maxMessages: Number(env.SMTP_MAX_MESSAGES || 100),
    connectionTimeout: Number(env.SMTP_CONN_TIMEOUT_MS || 30_000),
    greetingTimeout: Number(env.SMTP_GREET_TIMEOUT_MS || 10_000),
    socketTimeout: Number(env.SMTP_SOCKET_TIMEOUT_MS || 30_000),
    tls: {
      // In prod we normally keep strict TLS on. Allow override for lab envs.
      rejectUnauthorized:
        env.SMTP_TLS_REJECT_UNAUTHORIZED === undefined
          ? true
          : String(env.SMTP_TLS_REJECT_UNAUTHORIZED).toLowerCase() === "true",
    },
    defaultFrom: env.EMAIL_FROM || env.SMTP_USER, // fallback
    verifyOnBoot: String(env.SMTP_VERIFY_ON_BOOT || "true").toLowerCase() === "true",
    maxRetries: Number(env.SMTP_MAX_RETRIES || 3),
    backoffMs: Number(env.SMTP_RETRY_BACKOFF_MS || 500), // base backoff
    nodeEnv: env.NODE_ENV || "development",
  };
}

/**
 * Decide if error is transient (worth retrying).
 * You can expand this map as you meet providers.
 */
function isTransientSmtpError(err) {
  const code = err?.code || err?.responseCode;
  // Common transient patterns: 421 (Service not available), 451/452 (local failures)
  if (code === 421 || code === 451 || code === 452) return true;
  // Network issues
  if (err?.code === "ETIMEDOUT" || err?.code === "ECONNECTION" || err?.code === "EAI_AGAIN")
    return true;
  return false;
}

/**
 * Create the mailer service.
 * @param {{ logger: {info:Function, error:Function, warn?:Function}, env?: any }} deps
 */
export function makeMailerService({ logger, env } = {}) {
  const cfg = buildMailerConfig(env);

  // Validate minimal config early (fail fast)
  for (const key of ["host", "auth.user", "auth.pass"]) {
    const val = key === "host" ? cfg.host : key === "auth.user" ? cfg.auth.user : cfg.auth.pass;
    if (!val && !cfg.service) {
      throw new Error(`Mailer config invalid: missing ${key} (or provide SMTP_SERVICE)`);
    }
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    service: cfg.service, // if provided, nodemailer will prefer it
    auth: cfg.auth,
    pool: cfg.pool,
    maxConnections: cfg.maxConnections,
    maxMessages: cfg.maxMessages,
    connectionTimeout: cfg.connectionTimeout,
    greetingTimeout: cfg.greetingTimeout,
    socketTimeout: cfg.socketTimeout,
    tls: cfg.tls,
  });

  // Optional verification at boot (useful to fail early in non-serverless)
  if (cfg.verifyOnBoot) {
    transporter
      .verify()
      .then(() =>
        logger.info({ host: cfg.host, service: cfg.service }, "Mailer verified and ready")
      )
      .catch((err) => {
        logger.error({ err }, "Mailer verification failed");
        // In strict environments you may want to throw here:
        if (cfg.nodeEnv === "production") {
          // throw err; // Uncomment if you want hard fail at boot in prod
        }
      });
  }

  /**
   * Send an email with retries on transient failures.
   * @param {{ to: string|string[], subject: string, html?: string, text?: string, cc?: string|string[], bcc?: string|string[], replyTo?: string, attachments?: Array<any>, headers?: Record<string,string> }} opts
   * @returns {Promise<{messageId: string, accepted: string[], rejected: string[]}>}
   */
  async function sendEmail(opts) {
    const { to, subject, html, text, cc, bcc, replyTo, attachments, headers } = opts;

    if (!to || !subject) {
      throw new Error("sendEmail requires at least { to, subject }");
    }

    // Provide a plain-text fallback when only HTML is supplied (some MTAs prefer it)
    const textFallback =
      text ||
      (html
        ? html
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .trim()
        : undefined);

    const mailOptions = {
      from: cfg.defaultFrom,
      to,
      subject,
      html,
      text: textFallback,
      cc,
      bcc,
      replyTo,
      attachments,
      headers,
    };

    let attempt = 0;
    // Simple exponential backoff
    while (true) {
      try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(
          {
            to,
            subject,
            messageId: info?.messageId,
            accepted: info?.accepted,
            rejected: info?.rejected,
          },
          "Email sent"
        );
        return {
          messageId: info?.messageId,
          accepted: info?.accepted || [],
          rejected: info?.rejected || [],
        };
      } catch (err) {
        attempt += 1;
        const shouldRetry = attempt < cfg.maxRetries && isTransientSmtpError(err);
        logger.error(
          { err, to, subject, attempt, maxRetries: cfg.maxRetries, willRetry: shouldRetry },
          "Email send failed"
        );
        if (!shouldRetry) throw err;
        const delay = cfg.backoffMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  return { sendEmail, transporter }; // exporter transporter for health/metrics if you want
}

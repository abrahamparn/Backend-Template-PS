import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlTemplatePath = path.join(__dirname, "sendVerification.html");
const htmlTemplate = readFileSync(htmlTemplatePath, "utf8");

function interpolate(template, variables) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => variables[key] ?? "");
}

function buildVerificationUrl(appUrl, token) {
  const baseUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
  return `${baseUrl}/verify?token=${encodeURIComponent(token)}`;
}

export function buildSendVerificationEmail({ appUrl, token, name, username }) {
  if (!appUrl) {
    throw new Error("buildSendVerificationEmail: appUrl is required");
  }
  if (!token) {
    throw new Error("buildSendVerificationEmail: token is required");
  }

  const displayName = (name || username || "there").trim();
  const verificationUrl = buildVerificationUrl(appUrl, token);

  const html = interpolate(htmlTemplate, {
    displayName,
    verificationUrl,
  });

  const text = [
    `Hi ${displayName},`,
    "Thanks for signing up. Please confirm your email address by visiting the link below:",
    verificationUrl,
    "",
    "If you did not create this account, you can safely ignore this email.",
  ].join("\n");

  return {
    subject: "Verify your account",
    html,
    text,
  };
}

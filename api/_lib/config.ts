import type { IncomingMessage } from "node:http";

export function getAllowedUsers(): string[] {
  return (process.env.ALLOWED_USERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(username: string): boolean {
  return getAllowedUsers().includes(username.toLowerCase());
}

export function getDailyLimit(): number {
  const n = Number(process.env.DAILY_LIMIT);
  return Number.isFinite(n) && n > 0 ? n : 50;
}

export function getBaseUrl(req: IncomingMessage): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:5173";
  const proto = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

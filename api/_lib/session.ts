import type { IncomingMessage, ServerResponse } from "node:http";
import { SignJWT, jwtVerify } from "jose";
import { parse, serialize } from "cookie";
import { isProd } from "./config";

const SESSION_COOKIE = "bullets_session";
const STATE_COOKIE = "bullets_oauth_state";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

export type Session = { username: string };

export async function signSession(payload: Session): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.username !== "string") return null;
    return { username: payload.username };
  } catch {
    return null;
  }
}

export function readCookies(req: IncomingMessage): Record<string, string | undefined> {
  return parse(req.headers.cookie ?? "");
}

export function setSessionCookie(res: ServerResponse, token: string): void {
  appendSetCookie(
    res,
    serialize(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProd(),
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    })
  );
}

export function clearSessionCookie(res: ServerResponse): void {
  appendSetCookie(
    res,
    serialize(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: isProd(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}

export function setStateCookie(res: ServerResponse, state: string): void {
  appendSetCookie(
    res,
    serialize(STATE_COOKIE, state, {
      httpOnly: true,
      secure: isProd(),
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    })
  );
}

export function clearStateCookie(res: ServerResponse): void {
  appendSetCookie(
    res,
    serialize(STATE_COOKIE, "", {
      httpOnly: true,
      secure: isProd(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}

export function getSessionToken(req: IncomingMessage): string | undefined {
  return readCookies(req)[SESSION_COOKIE];
}

export function getStateCookie(req: IncomingMessage): string | undefined {
  return readCookies(req)[STATE_COOKIE];
}

function appendSetCookie(res: ServerResponse, value: string): void {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", value);
  } else if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, value]);
  } else {
    res.setHeader("Set-Cookie", [String(existing), value]);
  }
}

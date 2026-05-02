import type { IncomingMessage, ServerResponse } from "node:http";
import { getDailyLimit } from "../_lib/config";
import { getSessionToken, verifySession } from "../_lib/session";
import { getDailyUsage, rateLimitConfigured } from "../_lib/rateLimit";
import { sendJson } from "../_lib/respond";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const token = getSessionToken(req);
  if (!token) {
    sendJson(res, 401, { error: "not_signed_in" });
    return;
  }
  const session = await verifySession(token);
  if (!session) {
    sendJson(res, 401, { error: "invalid_session" });
    return;
  }
  const limit = getDailyLimit();
  const used = await getDailyUsage(session.username);
  sendJson(res, 200, {
    username: session.username,
    used,
    limit,
    rate_limited: rateLimitConfigured(),
  });
}

import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { getBaseUrl } from "../_lib/config";
import { setStateCookie } from "../_lib/session";
import { redirect, sendJson } from "../_lib/respond";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    sendJson(res, 500, { error: "GITHUB_CLIENT_ID is not configured on the server" });
    return;
  }

  const state = randomBytes(16).toString("hex");
  setStateCookie(res, state);

  const redirectUri = `${getBaseUrl(req)}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user",
    state,
    allow_signup: "false",
  });
  redirect(res, `https://github.com/login/oauth/authorize?${params.toString()}`);
}

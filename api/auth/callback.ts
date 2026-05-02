import type { IncomingMessage, ServerResponse } from "node:http";
import { getBaseUrl, isAllowed } from "../_lib/config";
import {
  clearStateCookie,
  getStateCookie,
  setSessionCookie,
  signSession,
} from "../_lib/session";
import { redirect, sendJson } from "../_lib/respond";

type GitHubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GitHubUser = {
  login?: string;
  id?: number;
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    sendJson(res, 500, { error: "GitHub OAuth is not configured on the server" });
    return;
  }

  const url = new URL(req.url ?? "/", getBaseUrl(req));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getStateCookie(req);
  clearStateCookie(res);

  if (!code || !state || !expectedState || state !== expectedState) {
    redirect(res, "/?error=oauth_state");
    return;
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "bullets-app",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${getBaseUrl(req)}/api/auth/callback`,
    }),
  });
  const tokenJson = (await tokenRes.json()) as GitHubTokenResponse;
  if (!tokenJson.access_token) {
    redirect(res, "/?error=oauth_token");
    return;
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "bullets-app",
    },
  });
  const user = (await userRes.json()) as GitHubUser;
  const username = user.login;
  if (!username) {
    redirect(res, "/?error=oauth_user");
    return;
  }

  if (!isAllowed(username)) {
    redirect(res, `/?error=not_allowed&user=${encodeURIComponent(username)}`);
    return;
  }

  const session = await signSession({ username });
  setSessionCookie(res, session);
  redirect(res, "/");
}

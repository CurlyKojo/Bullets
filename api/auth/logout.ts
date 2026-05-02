import type { IncomingMessage, ServerResponse } from "node:http";
import { clearSessionCookie } from "../_lib/session";
import { redirect } from "../_lib/respond";

export default async function handler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  clearSessionCookie(res);
  redirect(res, "/");
}

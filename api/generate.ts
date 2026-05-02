import Anthropic from "@anthropic-ai/sdk";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getDailyLimit } from "./_lib/config";
import { getSessionToken, verifySession } from "./_lib/session";
import { incrementUsage } from "./_lib/rateLimit";
import { sendJson } from "./_lib/respond";

const SYSTEM_PROMPT = `You write short, high-impact bullet points for résumés, product copy, and status updates.

Rules for every bullet you produce:
- Output the bullet text only. No bullets/dashes, no quotes, no commentary, no preamble.
- Single line. No line breaks.
- Stay strictly inside the requested character window (inclusive). Count every character including spaces and punctuation.
- Lead with a strong verb when natural. Be specific. Skip filler.

When asked for multiple candidates, return one bullet per line, nothing else.`;

const MODEL = "claude-opus-4-7";

type GenerateBody = {
  mode: "generate";
  description: string;
  min: number;
  max: number;
  count?: number;
};

type RephraseBody = {
  mode: "rephrase";
  bullet: string;
  min: number;
  max: number;
  count?: number;
};

type Body = GenerateBody | RephraseBody;

function parseBullets(text: string, count: number): string[] {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-*•\d.)]+\s*/, "")
        .replace(/^["'`]|["'`]$/g, "")
        .trim()
    )
    .filter((line) => line.length > 0)
    .slice(0, count);
}

function buildPrompt(body: Body): string {
  const count = body.count ?? 5;
  if (body.mode === "generate") {
    return `Write ${count} distinct bullet candidates.

Description of what the bullet should convey:
${body.description}

Character window (strict, inclusive): ${body.min}–${body.max} characters per bullet.

Return ${count} bullets, one per line. Each bullet must independently fit the window.`;
  }
  return `Rewrite the following bullet in ${count} distinct ways. Preserve the meaning; vary the verbiage, structure, and emphasis.

Original bullet:
${body.bullet}

Character window (strict, inclusive): ${body.min}–${body.max} characters per variation.

Return ${count} variations, one per line. Each must independently fit the window.`;
}

function isValidBody(value: unknown): value is Body {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.min !== "number" || typeof v.max !== "number") return false;
  if (v.min < 0 || v.max <= v.min) return false;
  if (v.mode === "generate") return typeof v.description === "string" && v.description.trim().length > 0;
  if (v.mode === "rephrase") return typeof v.bullet === "string" && v.bullet.trim().length > 0;
  return false;
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const reqAny = req as IncomingMessage & { body?: unknown };
  if (reqAny.body !== undefined && reqAny.body !== null) {
    if (typeof reqAny.body === "string") {
      try { return JSON.parse(reqAny.body); } catch { return null; }
    }
    return reqAny.body;
  }
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer | string) => { data += chunk; });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const token = getSessionToken(req);
  const session = token ? await verifySession(token) : null;
  if (!session) {
    sendJson(res, 401, { error: "Sign in to use this feature." });
    return;
  }

  let parsed: unknown;
  try {
    parsed = await readJson(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }
  if (!isValidBody(parsed)) {
    sendJson(res, 400, { error: "Invalid request shape" });
    return;
  }

  const limit = getDailyLimit();
  let usage;
  try {
    usage = await incrementUsage(session.username, limit);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Rate limiter error";
    sendJson(res, 500, { error: message });
    return;
  }
  if (!usage.allowed) {
    sendJson(res, 429, {
      error: `Daily limit reached (${usage.count - 1}/${limit}). Resets at midnight UTC.`,
      used: usage.count - 1,
      limit,
    });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "ANTHROPIC_API_KEY is not configured on the server" });
    return;
  }

  const body = parsed;
  const count = body.count ?? 5;
  const prompt = buildPrompt(body);

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const bullets = parseBullets(text, count);
    sendJson(res, 200, { bullets, used: usage.count, limit });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    sendJson(res, 500, { error: message });
  }
}

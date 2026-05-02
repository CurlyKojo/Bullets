import Anthropic from "@anthropic-ai/sdk";

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

const client = apiKey
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null;

export const hasApiKey = () => client !== null;

const SYSTEM_PROMPT = `You write short, high-impact bullet points for résumés, product copy, and status updates.

Rules for every bullet you produce:
- Output the bullet text only. No bullets/dashes, no quotes, no commentary, no preamble.
- Single line. No line breaks.
- Stay strictly inside the requested character window (inclusive). Count every character including spaces and punctuation.
- Lead with a strong verb when natural. Be specific. Skip filler.

When asked for multiple candidates, return one bullet per line, nothing else.`;

const MODEL = "claude-opus-4-7";

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

async function callClaude(userPrompt: string): Promise<string> {
  if (!client) {
    throw new Error(
      "Missing VITE_ANTHROPIC_API_KEY. Copy .env.example to .env and add your key."
    );
  }
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
    messages: [{ role: "user", content: userPrompt }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}

export async function generateBullets(args: {
  description: string;
  min: number;
  max: number;
  count?: number;
}): Promise<string[]> {
  const count = args.count ?? 5;
  const prompt = `Write ${count} distinct bullet candidates.

Description of what the bullet should convey:
${args.description}

Character window (strict, inclusive): ${args.min}–${args.max} characters per bullet.

Return ${count} bullets, one per line. Each bullet must independently fit the window.`;
  const text = await callClaude(prompt);
  return parseBullets(text, count);
}

export async function rephraseBullet(args: {
  bullet: string;
  min: number;
  max: number;
  count?: number;
}): Promise<string[]> {
  const count = args.count ?? 5;
  const prompt = `Rewrite the following bullet in ${count} distinct ways. Preserve the meaning; vary the verbiage, structure, and emphasis.

Original bullet:
${args.bullet}

Character window (strict, inclusive): ${args.min}–${args.max} characters per variation.

Return ${count} variations, one per line. Each must independently fit the window.`;
  const text = await callClaude(prompt);
  return parseBullets(text, count);
}

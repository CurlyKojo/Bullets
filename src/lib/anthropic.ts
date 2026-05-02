export type GenerateResult = {
  bullets: string[];
  used?: number;
  limit?: number;
};

async function callApi(body: unknown): Promise<GenerateResult> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: { bullets?: string[]; error?: string; used?: number; limit?: number } = {};
  try {
    data = await response.json();
  } catch {
    // empty / non-JSON body
  }
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return { bullets: data.bullets ?? [], used: data.used, limit: data.limit };
}

export async function generateBullets(args: {
  description: string;
  min: number;
  max: number;
  count?: number;
}): Promise<GenerateResult> {
  return callApi({ mode: "generate", ...args });
}

export async function rephraseBullet(args: {
  bullet: string;
  min: number;
  max: number;
  count?: number;
}): Promise<GenerateResult> {
  return callApi({ mode: "rephrase", ...args });
}

async function callApi(body: unknown): Promise<string[]> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: { bullets?: string[]; error?: string } = {};
  try {
    data = await response.json();
  } catch {
    // empty / non-JSON body
  }
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data.bullets ?? [];
}

export async function generateBullets(args: {
  description: string;
  min: number;
  max: number;
  count?: number;
}): Promise<string[]> {
  return callApi({ mode: "generate", ...args });
}

export async function rephraseBullet(args: {
  bullet: string;
  min: number;
  max: number;
  count?: number;
}): Promise<string[]> {
  return callApi({ mode: "rephrase", ...args });
}

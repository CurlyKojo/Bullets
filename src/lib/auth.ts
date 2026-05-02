export type Me = {
  username: string;
  used: number;
  limit: number;
  rate_limited: boolean;
};

export async function fetchMe(): Promise<Me | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  return (await res.json()) as Me;
}

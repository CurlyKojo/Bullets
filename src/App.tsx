import { useEffect, useState } from "react";
import { CharLimitPanel } from "./components/CharLimitPanel";
import { BulletCard } from "./components/BulletCard";
import { PRESETS, type Bullet, type CharRange } from "./types";
import { generateBullets, rephraseBullet } from "./lib/anthropic";
import { fetchMe, type Me } from "./lib/auth";

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function readErrorParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  const err = params.get("error");
  if (!err) return null;
  if (err === "not_allowed") {
    const user = params.get("user");
    return user
      ? `GitHub user @${user} isn't on the invite list. Ask the owner to add you.`
      : "Your GitHub account isn't on the invite list.";
  }
  if (err === "oauth_state") return "Sign-in expired or was tampered with. Try again.";
  if (err === "oauth_token") return "GitHub didn't return an access token. Try again.";
  if (err === "oauth_user") return "Couldn't read your GitHub profile. Try again.";
  return `Sign-in failed (${err}).`;
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError] = useState<string | null>(readErrorParam);

  const [description, setDescription] = useState("");
  const [range, setRange] = useState<CharRange>(PRESETS[1].range);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [saved, setSaved] = useState<Bullet[]>([]);
  const [generating, setGenerating] = useState(false);
  const [rephrasingId, setRephrasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setMe(await fetchMe());
      } finally {
        setAuthChecked(true);
      }
    })();
    if (window.location.search.includes("error=")) {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const onGenerate = async () => {
    if (!description.trim()) return;
    setError(null);
    setGenerating(true);
    try {
      const result = await generateBullets({
        description: description.trim(),
        min: range.min,
        max: range.max,
        count: 5,
      });
      setCandidates(result.bullets);
      if (me && typeof result.used === "number" && typeof result.limit === "number") {
        setMe({ ...me, used: result.used, limit: result.limit });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const onSave = (text: string) => {
    setSaved((prev) =>
      prev.some((b) => b.text === text)
        ? prev
        : [{ id: newId(), text, createdAt: Date.now() }, ...prev]
    );
  };

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const onRephrase = async (bullet: Bullet) => {
    setError(null);
    setRephrasingId(bullet.id);
    try {
      const result = await rephraseBullet({
        bullet: bullet.text,
        min: range.min,
        max: range.max,
        count: 5,
      });
      setCandidates(result.bullets);
      if (me && typeof result.used === "number" && typeof result.limit === "number") {
        setMe({ ...me, used: result.used, limit: result.limit });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRephrasingId(null);
    }
  };

  const onDelete = (id: string) => {
    setSaved((prev) => prev.filter((b) => b.id !== id));
  };

  const usageRemaining = me ? Math.max(0, me.limit - me.used) : null;
  const overLimit = me ? me.used >= me.limit : false;

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Bullets</h1>
            <p className="text-xs text-slate-500">
              Draft and refine constraint-bound bullet points with Claude.
            </p>
          </div>
          {authChecked && me ? (
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>
                Signed in as <span className="font-semibold text-slate-900">@{me.username}</span>
              </span>
              {me.rate_limited && usageRemaining !== null && (
                <span
                  className={
                    "rounded-full border px-2 py-0.5 " +
                    (overLimit
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-slate-50 text-slate-600")
                  }
                >
                  {me.used} / {me.limit} today
                </span>
              )}
              <a
                href="/api/auth/logout"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Sign out
              </a>
            </div>
          ) : null}
        </div>
      </header>

      {!authChecked ? (
        <main className="mx-auto max-w-6xl px-6 py-12 text-center text-sm text-slate-500">
          Loading…
        </main>
      ) : !me ? (
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Invite-only</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with GitHub to access Bullets. Only allow-listed accounts get in.
          </p>
          {authError && (
            <p className="mx-auto mt-4 max-w-md rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {authError}
            </p>
          )}
          <a
            href="/api/auth/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Sign in with GitHub
          </a>
        </main>
      ) : (
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Describe what the bullet should convey
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="e.g. Led a 4-engineer team to ship a real-time analytics dashboard, cutting customer reporting time from days to seconds."
                className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <CharLimitPanel range={range} onChange={setRange} />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onGenerate}
                disabled={generating || !description.trim() || overLimit}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {generating ? "Generating…" : "Generate bullets"}
              </button>
              {error && <span className="text-sm text-rose-600">{error}</span>}
              {overLimit && !error && (
                <span className="text-sm text-rose-600">
                  Daily limit reached. Resets at midnight UTC.
                </span>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Candidates</h2>
              {candidates.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Generated bullets will appear here.
                </p>
              ) : (
                <div className="grid gap-3">
                  {candidates.map((text, i) => (
                    <BulletCard
                      key={`${i}-${text.slice(0, 10)}`}
                      text={text}
                      range={range}
                      onSave={() => onSave(text)}
                      onCopy={() => onCopy(text)}
                      saved={saved.some((b) => b.text === text)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Saved ({saved.length})</h2>
            {saved.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Save bullets you want to keep. Use “Different verbiage” to spin variations.
              </p>
            ) : (
              <div className="grid gap-3">
                {saved.map((bullet) => (
                  <BulletCard
                    key={bullet.id}
                    text={bullet.text}
                    range={range}
                    onCopy={() => onCopy(bullet.text)}
                    onRephrase={overLimit ? undefined : () => onRephrase(bullet)}
                    onDelete={() => onDelete(bullet.id)}
                    busy={rephrasingId === bullet.id}
                  />
                ))}
              </div>
            )}
          </aside>
        </main>
      )}
    </div>
  );
}

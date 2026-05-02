import { useState } from "react";
import { CharLimitPanel } from "./components/CharLimitPanel";
import { BulletCard } from "./components/BulletCard";
import { PRESETS, type Bullet, type CharRange } from "./types";
import { generateBullets, hasApiKey, rephraseBullet } from "./lib/anthropic";

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function App() {
  const [description, setDescription] = useState("");
  const [range, setRange] = useState<CharRange>(PRESETS[1].range);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [saved, setSaved] = useState<Bullet[]>([]);
  const [generating, setGenerating] = useState(false);
  const [rephrasingId, setRephrasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiReady = hasApiKey();

  const onGenerate = async () => {
    if (!description.trim()) return;
    setError(null);
    setGenerating(true);
    try {
      const bullets = await generateBullets({
        description: description.trim(),
        min: range.min,
        max: range.max,
        count: 5,
      });
      setCandidates(bullets);
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
      const variations = await rephraseBullet({
        bullet: bullet.text,
        min: range.min,
        max: range.max,
        count: 5,
      });
      setCandidates(variations);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRephrasingId(null);
    }
  };

  const onDelete = (id: string) => {
    setSaved((prev) => prev.filter((b) => b.id !== id));
  };

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
          {!apiReady && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-800">
              Set VITE_ANTHROPIC_API_KEY in .env to enable generation
            </span>
          )}
        </div>
      </header>

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
              disabled={generating || !description.trim() || !apiReady}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {generating ? "Generating…" : "Generate bullets"}
            </button>
            {error && (
              <span className="text-sm text-rose-600">{error}</span>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Candidates
            </h2>
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
          <h2 className="text-sm font-semibold text-slate-700">
            Saved ({saved.length})
          </h2>
          {saved.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Save bullets you want to keep. Use “Different verbiage” to spin
              variations.
            </p>
          ) : (
            <div className="grid gap-3">
              {saved.map((bullet) => (
                <BulletCard
                  key={bullet.id}
                  text={bullet.text}
                  range={range}
                  onCopy={() => onCopy(bullet.text)}
                  onRephrase={
                    apiReady ? () => onRephrase(bullet) : undefined
                  }
                  onDelete={() => onDelete(bullet.id)}
                  busy={rephrasingId === bullet.id}
                />
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

import type { CharRange } from "../types";

type Props = {
  text: string;
  range: CharRange;
  onSave?: () => void;
  onCopy?: () => void;
  onRephrase?: () => void;
  onDelete?: () => void;
  saved?: boolean;
  busy?: boolean;
};

function fitIndicator(len: number, range: CharRange) {
  if (len < range.min) {
    return {
      label: `⚠ below min (${range.min})`,
      tone: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }
  if (len > range.max) {
    return {
      label: `⚠ above max (${range.max})`,
      tone: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }
  return {
    label: `✓ within ${range.min}–${range.max}`,
    tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
}

export function BulletCard({
  text,
  range,
  onSave,
  onCopy,
  onRephrase,
  onDelete,
  saved,
  busy,
}: Props) {
  const len = text.length;
  const fit = fitIndicator(len, range);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm leading-relaxed text-slate-900">{text}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${fit.tone}`}
        >
          {fit.label}
        </span>
        <span className="text-xs text-slate-400">{len} chars</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saved}
            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saved ? "Saved" : "Save"}
          </button>
        )}
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Copy
          </button>
        )}
        {onRephrase && (
          <button
            type="button"
            onClick={onRephrase}
            disabled={busy}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Rephrasing…" : "Different verbiage"}
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-rose-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

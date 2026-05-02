import { PRESETS, RANGE_SCALE_MAX, type CharRange } from "../types";

type Props = {
  range: CharRange;
  onChange: (next: CharRange) => void;
};

export function CharLimitPanel({ range, onChange }: Props) {
  const setMin = (raw: number) => {
    const min = Math.max(0, Math.min(raw, range.max - 1));
    onChange({ min, max: range.max });
  };
  const setMax = (raw: number) => {
    const max = Math.max(range.min + 1, Math.min(raw, RANGE_SCALE_MAX));
    onChange({ min: range.min, max });
  };

  const minPct = (range.min / RANGE_SCALE_MAX) * 100;
  const maxPct = (range.max / RANGE_SCALE_MAX) * 100;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Character count limits
        </h3>
        <span className="text-xs text-slate-500">
          target: {range.min}–{range.max} chars
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Min
          <input
            type="number"
            min={0}
            max={range.max - 1}
            value={range.min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Max
          <input
            type="number"
            min={range.min + 1}
            max={RANGE_SCALE_MAX}
            value={range.max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>
      </div>

      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-slate-400">
        <span>0</span>
        <span>{RANGE_SCALE_MAX}</span>
      </div>
      <div className="relative h-3 rounded-full bg-slate-100">
        <div
          className="absolute top-0 h-3 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-600 bg-white"
          style={{ left: `${minPct}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-600 bg-white"
          style={{ left: `${maxPct}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active =
            preset.range.min === range.min && preset.range.max === range.max;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.range)}
              className={
                "rounded-full px-3 py-1 text-xs font-medium transition " +
                (active
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              }
            >
              {preset.label} ({preset.range.min}–{preset.range.max})
            </button>
          );
        })}
      </div>
    </div>
  );
}

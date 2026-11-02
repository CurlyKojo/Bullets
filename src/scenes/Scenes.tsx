import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Scrim } from "../components/Backdrop";
import { MediaLayer } from "../components/MediaLayer";
import { StlGrid } from "../components/Stl";
import { Caption, Tag, Title } from "../components/Words";
import { BODY, DISPLAY, DIM, INK, LINE, MONO, PAPER, SAFE } from "../theme";
import { LogoMark, Wordmark } from "../components/Logo";
import type { ReelProps, Scene } from "../types";

type P = { s: Scene; r: ReelProps };

// Words sit in a column inside the safe box, top-weighted so they're read before the
// footage underneath pulls the eye down.
const WordsBlock: React.FC<{ s: Scene; accent: string; size?: number; top?: number }> = ({ s, accent, size, top = SAFE.top + 40 }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: SAFE.left,
      width: SAFE.right - SAFE.left,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 28,
    }}
  >
    {s.title && <Title text={s.title} accent={accent} size={size ?? (s.title.length > 42 ? 84 : 100)} />}
    {s.sub && (
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 42, color: DIM, textAlign: "center", maxWidth: 820 }}>{s.sub}</div>
    )}
  </div>
);

const CaptionBlock: React.FC<{ text?: string; y?: number }> = ({ text, y = 1150 }) =>
  text ? (
    <div style={{ position: "absolute", top: y, left: 0, width: SAFE.right + 60, display: "flex", justifyContent: "center", paddingLeft: SAFE.left }}>
      <Caption text={text} />
    </div>
  ) : null;

// The first second and a half decides everything. Footage is already moving on frame 0,
// the words land on a fast stagger, and a punch-in on the media sells the cut.
export const Hook: React.FC<P> = ({ s, r }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame: f, fps, config: { damping: 200, stiffness: 60 } });
  return (
    <AbsoluteFill>
      <Backdrop accent={r.accent} />
      <AbsoluteFill style={{ transform: `scale(${1.06 - 0.06 * punch})` }}>
        <MediaLayer media={s.media} accent={r.accent} dur={s.dur} />
      </AbsoluteFill>
      <Scrim />
      <div style={{ position: "absolute", top: SAFE.top - 40, left: SAFE.left }}>
        <Tag name={r.project.name} kind={r.project.kind} accent={r.accent} />
      </div>
      {s.media && s.media.kind !== "none" ? (
        <WordsBlock s={s} accent={r.accent} size={s.title && s.title.length > 46 ? 92 : 112} top={SAFE.top + 50} />
      ) : (
        // Text-only hook (tips): bigger words, sitting in the upper-middle of the frame
        // where the eye lands first, with the sub line as the promise.
        <WordsBlock s={s} accent={r.accent} size={s.title && s.title.length > 40 ? 104 : 124} top={520} />
      )}
      <CaptionBlock text={s.caption} />
    </AbsoluteFill>
  );
};

export const MediaScene: React.FC<P> = ({ s, r }) => (
  <AbsoluteFill>
    <Backdrop accent={r.accent} />
    <MediaLayer media={s.media} accent={r.accent} dur={s.dur} />
    <Scrim strength={s.media?.kind === "stl" ? 0.4 : 1} />
    <WordsBlock s={s} accent={r.accent} />
    <CaptionBlock text={s.caption} />
  </AbsoluteFill>
);

// A big number counting up. Numbers stop thumbs.
export const Stat: React.FC<P> = ({ s, r }) => {
  const f = useCurrentFrame();
  const end = s.value ?? 0;
  const t = interpolate(f, [2, Math.min(s.dur - 6, 22)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - t, 3);
  const n = (end * eased).toFixed(s.decimals ?? 0);
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 200, stiffness: 90 } });
  return (
    <AbsoluteFill>
      <Backdrop accent={r.accent} />
      <MediaLayer media={s.media} accent={r.accent} dur={s.dur} dim={0.45} />
      <Scrim />
      <div style={{ position: "absolute", top: 420, left: SAFE.left, width: SAFE.right - SAFE.left, textAlign: "center" }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 300,
            lineHeight: 0.9,
            letterSpacing: -14,
            color: PAPER,
            opacity: Math.min(1, pop * 1.5),
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {s.prefix}
          {n}
          <span style={{ fontSize: 120, letterSpacing: -4, marginLeft: 12, color: r.accent }}>{s.unit}</span>
        </div>
        {s.title && (
          <div style={{ marginTop: 40 }}>
            <Title text={s.title} accent={r.accent} size={72} delay={6} />
          </div>
        )}
      </div>
      <CaptionBlock text={s.caption} />
    </AbsoluteFill>
  );
};

// Raw notes typed out, a lightning cut, then the finished line. Made for Flow, works
// for anything that turns input into output.
export const TypeScene: React.FC<P> = ({ s, r }) => {
  const f = useCurrentFrame();
  const before = s.before ?? "";
  const after = s.after ?? "";
  const typeEnd = Math.min(Math.round(s.dur * 0.42), Math.max(12, before.length * 0.9));
  const flipAt = typeEnd + 6;
  const shown = before.slice(0, Math.floor(interpolate(f, [2, typeEnd], [0, before.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const flash = interpolate(f, [flipAt - 2, flipAt, flipAt + 6], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const afterChars = Math.floor(interpolate(f, [flipAt, flipAt + 14], [0, after.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const meterT = interpolate(f, [flipAt + 8, flipAt + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const caret = Math.floor(f / 8) % 2 === 0;
  const card: React.CSSProperties = {
    background: "rgba(11,14,20,0.92)",
    border: `1.5px solid ${LINE}`,
    borderRadius: 20,
    padding: "34px 38px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
    width: SAFE.right - SAFE.left,
  };
  const label: React.CSSProperties = { fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: DIM, marginBottom: 16, textTransform: "uppercase" };
  return (
    <AbsoluteFill>
      <Backdrop accent={r.accent} />
      <MediaLayer media={s.media} accent={r.accent} dur={s.dur} dim={0.7} />
      {s.title && <WordsBlock s={{ ...s, sub: undefined }} accent={r.accent} size={76} top={SAFE.top - 20} />}
      <div style={{ position: "absolute", top: 560, left: SAFE.left, display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={card}>
          <div style={label}>{s.labels?.[0] ?? "what you wrote"}</div>
          <div style={{ fontFamily: MONO, fontSize: before.length > 120 ? 30 : before.length < 60 ? 44 : 38, lineHeight: 1.35, color: PAPER, minHeight: 104, whiteSpace: "pre-wrap" }}>
            {shown}
            {f < flipAt && <span style={{ opacity: caret ? 1 : 0, color: r.accent }}>▍</span>}
          </div>
        </div>
        <div style={{ ...card, opacity: f >= flipAt ? 1 : 0.25, borderColor: f >= flipAt ? r.accent : `${r.accent}33` }}>
          <div style={{ ...label, color: r.accent }}>{s.labels?.[1] ?? "what comes out"}</div>
          <div
            style={{
              fontFamily: s.mono ? MONO : BODY,
              fontWeight: s.mono ? 400 : 600,
              fontSize: after.length > 150 ? (s.mono ? 30 : 34) : s.mono ? 37 : 40,
              lineHeight: 1.35,
              color: PAPER,
              minHeight: 160,
              whiteSpace: "pre-wrap",
            }}
          >
            {after.slice(0, afterChars)}
          </div>
          {s.meter && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 26, color: DIM }}>
                <span>{s.meter.label ?? "lines used"}</span>
                <span style={{ color: meterT >= 1 ? "#5fe3a1" : PAPER }}>
                  {Math.round(s.meter.used * meterT)} / {s.meter.limit} {meterT >= 1 ? "✓" : ""}
                </span>
              </div>
              <div style={{ height: 12, borderRadius: 6, background: "#1c2433", marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(s.meter.used / s.meter.limit) * 100 * meterT}%`, background: `linear-gradient(90deg, ${r.accent}, #5fe3a1)` }} />
              </div>
            </div>
          )}
        </div>
      </div>
      <AbsoluteFill style={{ background: r.accent, opacity: flash * 0.18, mixBlendMode: "screen" }} />
      <CaptionBlock text={s.caption} y={1230} />
    </AbsoluteFill>
  );
};

// Two pictures stacked with a wipe: reference vs result, before vs after, CAD vs print.
export const Split: React.FC<P> = ({ s, r }) => {
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const wipe = spring({ frame: f - 4, fps, config: { damping: 18, stiffness: 120 } });
  const half = height / 2;
  const lbl = (t: string | undefined, color: string): React.ReactNode =>
    t ? (
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 10, fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 3, textTransform: "uppercase", color: INK, background: color, padding: "8px 18px", borderRadius: 10 }}>
        {t}
      </div>
    ) : null;
  return (
    <AbsoluteFill>
      <Backdrop accent={r.accent} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: half, overflow: "hidden" }}>
        <MediaLayer media={s.media} accent={r.accent} dur={s.dur} />
        {lbl(s.labels?.[0], PAPER)}
      </div>
      <div style={{ position: "absolute", top: half, left: 0, right: 0, height: half, overflow: "hidden", clipPath: `inset(0 ${100 - wipe * 100}% 0 0)` }}>
        <MediaLayer media={s.media2} accent={r.accent} dur={s.dur} />
        <div style={{ position: "absolute", top: SAFE.bottom - half - 70, left: SAFE.left, fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 3, textTransform: "uppercase", color: INK, background: r.accent, padding: "8px 18px", borderRadius: 10 }}>
          {s.labels?.[1]}
        </div>
      </div>
      <div style={{ position: "absolute", top: half - 2, left: 0, width: `${wipe * 100}%`, height: 4, background: r.accent }} />
      {s.title && (
        <div style={{ position: "absolute", top: half - 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ background: INK, padding: "14px 30px", borderRadius: 14, border: `1.5px solid ${LINE}` }}>
            <Title text={s.title} accent={r.accent} size={64} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Every part of a print at once.
export const Grid: React.FC<P> = ({ s, r }) => (
  <AbsoluteFill>
    <Backdrop accent={r.accent} intensity={1.2} />
    <div style={{ position: "absolute", top: 380, left: 0, right: 0, bottom: 420 }}>
      <AbsoluteFill>
        <StlGrid
          items={(s.items ?? []).map((m) => ({ src: m.src, color: m.color }))}
          accent={r.accent}
          cols={(s.items?.length ?? 0) > 9 ? 4 : (s.items?.length ?? 0) > 4 ? 3 : 2}
          width={1080}
          height={1920 - 380 - 420}
        />
      </AbsoluteFill>
    </div>
    <WordsBlock s={s} accent={r.accent} size={88} top={SAFE.top - 10} />
    <CaptionBlock text={s.caption} y={1250} />
  </AbsoluteFill>
);

// The end card: the mark, the name, the handle, one line of call to action. It sits on the
// same backdrop as the hook so the Reel loops cleanly.
export const End: React.FC<P> = ({ s, r }) => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  return (
    <AbsoluteFill>
      <Backdrop accent={r.accent} intensity={0.6} />
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <div style={{ opacity: draw, transform: `translateY(${(1 - draw) * 20}px)` }}>
          <LogoMark size={250} color={PAPER} accent={r.accent} />
        </div>
        <div style={{ opacity: draw }}>
          <Wordmark size={96} color={PAPER} dim={DIM} font={DISPLAY} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 34, letterSpacing: 2, color: DIM, marginTop: -18, opacity: draw }}>{r.handle}</div>
        <div style={{ width: 120, height: 2, background: LINE, margin: "10px 0" }} />
        {s.title && <Title text={s.title} accent={r.accent} size={66} delay={6} />}
        {s.sub && <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 36, color: DIM, marginTop: -10, textAlign: "center", maxWidth: 820 }}>{s.sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

// One tip: a small label ("TIP 2 OF 3"), the rule in big words, one plain line of why.
// Sits on the backdrop (or dimmed footage) so the words are the whole picture.
export const Tip: React.FC<P> = ({ s, r }) => {
  const f = useCurrentFrame();
  const label = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const body = interpolate(f, [14, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop accent={r.accent} />
      <MediaLayer media={s.media} accent={r.accent} dur={s.dur} dim={0.78} />
      <div style={{ position: "absolute", top: 470, left: SAFE.left, width: SAFE.right - SAFE.left, display: "flex", flexDirection: "column", gap: 36 }}>
        {s.index && (
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 5, textTransform: "uppercase", color: r.accent, opacity: label }}>{s.index}</div>
        )}
        {s.title && <Title text={s.title} accent={r.accent} size={s.title.length > 36 ? 84 : 100} align="left" delay={4} />}
        {s.body && (
          <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 44, lineHeight: 1.35, color: DIM, maxWidth: 860, opacity: body, transform: `translateY(${(1 - body) * 14}px)` }}>
            {s.body}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const SCENES: Record<Scene["type"], React.FC<P>> = {
  hook: Hook,
  media: MediaScene,
  stat: Stat,
  type: TypeScene,
  split: Split,
  grid: Grid,
  tip: Tip,
  end: End,
};

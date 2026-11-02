import React from "react";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { Backdrop } from "./components/Backdrop";
import { LogoMark, Wordmark as WordmarkText } from "./components/Logo";
import { MediaLayer } from "./components/MediaLayer";
import { Tag, Title } from "./components/Words";
import { DIM, DISPLAY, INK, INK_2, LINE, MONO, PAPER, SIGNAL } from "./theme";
import type { ReelProps } from "./types";

// The profile picture: the mark alone on graphite. Instagram shows it as a ~110 px
// circle, so it has to read at that size; the wordmark lives in the name field instead.
export const Avatar: React.FC<{ variant: "mark" | "light" }> = ({ variant }) => (
  <AbsoluteFill style={{ background: variant === "light" ? PAPER : INK, alignItems: "center", justifyContent: "center" }}>
    {variant !== "light" && <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% 45%, ${INK_2} 0%, ${INK} 100%)` }} />}
    <div style={{ position: "relative" }}>
      <LogoMark size={720} color={variant === "light" ? INK : PAPER} accent={SIGNAL} stroke={7} ring={false} />
    </div>
  </AbsoluteFill>
);

const ICONS: Record<string, React.ReactNode> = {
  apps: <path d="M38 30 L16 50 L38 70 M62 30 L84 50 L62 70 M56 22 L44 78" />,
  prints: (
    <>
      <path d="M50 14 L82 32 L82 68 L50 86 L18 68 L18 32 Z" />
      <path d="M18 32 L50 50 L82 32 M50 50 L50 86" />
    </>
  ),
  burnline: (
    <>
      <circle cx="50" cy="50" r="13" />
      <ellipse cx="50" cy="50" rx="38" ry="16" transform="rotate(-25 50 50)" />
      <circle cx="82" cy="36" r="4" fill="currentColor" />
    </>
  ),
  ghost: (
    <>
      <path d="M50 12 L74 50 L50 88 L26 50 Z" />
      <circle cx="50" cy="50" r="9" />
      <path d="M26 50 L12 50 M74 50 L88 50" />
    </>
  ),
  wisp: (
    <>
      <path d="M50 12 C66 34 76 46 76 62 C76 78 64 88 50 88 C36 88 24 78 24 62 C24 50 32 44 36 34 C40 44 44 46 48 46 C46 34 46 24 50 12 Z" />
      <circle cx="42" cy="64" r="3.5" fill="currentColor" />
      <circle cx="58" cy="64" r="3.5" fill="currentColor" />
    </>
  ),
  flow: <path d="M58 10 L26 56 L48 56 L40 90 L74 42 L52 42 Z" />,
  wip: (
    <>
      <circle cx="50" cy="50" r="34" />
      <path d="M50 28 L50 50 L66 60" />
    </>
  ),
};

// Story highlight covers. Instagram crops the middle into a circle, so a thin-line icon
// sits dead centre on graphite, the project's accent on the icon only.
export const Highlight: React.FC<{ icon: string; accent?: string }> = ({ icon, accent = SIGNAL }) => (
  <AbsoluteFill style={{ background: INK, alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 760, height: 760, borderRadius: "50%", border: `6px solid ${LINE}`, background: INK_2, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 100 100" width={460} height={460} fill="none" stroke={PAPER} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" style={{ color: accent }}>
        {ICONS[icon] ?? ICONS.apps}
      </svg>
    </div>
  </AbsoluteFill>
);

// The grid thumbnail. The profile grid shows the middle 3:4 of a Reel (1080x1440), so
// the title sits inside that band and reads at thumbnail size.
export const Cover: React.FC<ReelProps> = (r) => {
  const hook = r.scenes[0];
  const title = (hook as { cover?: string }).cover ?? hook.title ?? r.project.name;
  return (
    <AbsoluteFill style={{ background: INK }}>
      <Backdrop accent={r.accent} />
      <MediaLayer media={hook.media} accent={r.accent} dur={1} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,12,15,0.15) 25%, rgba(10,12,15,0.78) 60%, rgba(10,12,15,0.94) 100%)" }} />
      <div style={{ position: "absolute", top: 1030, left: 90, right: 90, display: "flex", flexDirection: "column", gap: 30 }}>
        <Tag name={r.project.name} kind={r.project.kind} accent={r.accent} />
        <Title text={title} accent={r.accent} size={title.length > 34 ? 92 : 112} align="left" stagger={0} delay={-20} />
      </div>
      <div style={{ position: "absolute", top: 270, left: 90, display: "flex", alignItems: "center", gap: 18 }}>
        <LogoMark size={64} color={PAPER} accent={r.accent} ring={false} stroke={8} />
        <span style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: PAPER, opacity: 0.85, textTransform: "uppercase" }}>Kojo Labs</span>
      </div>
    </AbsoluteFill>
  );
};

// Banner for the README, link pages and anywhere a wide logo is needed.
export const Wordmark: React.FC = () => (
  <AbsoluteFill style={{ background: INK, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 70 }}>
    <LogoMark size={300} color={PAPER} accent={SIGNAL} />
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <WordmarkText size={190} color={PAPER} dim={DIM} font={DISPLAY} />
      <div style={{ fontFamily: MONO, fontSize: 38, color: DIM, letterSpacing: 8, textTransform: "uppercase" }}>Software · Hardware · Open source</div>
    </div>
  </AbsoluteFill>
);

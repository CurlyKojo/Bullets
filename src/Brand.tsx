import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import "./fonts";
import { Backdrop } from "./components/Backdrop";
import { MediaLayer } from "./components/MediaLayer";
import { Tag, Title } from "./components/Words";
import { DISPLAY, GOLD, INK, MONO, PAPER, VOLT } from "./theme";
import type { ReelProps } from "./types";

// The profile picture. Instagram shows it as a ~110 px circle, so the crop is the face
// and the hair's lightning, not the whole figure.
export const Avatar: React.FC<{ variant: "face" | "full" }> = ({ variant }) => (
  <AbsoluteFill style={{ background: INK }}>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${VOLT}55 0%, ${INK} 68%)` }} />
    <Img
      src={staticFile("brand/kojo.png")}
      style={
        variant === "face"
          ? { position: "absolute", width: 1720, height: 1720, left: -330, top: -230 }
          : { position: "absolute", width: 1080, height: 1080, left: 0, top: 0 }
      }
    />
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

// Story highlight covers. Instagram crops the middle into a circle, so the icon sits dead
// centre on the brand backdrop.
export const Highlight: React.FC<{ icon: string; accent?: string }> = ({ icon, accent = VOLT }) => (
  <AbsoluteFill style={{ background: INK, alignItems: "center", justifyContent: "center" }}>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${accent}40 0%, ${INK} 40%)` }} />
    <div style={{ width: 760, height: 760, borderRadius: "50%", border: `18px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 120px ${accent}66 inset` }}>
      <svg viewBox="0 0 100 100" width={540} height={540} fill="none" stroke={accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ color: accent, filter: `drop-shadow(0 0 18px ${accent})` }}>
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
      <Backdrop accent={r.accent} intensity={1.3} />
      <MediaLayer media={hook.media} accent={r.accent} dur={1} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,7,13,0.2) 20%, rgba(5,7,13,0.75) 62%, rgba(5,7,13,0.9) 100%)" }} />
      <div style={{ position: "absolute", top: 1060, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 26 }}>
        <Tag name={r.project.name} kind={r.project.kind} accent={r.accent} />
        <Title text={title} accent={r.accent} size={title.length > 34 ? 96 : 118} align="left" stagger={0} />
      </div>
      <div style={{ position: "absolute", top: 260, right: 80, fontFamily: MONO, fontSize: 30, color: PAPER, opacity: 0.8 }}>{r.handle}</div>
    </AbsoluteFill>
  );
};

// What the profile looks like with the first nine posts, for the launch plan.
export const Wordmark: React.FC = () => (
  <AbsoluteFill style={{ background: INK, alignItems: "center", justifyContent: "center" }}>
    <Backdrop accent={VOLT} intensity={1.2} />
    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 210, letterSpacing: -8, color: PAPER }}>
      kojo<span style={{ color: VOLT }}>.</span>builds
    </div>
    <div style={{ fontFamily: MONO, fontSize: 44, color: GOLD, marginTop: 10, letterSpacing: 6 }}>CODE · PRINT · SHIP</div>
  </AbsoluteFill>
);

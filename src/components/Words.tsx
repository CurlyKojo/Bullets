import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, DISPLAY, INK, MONO, PAPER } from "../theme";

// Splits "I printed a *Ghost*" into words, marking the starred ones as accent.
const tokens = (text: string) =>
  text.split(/\s+/).filter(Boolean).map((w) => {
    const hot = /^\*.*\*[.,!?:;]*$/.test(w);
    return { word: hot ? w.replace(/\*/g, "") : w, hot };
  });

// The headline. Words pop in one after another on a short stagger, which reads as
// "fast" without being unreadable, then hold still.
export const Title: React.FC<{
  text: string;
  accent: string;
  size?: number;
  delay?: number;
  stagger?: number;
  align?: "left" | "center";
  maxWidth?: number;
}> = ({ text, accent, size = 104, delay = 0, stagger = 2.5, align = "center", maxWidth = 900 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -size * 0.03,
        color: PAPER,
        textAlign: align,
        maxWidth,
        textWrap: "balance",
        textShadow: "0 6px 30px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.6)",
      }}
    >
      {tokens(text).map((t, i) => {
        const s = spring({ frame: f - delay - i * stagger, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: size * 0.22,
              transform: `translateY(${(1 - s) * size * 0.5}px) scale(${0.85 + 0.15 * s})`,
              opacity: Math.min(1, s * 1.4),
              color: t.hot ? accent : PAPER,
            }}
          >
            {t.word}
          </span>
        );
      })}
    </div>
  );
};

// The white rounded chip under the title, the way native Reels captions look.
export const Caption: React.FC<{ text: string; delay?: number }> = ({ text, delay = 6 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 16, stiffness: 180 } });
  return (
    <div
      style={{
        display: "inline-block",
        fontFamily: BODY,
        fontWeight: 650,
        fontSize: 44,
        lineHeight: 1.25,
        color: INK,
        background: PAPER,
        padding: "14px 26px",
        borderRadius: 18,
        maxWidth: 820,
        textAlign: "center",
        boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
        transform: `translateY(${(1 - s) * 30}px)`,
        opacity: s,
      }}
    >
      {text}
    </div>
  );
};

// Small mono label: "GHOST · 3D PRINT". Tells a cold viewer what they're looking at.
export const Tag: React.FC<{ name: string; kind: string; accent: string }> = ({ name, kind, accent }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: PAPER,
        opacity: o,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 7, background: accent, boxShadow: `0 0 18px ${accent}` }} />
      {name}
      <span style={{ opacity: 0.55 }}>· {kind}</span>
    </div>
  );
};

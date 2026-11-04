import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { BODY, DISPLAY, MONO, PAPER } from "../theme";

// Splits "I gave my *Raspberry Pi* a face" into words, marking everything between a pair
// of stars as accent. A highlight can span several words.
const tokens = (text: string) => {
  let hot = false;
  return text.split(/\s+/).filter(Boolean).map((w) => {
    const opens = w.startsWith("*");
    const closes = /\*[.,!?:;]*$/.test(w) && (w.length > 1 || !opens);
    const isHot = hot || opens;
    if (opens && !closes) hot = true;
    if (closes && !(opens && w === "*")) hot = false;
    return { word: w.replace(/\*/g, ""), hot: isHot };
  });
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

// The headline. Each word arrives by settling down from slightly oversize, decelerating:
// most of the travel in the first few frames, then a long tail, no bounce. Words land
// 5 frames apart (3 in hooks), the rhythm of someone saying them.
export const Title: React.FC<{
  text: string;
  accent: string;
  size?: number;
  delay?: number;
  stagger?: number;
  align?: "left" | "center";
  maxWidth?: number;
}> = ({ text, accent, size = 100, delay = 0, stagger = 5, align = "center", maxWidth = 900 }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: -size * 0.035,
        color: PAPER,
        textAlign: align,
        maxWidth,
        textWrap: "balance",
        textShadow: "0 2px 24px rgba(10,12,15,0.85), 0 1px 3px rgba(10,12,15,0.7)",
      }}
    >
      {tokens(text).map((t, i) => {
        const p = interpolate(f - delay - i * stagger, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: size * 0.24,
              transform: `translateY(${(1 - p) * size * 0.12}px) scale(${1 + (1 - p) * 0.35})`,
              opacity: Math.min(1, p * 2),
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

// The subtitle under a headline: same family, lighter weight, no box. It fades up a beat
// after the headline so the two read as one title block. (A boxed caption chip was used
// before; it looked pasted on rather than designed.)
export const Caption: React.FC<{ text: string; delay?: number; align?: "left" | "center" }> = ({ text, delay = 8, align = "center" }) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <div
      style={{
        fontFamily: BODY,
        fontWeight: 500,
        fontSize: 46,
        lineHeight: 1.28,
        letterSpacing: -0.4,
        color: PAPER,
        maxWidth: 860,
        textAlign: align,
        textWrap: "balance",
        textShadow: "0 2px 18px rgba(10,12,15,0.9), 0 1px 3px rgba(10,12,15,0.8)",
        transform: `translateY(${(1 - p) * 12}px)`,
        opacity: p * 0.9,
      }}
    >
      {text}
    </div>
  );
};

// Project label: "GHOST — HARDWARE · AI". Tells a cold viewer what they're looking at.
export const Tag: React.FC<{ name: string; kind: string; accent: string }> = ({ name, kind, accent }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp", easing: ease });
  return (
    <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: PAPER, opacity: p, display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ width: 36 * p, height: 3, background: accent }} />
      {name}
      <span style={{ opacity: 0.5 }}>/ {kind}</span>
    </div>
  );
};

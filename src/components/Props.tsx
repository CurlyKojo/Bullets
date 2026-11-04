import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";

// Floating 3D props: Microsoft's Fluent 3D emoji (MIT, public/emoji/LICENSE.txt) drifting
// around the edges of text-led scenes. They're plain images moved with CSS, so they add
// depth for almost no render cost. Placed where the words and the 3D object aren't:
// right of the headline's lower edge, below-left of the object, and one small, blurred
// one far back.

const SETS: Record<string, string[]> = {
  prompt: ["light-bulb", "speech-balloon", "memo"],
  code: ["laptop", "gear", "bug"],
  ai: ["robot", "brain", "sparkles"],
};

// x, y are the centre in pixels; size in pixels; depth 0 (near) .. 1 (far).
const SLOTS = [
  { x: 905, y: 990, size: 170, depth: 0.15, phase: 0.0 },
  { x: 170, y: 1440, size: 190, depth: 0.0, phase: 1.9 },
  { x: 860, y: 1580, size: 115, depth: 0.85, phase: 3.4 },
];

export const FloatingProps: React.FC<{ kind: string; delay?: number }> = ({ kind, delay = 8 }) => {
  const f = useCurrentFrame();
  const set = SETS[kind];
  if (!set) return null;
  const t = f / 30;
  return (
    <>
      {SLOTS.map((s, i) => {
        const appear = interpolate(f, [delay + i * 4, delay + i * 4 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const pop = 0.6 + 0.4 * (1 - Math.pow(1 - appear, 3));
        const bob = Math.sin(t * 1.1 + s.phase) * 14 * (1 - s.depth * 0.5);
        const sway = Math.sin(t * 0.7 + s.phase) * 9;
        const tilt = Math.sin(t * 0.9 + s.phase) * 8;
        return (
          <Img
            key={i}
            src={staticFile(`emoji/${set[i % set.length]}.png`)}
            style={{
              position: "absolute",
              left: s.x - s.size / 2,
              top: s.y - s.size / 2,
              width: s.size,
              height: s.size,
              opacity: appear * (1 - s.depth * 0.45),
              transform: `translate(${sway}px, ${bob}px) rotate(${tilt}deg) scale(${pop})`,
              filter: `drop-shadow(0 ${18 - s.depth * 10}px ${22 - s.depth * 8}px rgba(0,0,0,0.45))${s.depth > 0.5 ? " blur(2px)" : ""}`,
            }}
          />
        );
      })}
    </>
  );
};

// Drifting dust in CSS: the same feel as the 3D particles, without a WebGL canvas.
const DUST = (() => {
  let seed = 11;
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 70 }, () => ({ x: r() * 1080, y: r() * 1920, s: 2 + r() * 4, v: 14 + r() * 30, o: 0.25 + r() * 0.5 }));
})();

export const Dust: React.FC<{ accent: string }> = ({ accent }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <>
      {DUST.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x + Math.sin(t * 0.5 + i) * 10,
            top: (((d.y - t * d.v) % 1920) + 1920) % 1920,
            width: d.s,
            height: d.s,
            borderRadius: "50%",
            background: accent,
            opacity: d.o,
            boxShadow: `0 0 ${d.s * 2}px ${accent}`,
          }}
        />
      ))}
    </>
  );
};

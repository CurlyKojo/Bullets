import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";

// One floating 3D prop: a Microsoft Fluent 3D emoji (MIT, public/emoji/LICENSE.txt) that
// drifts beside the 3D object on the first tip card of a Reel. Used sparingly on purpose:
// one emoji, one scene, picked to match the tip, never decoration for its own sake.

const PICK: Record<string, string> = { prompt: "light-bulb", code: "laptop", ai: "brain" };

export const FloatingProps: React.FC<{ kind: string; delay?: number }> = ({ kind, delay = 10 }) => {
  const f = useCurrentFrame();
  const name = PICK[kind];
  if (!name) return null;
  const t = f / 30;
  const appear = interpolate(f, [delay, delay + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = 150;
  return (
    <Img
      src={staticFile(`emoji/${name}.png`)}
      style={{
        position: "absolute",
        left: 880 - size / 2,
        top: 1000 - size / 2,
        width: size,
        height: size,
        opacity: appear,
        transform: `translate(${Math.sin(t * 0.7) * 8}px, ${Math.sin(t * 1.1) * 12}px) rotate(${Math.sin(t * 0.9) * 7}deg) scale(${0.7 + 0.3 * appear})`,
        filter: "drop-shadow(0 16px 20px rgba(0,0,0,0.45))",
      }}
    />
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

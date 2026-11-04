// Animated grain gradient for text-led scenes: two soft pools of the accent colour that
// drift slowly, over moving film grain. Pure CSS and SVG, so it costs nothing to render
// and looks identical on every machine. (A WebGL shader version was tried first; in
// software rendering it was 2-4x slower and its noise texture loaded too late to show.)
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// Fine monochrome noise as an SVG data URI, tiled.
const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
)}")`;

export const Grain: React.FC<{ accent: string }> = ({ accent }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  // Two pools on slow, out-of-phase orbits.
  const ax = 30 + Math.sin(t * 0.35) * 18;
  const ay = 34 + Math.cos(t * 0.28) * 12;
  const bx = 72 + Math.cos(t * 0.31 + 1.7) * 16;
  const by = 74 + Math.sin(t * 0.24 + 0.6) * 10;
  // Grain shifts every two frames, like film, rather than crawling smoothly.
  const step = Math.floor(f / 2);
  const gx = (step * 37) % 220;
  const gy = (step * 61) % 220;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 38% at ${ax}% ${ay}%, ${accent}55 0%, ${accent}1f 45%, transparent 75%), radial-gradient(50% 34% at ${bx}% ${by}%, ${accent}3d 0%, ${accent}14 50%, transparent 78%)`,
        }}
      />
      <AbsoluteFill style={{ backgroundImage: NOISE, backgroundPosition: `${gx}px ${gy}px`, opacity: 0.09, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

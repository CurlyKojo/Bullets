// Animated gradient for text-led scenes: two soft pools of the accent colour drifting on
// slow orbits. Pure CSS, deterministic. A film-grain layer on top was measured at ~20% of
// every frame's render time for a barely visible effect, so it was dropped. (A WebGL shader version was tried first; in
// software rendering it was 2-4x slower and its noise texture loaded too late to show.)
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Grain: React.FC<{ accent: string }> = ({ accent }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  // Two pools on slow, out-of-phase orbits.
  const ax = 30 + Math.sin(t * 0.35) * 18;
  const ay = 34 + Math.cos(t * 0.28) * 12;
  const bx = 72 + Math.cos(t * 0.31 + 1.7) * 16;
  const by = 74 + Math.sin(t * 0.24 + 0.6) * 10;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 38% at ${ax}% ${ay}%, ${accent}55 0%, ${accent}1f 45%, transparent 75%), radial-gradient(50% 34% at ${bx}% ${by}%, ${accent}3d 0%, ${accent}14 50%, transparent 78%)`,
        }}
      />
    </AbsoluteFill>
  );
};

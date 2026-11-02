import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { INK, INK_2 } from "../theme";

// Ink background with a slow-drifting dot grid and a glow in the accent colour. Used under
// every scene so nothing is ever flat black.
export const Backdrop: React.FC<{ accent: string; intensity?: number }> = ({ accent, intensity = 1 }) => {
  const f = useCurrentFrame();
  const drift = (f * 0.6) % 48;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 35%, ${INK_2} 0%, ${INK} 70%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${accent}33 1.6px, transparent 1.8px)`,
          backgroundSize: "48px 48px",
          backgroundPosition: `0px ${drift}px`,
          opacity: 0.55 * intensity,
          maskImage: "radial-gradient(80% 60% at 50% 40%, black 30%, transparent 85%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(50% 30% at 50% ${38 + Math.sin(f / 40) * 3}%, ${accent}2e 0%, transparent 70%)`,
          opacity: intensity,
        }}
      />
    </AbsoluteFill>
  );
};

// Darkens the top and bottom so white words read over any footage.
export const Scrim: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(5,7,13,${0.75 * strength}) 0%, rgba(5,7,13,${0.15 * strength}) 32%, rgba(5,7,13,${0.1 * strength}) 55%, rgba(5,7,13,${0.85 * strength}) 100%)`,
    }}
  />
);

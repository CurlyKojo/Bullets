import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { INK, INK_2 } from "../theme";
import { Grain } from "./Grain";

// Graphite with a faint engineering grid that drifts slowly, and a soft pool of the
// project's accent behind the subject. Present, never loud.
export const Backdrop: React.FC<{ accent: string; intensity?: number; shader?: boolean }> = ({ accent, intensity = 1, shader = false }) => {
  const f = useCurrentFrame();
  const drift = (f * 0.4) % 60;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${INK_2} 0%, ${INK} 60%)` }}>
      {/* Text-led scenes (tips, end card) get the moving grain gradient; footage scenes
          keep the plain grid, since the footage is the picture there. */}
      {shader && <Grain accent={accent} />}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: `0px ${drift}px`,
          maskImage: "radial-gradient(75% 55% at 50% 42%, black 25%, transparent 85%)",
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(45% 26% at 50% 45%, ${accent}1f 0%, transparent 70%)`, opacity: intensity }} />
    </AbsoluteFill>
  );
};

// Darkens the top and bottom so words read over any footage.
export const Scrim: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(10,12,15,${0.82 * strength}) 0%, rgba(10,12,15,${0.2 * strength}) 34%, rgba(10,12,15,${0.08 * strength}) 55%, rgba(10,12,15,${0.85 * strength}) 100%)`,
    }}
  />
);

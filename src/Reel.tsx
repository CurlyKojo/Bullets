import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import "./fonts";
import { SCENES } from "./scenes/Scenes";
import type { ReelProps } from "./types";

// A faint lift on every cut, three frames long. Enough to make the cut land on the beat.
const CutFlash: React.FC<{ at: number; accent: string }> = ({ at, accent }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + 3], [0, 0.12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: accent, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

// The retention bar along the very top edge.
const Progress: React.FC<{ total: number; accent: string }> = ({ total, accent }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 0, left: 0, height: 5, width: `${(f / total) * 100}%`, background: accent }} />
  );
};

export const Reel: React.FC<ReelProps> = (props) => {
  const { scenes, accent, total } = props;
  return (
    <AbsoluteFill style={{ background: "#05070d" }}>
      {scenes.map((s, i) => {
        const C = SCENES[s.type];
        return (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`${i} ${s.type}`}>
            <C s={s} r={props} />
          </Sequence>
        );
      })}
      {scenes.slice(1).map((s, i) => (
        <CutFlash key={i} at={s.from} accent={accent} />
      ))}
      <Progress total={total} accent={accent} />
    </AbsoluteFill>
  );
};

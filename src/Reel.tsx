import React from "react";
import { linearTiming, type TransitionPresentation, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { lightLeak } from "./components/LightLeak";
import { SCENES } from "./scenes/Scenes";
import type { ReelProps, Scene } from "./types";

// How each cut moves. The cut out of the hook is where the song's first big hit lands,
// so it gets the light leak; the end card fades in; everything else is a quick slide that
// alternates direction so the edit never feels mechanical.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transitionFor = (i: number, next: Scene, accent: string): { T: number; p: TransitionPresentation<any> } => {
  if (i === 0) return { T: 16, p: lightLeak({ colors: [accent, `color-mix(in srgb, ${accent} 60%, white)`, `color-mix(in srgb, ${accent} 25%, white)`, "#f4f6f8"], origin: "left", intensity: 0.9 }) };
  if (next.type === "end") return { T: 12, p: fade() };
  return { T: 10, p: slide({ direction: i % 2 ? "from-right" : "from-bottom" }) };
};

export const Reel: React.FC<ReelProps> = (props) => {
  const { scenes, accent, total } = props;
  // Every transition is centred on its beat: it starts T/2 before the cut and ends T/2
  // after, so the moment the new scene takes over still lands on the grid the song was
  // timed to. A scene's sequence therefore runs its own length plus half of each
  // neighbouring transition (TransitionSeries overlaps them).
  const tr = scenes.slice(1).map((s, i) => transitionFor(i, s, accent));
  const half = (k: number) => (k >= 0 && k < tr.length ? tr[k].T / 2 : 0);
  return (
    <AbsoluteFill style={{ background: "#0a0c0f" }}>
      <TransitionSeries>
        {scenes.map((s, i) => {
          const C = SCENES[s.type];
          const len = s.dur + half(i - 1) + half(i);
          return (
            <React.Fragment key={i}>
              {i > 0 && <TransitionSeries.Transition presentation={tr[i - 1].p} timing={linearTiming({ durationInFrames: tr[i - 1].T })} />}
              <TransitionSeries.Sequence durationInFrames={len} name={`${i} ${s.type}`}>
                <C s={s} r={props} />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

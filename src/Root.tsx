import React from "react";
import { Composition, Still } from "remotion";
import { Avatar, Cover, Highlight, Wordmark } from "./Brand";
import { Reel } from "./Reel";
import { DEMO, type ReelProps } from "./types";
import { FPS, H, W } from "./theme";

export const Root: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={DEMO.total}
      defaultProps={DEMO}
      calculateMetadata={({ props }) => ({ durationInFrames: (props as ReelProps).total })}
    />
    <Still id="Cover" component={Cover} width={W} height={H} defaultProps={DEMO} />
    <Still id="Avatar" component={Avatar} width={1080} height={1080} defaultProps={{ variant: "mark" as const }} />
    <Still id="Highlight" component={Highlight} width={W} height={H} defaultProps={{ icon: "apps" }} />
    <Still id="Wordmark" component={Wordmark} width={1920} height={1080} />
  </>
);

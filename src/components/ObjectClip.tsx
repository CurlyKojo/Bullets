import React from "react";
import { AbsoluteFill } from "remotion";
import { Object3D, type Object3DKind } from "./Objects3D";
import { Dust } from "./Props";

// A 3D object at a place in the frame, over drifting dust. (Pre-rendering the objects into
// cached transparent clips was tried and measured: no faster, because the 3D was never the
// slow part, so they're drawn live.)
export const ObjectClip: React.FC<{ kind: Object3DKind; accent: string; y: number; size: number; dust?: boolean }> = ({ kind, accent, y, size, dust = true }) => (
  <AbsoluteFill>
    {dust && <Dust accent={accent} />}
    {kind !== "none" && <Object3D kind={kind} accent={accent} y={y} size={size} particles={false} />}
  </AbsoluteFill>
);

import React from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Media } from "../types";
import { StlTurntable } from "./Stl";

// Anything a scene can show, at full bleed, with a slow push so stills never sit dead.
export const MediaLayer: React.FC<{ media?: Media; accent: string; dur: number; dim?: number }> = ({
  media,
  accent,
  dur,
  dim = 0,
}) => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  if (!media || media.kind === "none" || !media.src) return null;
  const t = interpolate(f, [0, Math.max(1, dur)], [0, 1], { extrapolateRight: "clamp" });
  const zoom = media.zoom === "out" ? 1.14 - 0.1 * t : 1.04 + 0.1 * t;

  let inner: React.ReactNode = null;
  if (media.kind === "stl") {
    inner = <StlTurntable src={media.src} color={media.color} accent={accent} />;
  } else if (media.kind === "video") {
    inner = (
      <OffthreadVideo
        src={staticFile(media.src)}
        trimBefore={media.start ?? 0}
        muted
        style={{ width: "100%", height: "100%", objectFit: media.fit ?? "cover", transform: `scale(${zoom})` }}
      />
    );
  } else if (media.kind === "image") {
    const fit = media.fit ?? "contain";
    inner = (
      <>
        {fit === "contain" && (
          // The blurred copy fills the 9:16 frame behind a landscape or square image.
          <Img
            src={staticFile(media.src)}
            style={{
              position: "absolute",
              inset: -80,
              width: "calc(100% + 160px)",
              height: "calc(100% + 160px)",
              objectFit: "cover",
              filter: "blur(60px) brightness(0.45) saturate(1.3)",
            }}
          />
        )}
        <Img
          src={staticFile(media.src)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: fit,
            transform: `scale(${zoom}) translateY(${fit === "contain" ? height * 0.06 : 0}px)`,
          }}
        />
      </>
    );
  }
  return (
    <AbsoluteFill>
      {inner}
      {dim > 0 && <AbsoluteFill style={{ background: `rgba(5,7,13,${dim})` }} />}
    </AbsoluteFill>
  );
};

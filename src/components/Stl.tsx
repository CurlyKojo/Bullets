import React, { useEffect, useMemo, useState } from "react";
import { ThreeCanvas } from "@remotion/three";
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

// Loads STLs once, centres each on its bounding box, scales to unit size, and stands it
// up the way it prints (the generator writes Z-up, three.js is Y-up).
const useGeometries = (srcs: string[]) => {
  const [geoms, setGeoms] = useState<THREE.BufferGeometry[] | null>(null);
  const [handle] = useState(() => delayRender(`Loading STL ${srcs.join(", ")}`));
  const key = srcs.join("|");
  useEffect(() => {
    const loader = new STLLoader();
    Promise.all(
      srcs.map(
        (s) =>
          new Promise<THREE.BufferGeometry>((res, rej) =>
            loader.load(staticFile(s), (g) => {
              g.rotateX(-Math.PI / 2);
              g.computeBoundingBox();
              const box = g.boundingBox!;
              const c = new THREE.Vector3();
              box.getCenter(c);
              g.translate(-c.x, -c.y, -c.z);
              const size = new THREE.Vector3();
              box.getSize(size);
              const k = 1 / Math.max(size.x, size.y, size.z);
              g.scale(k, k, k);
              g.computeVertexNormals();
              res(g);
            }, undefined, rej),
          ),
      ),
    )
      .then((g) => {
        setGeoms(g);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return geoms;
};

const Lights: React.FC<{ accent: string }> = ({ accent }) => (
  <>
    <ambientLight intensity={0.35} />
    <hemisphereLight args={["#dfe9ff", "#101420", 0.7]} />
    <directionalLight position={[2.5, 3, 2]} intensity={2.2} />
    {/* Rim light in the accent colour: the edge glow that makes a grey print look premium. */}
    <directionalLight position={[-3, 1.5, -2.5]} intensity={2.6} color={accent} />
    <pointLight position={[0, -2, 2]} intensity={0.6} color="#ffffff" />
  </>
);

// One part, turning. A full revolution every 5 seconds, a slight tilt so the top reads.
export const StlTurntable: React.FC<{ src: string; color?: string; accent: string; scale?: number }> = ({
  src,
  color = "#e9e4da",
  accent,
  scale = 1,
}) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const geoms = useGeometries([src]);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 }),
    [color],
  );
  const angle = (f / (fps * 5)) * Math.PI * 2;
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0.35, 2.3], fov: 35 }}>
      <Lights accent={accent} />
      {geoms && (
        // A 9:16 frame is narrow: at this camera the view is ~0.82 units wide, so a unit-size
        // part is scaled to fill about three quarters of the width, and sits a little low so
        // the title above stays clear.
        <group rotation={[0.28, angle, 0]} scale={scale * 0.6 * Math.min(1, (width / height) / 0.5625)} position={[0, -0.12, 0]}>
          <mesh geometry={geoms[0]} material={mat} />
        </group>
      )}
    </ThreeCanvas>
  );
};

// Every part of a build at once, in a grid, each turning a little out of phase. One
// canvas for all of them so it renders as fast as a single part.
export const StlGrid: React.FC<{ items: { src: string; color?: string }[]; accent: string; cols?: number; width: number; height: number }> = ({
  items,
  accent,
  cols = 3,
  width,
  height,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const geoms = useGeometries(items.map((i) => i.src));
  const mats = useMemo(
    () => items.map((i) => new THREE.MeshStandardMaterial({ color: i.color ?? "#e9e4da", roughness: 0.55, metalness: 0.05 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map((i) => i.color).join()],
  );
  const rows = Math.ceil(items.length / cols);
  const gap = 1.25;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      orthographic
      camera={{ position: [0, 0, 10], zoom: Math.min(width / (cols * gap + 0.2), height / (rows * gap + 0.2)) }}
    >
      <Lights accent={accent} />
      {geoms?.map((g, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const x = (c - (cols - 1) / 2) * gap;
        const y = ((rows - 1) / 2 - r) * gap;
        const pop = Math.min(1, Math.max(0, (f - i * 2) / 8));
        const angle = (f / (fps * 4)) * Math.PI * 2 + i * 0.6;
        return (
          <group key={i} position={[x, y, 0]} rotation={[0.35, angle, 0]} scale={0.95 * pop}>
            <mesh geometry={g} material={mats[i]} />
          </group>
        );
      })}
    </ThreeCanvas>
  );
};

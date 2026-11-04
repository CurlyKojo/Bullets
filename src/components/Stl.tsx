import React, { useEffect, useMemo, useState } from "react";
import { ThreeCanvas } from "@remotion/three";
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

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

// Product-shot lighting: a soft studio environment made of light panels (no HDRI to
// download, so it renders the same offline), a key and fill, a rim in the project's
// accent, and a contact shadow to ground the part. (A postprocessing pass was tried and
// dropped: its composer doesn't draw under Remotion's frame-by-frame rendering.)
export const Studio: React.FC<{ accent: string; shadowY?: number; shadows?: boolean }> = ({ accent, shadowY = -0.55, shadows = true }) => (
  <>
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.2} position={[0, 3, 2]} scale={[6, 2, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
      <Lightformer form="rect" intensity={1.6} color={accent} position={[4, 0.5, -1]} rotation-y={-Math.PI / 2} scale={[3, 4, 1]} />
      <Lightformer form="ring" intensity={1} position={[0, 1, -5]} scale={3} />
    </Environment>
    <ambientLight intensity={0.15} />
    <directionalLight position={[2.5, 3, 2]} intensity={1.6} />
    <directionalLight position={[-3, 1.5, -2.5]} intensity={2.2} color={accent} />
    {shadows && <ContactShadows position={[0, shadowY, 0]} opacity={0.55} scale={3} blur={2.4} far={1.2} resolution={512} color="#000000" />}
  </>
);

const pla = (color: string) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.6, sheen: 0.2 });

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
  const mat = useMemo(() => pla(color), [color]);
  const angle = (f / (fps * 5)) * Math.PI * 2;
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0.35, 2.3], fov: 35 }} gl={{ antialias: true }}>
      <Studio accent={accent} shadowY={-0.42} />
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
    () => items.map((i) => pla(i.color ?? "#e9e4da")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map((i) => i.color).join()],
  );
  const rows = Math.ceil(items.length / cols);
  const gap = 1.25;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      gl={{ antialias: true }}
      orthographic
      camera={{ position: [0, 0, 10], zoom: Math.min(width / (cols * gap + 0.2), height / (rows * gap + 0.2)) }}
    >
      <Studio accent={accent} shadows={false} />
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

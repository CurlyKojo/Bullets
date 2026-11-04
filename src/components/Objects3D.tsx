import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { RoundedBox } from "@react-three/drei";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Studio } from "./Stl";

// 3D motion behind text-led scenes, so a tip is never just words on a flat background.
// Everything is built from primitives in code (no models to download) and driven by the
// frame number, so every render is identical. Lit with the same studio rig as the STL
// turntables.

export type Object3DKind = "prompt" | "code" | "ai" | "logo" | "none";

// Picks the object from the tag on the Reel: prompt tips get the chat bubble, coding tips
// the brackets, AI tips the network.
export const kindFor = (label: string): Object3DKind => {
  const l = label.toLowerCase();
  if (l.includes("prompt")) return "prompt";
  if (l.includes("coding") || l.includes("code")) return "code";
  return "ai";
};

const PAPER = "#f4f6f8";

// Seeded random, so the particle field is the same in every render.
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const mat = (color: string, emissive = 0) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: new THREE.Color(color), emissiveIntensity: emissive });

// Dust in the air: a few hundred specks drifting up through the frame at three depths.
const Particles: React.FC<{ accent: string; t: number }> = ({ accent, t }) => {
  const { positions, base } = useMemo(() => {
    const r = rng(7);
    const n = 260;
    const b = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      b[i * 3] = (r() - 0.5) * 4;
      b[i * 3 + 1] = (r() - 0.5) * 7;
      b[i * 3 + 2] = -r() * 3;
    }
    return { positions: new Float32Array(b), base: b };
  }, []);
  for (let i = 0; i < positions.length; i += 3) {
    const speed = 0.06 + ((i / 3) % 5) * 0.012;
    positions[i] = base[i] + Math.sin(t * 0.4 + i) * 0.05;
    positions[i + 1] = ((base[i + 1] + t * speed + 3.5) % 7) - 3.5;
    positions[i + 2] = base[i + 2];
  }
  const geom = useMemo(() => new THREE.BufferGeometry(), []);
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return (
    <points geometry={geom}>
      <pointsMaterial color={accent} size={0.022} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
    </points>
  );
};

// A chat bubble with the typing dots bouncing in turn, and a reply bubble behind it.
const Bubble: React.FC<{ accent: string; t: number }> = ({ accent, t }) => {
  const white = useMemo(() => mat(PAPER), []);
  const tint = useMemo(() => mat(accent, 0.15), [accent]);
  const dot = useMemo(() => mat(accent, 0.5), [accent]);
  return (
    <group rotation={[0.12 + Math.sin(t * 0.7) * 0.06, Math.sin(t * 0.5) * 0.45, Math.sin(t * 0.4) * 0.05]}>
      <group position={[0.45, 0.5, -0.6]} scale={0.7}>
        <RoundedBox args={[1.5, 0.85, 0.22]} radius={0.12} smoothness={4} material={tint} />
        <mesh material={tint} position={[0.55, -0.48, 0]} rotation={[0, 0, -0.6]}>
          <boxGeometry args={[0.22, 0.3, 0.22]} />
        </mesh>
      </group>
      <RoundedBox args={[1.7, 1.0, 0.26]} radius={0.14} smoothness={4} material={white} />
      <mesh material={white} position={[-0.6, -0.55, 0]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[0.26, 0.34, 0.26]} />
      </mesh>
      {[-0.38, 0, 0.38].map((x, i) => (
        <mesh key={i} material={dot} position={[x, Math.max(0, Math.sin(t * 6 - i * 0.9)) * 0.14, 0.16]}>
          <sphereGeometry args={[0.1, 32, 32]} />
        </mesh>
      ))}
    </group>
  );
};

// One bar of a chevron or slash, rounded so the highlights roll off the edges.
const Bar: React.FC<{ len: number; at: [number, number]; angle: number; material: THREE.Material }> = ({ len, at, angle, material }) => (
  <RoundedBox args={[len, 0.17, 0.17]} radius={0.06} smoothness={3} material={material} position={[at[0], at[1], 0]} rotation={[0, 0, angle]} />
);

// </> as three extruded strokes, turning slowly, with small code slabs drifting around.
const Brackets: React.FC<{ accent: string; t: number }> = ({ accent, t }) => {
  const m = useMemo(() => mat(accent, 0.2), [accent]);
  const w = useMemo(() => mat(PAPER), []);
  const slab = useMemo(() => mat("#3a4452", 0.05), []);
  const L = 0.62;
  const a = (40 * Math.PI) / 180;
  const cx = (L / 2) * Math.cos(a);
  const cy = (L / 2) * Math.sin(a);
  return (
    <group>
      <group rotation={[0.15, Math.sin(t * 0.55) * 0.6, 0]}>
        <group position={[-0.62, 0, 0]}>
          <Bar len={L} at={[cx, cy]} angle={a} material={m} />
          <Bar len={L} at={[cx, -cy]} angle={-a} material={m} />
        </group>
        <Bar len={1.05} at={[0.12, 0]} angle={(70 * Math.PI) / 180} material={w} />
        <group position={[0.86, 0, 0]}>
          <Bar len={L} at={[-cx, cy]} angle={-a} material={m} />
          <Bar len={L} at={[-cx, -cy]} angle={a} material={m} />
        </group>
      </group>
      {[
        [-1.05, 0.62, -0.9, 0.3],
        [1.08, 0.5, -1.2, 1.4],
        [-0.95, -0.7, -0.7, 2.2],
        [1.0, -0.66, -1.0, 3.1],
      ].map(([x, y, z, p], i) => (
        <group key={i} position={[x, y + Math.sin(t * 0.8 + p) * 0.08, z]} rotation={[Math.sin(t * 0.3 + p) * 0.3, t * 0.25 + p, 0]}>
          <RoundedBox args={[0.55, 0.36, 0.05]} radius={0.03} smoothness={2} material={slab} />
          {[0.1, 0, -0.1].map((ly, j) => (
            <mesh key={j} material={j === 1 ? m : w} position={[-0.06 + j * 0.03, ly, 0.03]}>
              <boxGeometry args={[0.3 - j * 0.06, 0.03, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

// A small neural network: nodes on a sphere, each linked to its nearest neighbours, with
// pulses of light running along the links. The whole thing turns slowly.
const Network: React.FC<{ accent: string; t: number }> = ({ accent, t }) => {
  const { nodes, edges } = useMemo(() => {
    const n = 26;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      pts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(0.95));
    }
    const set = new Set<string>();
    const e: [number, number][] = [];
    pts.forEach((p, i) => {
      pts
        .map((q, j) => ({ j, d: p.distanceTo(q) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
        .forEach(({ j }) => {
          const k = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!set.has(k)) {
            set.add(k);
            e.push([i, j]);
          }
        });
    });
    return { nodes: pts, edges: e };
  }, []);
  const node = useMemo(() => mat(accent, 0.6), [accent]);
  const link = useMemo(() => new THREE.MeshStandardMaterial({ color: PAPER, transparent: true, opacity: 0.35, roughness: 0.6 }), []);
  const pulse = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff" }), []);
  const up = new THREE.Vector3(0, 1, 0);
  return (
    <group rotation={[0.3, t * 0.35, 0.1]}>
      {nodes.map((p, i) => (
        <mesh key={i} material={node} position={p} scale={1 + Math.max(0, Math.sin(t * 2 + i)) * 0.35}>
          <sphereGeometry args={[0.055, 20, 20]} />
        </mesh>
      ))}
      {edges.map(([i, j], k) => {
        const a = nodes[i];
        const b = nodes[j];
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const dir = b.clone().sub(a);
        const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
        return (
          <mesh key={k} material={link} position={mid} quaternion={q}>
            <cylinderGeometry args={[0.008, 0.008, dir.length(), 6]} />
          </mesh>
        );
      })}
      {edges
        .filter((_, k) => k % 3 === 0)
        .map(([i, j], k) => {
          const s = (t * 0.7 + k * 0.37) % 1;
          return (
            <mesh key={k} material={pulse} position={nodes[i].clone().lerp(nodes[j], s)}>
              <sphereGeometry args={[0.025, 10, 10]} />
            </mesh>
          );
        })}
    </group>
  );
};

// The Kojo Labs mark in 3D: the same K as the 2D logo (upright, two arms, the node), with
// a thin ring around it.
const Logo: React.FC<{ accent: string; t: number }> = ({ accent, t }) => {
  const w = useMemo(() => mat(PAPER), []);
  const n = useMemo(() => mat(accent, 0.5), [accent]);
  const ring = useMemo(() => new THREE.MeshStandardMaterial({ color: PAPER, transparent: true, opacity: 0.35, roughness: 0.4 }), []);
  const armLen = Math.hypot(0.4, 0.48);
  const armA = Math.atan2(0.48, 0.4);
  return (
    <group rotation={[0, Math.sin(t * 0.8) * 0.55, 0]} position={[0, Math.sin(t * 1.1) * 0.03, 0]}>
      <RoundedBox args={[0.14, 0.98, 0.14]} radius={0.04} smoothness={3} material={w} position={[-0.3, 0, 0]} />
      <RoundedBox args={[armLen, 0.14, 0.14]} radius={0.04} smoothness={3} material={w} position={[0.14, 0.24, 0]} rotation={[0, 0, armA]} />
      <RoundedBox args={[armLen, 0.14, 0.14]} radius={0.04} smoothness={3} material={w} position={[0.14, -0.24, 0]} rotation={[0, 0, -armA]} />
      <mesh material={n} position={[-0.06, 0, 0.02]}>
        <sphereGeometry args={[0.12, 32, 32]} />
      </mesh>
      <mesh material={ring} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.95, 0.018, 16, 96]} />
      </mesh>
    </group>
  );
};

// Full-frame 3D layer. `y` places the object in the frame (pixels from the top for its
// centre) and `size` its height in pixels, so scenes can keep it clear of their words.
export const Object3D: React.FC<{ kind: Object3DKind; accent: string; y?: number; size?: number; particles?: boolean }> = ({
  kind,
  accent,
  y = 1180,
  size = 620,
  particles = true,
}) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  // Camera at z=6 with a 30° field of view sees ~3.2 units of height at z=0.
  const unitsPerPx = (2 * 6 * Math.tan((15 * Math.PI) / 180)) / height;
  const cy = (height / 2 - y) * unitsPerPx;
  const scale = (size * unitsPerPx) / 2;
  const body =
    kind === "prompt" ? <Bubble accent={accent} t={t} /> : kind === "code" ? <Brackets accent={accent} t={t} /> : kind === "ai" ? <Network accent={accent} t={t} /> : kind === "logo" ? <Logo accent={accent} t={t} /> : null;
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 6], fov: 30 }} gl={{ antialias: true }}>
      <Studio accent={accent} shadows={false} />
      {particles && <Particles accent={accent} t={t} />}
      {body && (
        <group position={[0, cy + Math.sin(t * 0.9) * 0.04, 0]} scale={scale}>
          {body}
        </group>
      )}
    </ThreeCanvas>
  );
};


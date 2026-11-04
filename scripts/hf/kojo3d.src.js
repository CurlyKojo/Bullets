// The 3D in a HyperFrames Reel, bundled by scripts/hf/engine.mjs into one file
// (assets/lib/kojo3d.min.js) with three.js. Everything is drawn from the scene clock: each
// scene calls draw(t) from its own timeline, so every frame is a pure function of time.
//
//   Kojo3D.turntables(canvas, items, accent)   real STL files on turntables (grids, single parts)
//   Kojo3D.object(canvas, kind, accent, opts)  the bubble / brackets / network behind tips
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const PAPER = "#f4f6f8";
const W = 1080;
const H = 1920;

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(W, H, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  return r;
}

// The studio rig: soft room reflections, a warm-white key from the upper left and a rim in
// the Reel's accent from behind.
function studio(renderer, scene, accent, scale = 1) {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-400 * scale, 600 * scale, 900 * scale);
  scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(accent), 2.2);
  rim.position.set(600 * scale, 200 * scale, -700 * scale);
  scene.add(rim);
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut4 = (x) => 1 - Math.pow(1 - x, 4);

// items: [{ src, x, y, size, color, delay }]; x/y are pixel centres, size the diameter.
// Each part settles in from slightly oversize and turns at a steady speed.
function turntables(canvas, items, accent) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  studio(renderer, scene, accent);
  const cam = new THREE.OrthographicCamera(0, W, 0, -H, -3000, 3000);
  const loader = new STLLoader();
  const pivots = [];
  return Promise.all(
    items.map((it, i) =>
      loader.loadAsync(it.src).then((g) => {
        g.computeVertexNormals();
        g.rotateX(-Math.PI / 2);
        g.computeBoundingBox();
        const c = new THREE.Vector3();
        g.boundingBox.getCenter(c);
        g.translate(-c.x, -c.y, -c.z);
        g.computeBoundingSphere();
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(it.color || "#d3d8e0"), metalness: 0.15, roughness: 0.42, transparent: true });
        const pivot = new THREE.Group();
        pivot.add(new THREE.Mesh(g, mat));
        pivot.userData = { base: it.size / 2 / g.boundingSphere.radius, x: it.x, y: it.y, i, delay: it.delay || 0 };
        scene.add(pivot);
        pivots.push(pivot);
      }),
    ),
  ).then(() => ({
    draw(t) {
      for (const p of pivots) {
        const u = p.userData;
        const e = easeOut4(clamp01((t - u.delay) / 0.4));
        const s = u.base * (1.25 - 0.25 * e);
        p.scale.set(s, s, s);
        p.position.set(u.x, -u.y - (1 - e) * 26, 0);
        p.rotation.set(0.42, -0.6 + t * 0.9 + u.i * 0.5, 0);
        p.children[0].material.opacity = e;
      }
      renderer.render(scene, cam);
    },
  }));
}

// ---- Objects built from primitives (no downloads), the same designs as the Remotion set --
const mat = (color, emissive = 0) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: new THREE.Color(color), emissiveIntensity: emissive });

const rbox = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m);

function bubble(accent) {
  const white = mat(PAPER), tint = mat(accent, 0.15), dotM = mat(accent, 0.5);
  const root = new THREE.Group();
  const back = new THREE.Group();
  back.position.set(0.45, 0.5, -0.6);
  back.scale.setScalar(0.7);
  back.add(rbox(1.5, 0.85, 0.22, 0.12, tint));
  const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), tint);
  tail1.position.set(0.55, -0.48, 0);
  tail1.rotation.z = -0.6;
  back.add(tail1);
  root.add(back);
  root.add(rbox(1.7, 1.0, 0.26, 0.14, white));
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.26), white);
  tail.position.set(-0.6, -0.55, 0);
  tail.rotation.z = 0.6;
  root.add(tail);
  const dots = [-0.38, 0, 0.38].map((x) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), dotM);
    d.position.set(x, 0, 0.16);
    root.add(d);
    return d;
  });
  return {
    root,
    update(t) {
      root.rotation.set(0.12 + Math.sin(t * 0.7) * 0.06, Math.sin(t * 0.5) * 0.45, Math.sin(t * 0.4) * 0.05);
      dots.forEach((d, i) => (d.position.y = Math.max(0, Math.sin(t * 6 - i * 0.9)) * 0.14));
    },
  };
}

function brackets(accent) {
  const m = mat(accent, 0.2), w = mat(PAPER), slabM = mat("#3a4452", 0.05);
  const L = 0.62, a = (40 * Math.PI) / 180;
  const cx = (L / 2) * Math.cos(a), cy = (L / 2) * Math.sin(a);
  const bar = (len, x, y, ang, material) => {
    const b = rbox(len, 0.17, 0.17, 0.06, material);
    b.position.set(x, y, 0);
    b.rotation.z = ang;
    return b;
  };
  const root = new THREE.Group();
  const glyph = new THREE.Group();
  const left = new THREE.Group();
  left.position.x = -0.62;
  left.add(bar(L, cx, cy, a, m), bar(L, cx, -cy, -a, m));
  const right = new THREE.Group();
  right.position.x = 0.86;
  right.add(bar(L, -cx, cy, -a, m), bar(L, -cx, -cy, a, m));
  glyph.add(left, bar(1.05, 0.12, 0, (70 * Math.PI) / 180, w), right);
  root.add(glyph);
  const slabs = [
    [-1.05, 0.62, -0.9, 0.3],
    [1.08, 0.5, -1.2, 1.4],
    [-0.95, -0.7, -0.7, 2.2],
    [1.0, -0.66, -1.0, 3.1],
  ].map(([x, y, z, p]) => {
    const g = new THREE.Group();
    g.add(rbox(0.55, 0.36, 0.05, 0.03, slabM));
    [0.1, 0, -0.1].forEach((ly, j) => {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.3 - j * 0.06, 0.03, 0.01), j === 1 ? m : w);
      line.position.set(-0.06 + j * 0.03, ly, 0.03);
      g.add(line);
    });
    g.userData = { x, y, z, p };
    root.add(g);
    return g;
  });
  return {
    root,
    update(t) {
      glyph.rotation.set(0.15, Math.sin(t * 0.55) * 0.6, 0);
      for (const g of slabs) {
        const { x, y, z, p } = g.userData;
        g.position.set(x, y + Math.sin(t * 0.8 + p) * 0.08, z);
        g.rotation.set(Math.sin(t * 0.3 + p) * 0.3, t * 0.25 + p, 0);
      }
    },
  };
}

function network(accent) {
  const n = 26, pts = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    pts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(0.95));
  }
  const seen = new Set(), edges = [];
  pts.forEach((p, i) => {
    pts
      .map((q, j) => ({ j, d: p.distanceTo(q) }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .forEach(({ j }) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(k)) {
          seen.add(k);
          edges.push([i, j]);
        }
      });
  });
  const nodeM = mat(accent, 0.6);
  const linkM = new THREE.MeshStandardMaterial({ color: PAPER, transparent: true, opacity: 0.35, roughness: 0.6 });
  const pulseM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const root = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  const nodes = pts.map((p) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), nodeM);
    s.position.copy(p);
    root.add(s);
    return s;
  });
  for (const [i, j] of edges) {
    const a = pts[i], b = pts[j], dir = b.clone().sub(a);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, dir.length(), 6), linkM);
    c.position.copy(a.clone().add(b).multiplyScalar(0.5));
    c.quaternion.setFromUnitVectors(up, dir.normalize());
    root.add(c);
  }
  const pulses = edges
    .filter((_, k) => k % 3 === 0)
    .map(([i, j]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), pulseM);
      s.userData = { i, j };
      root.add(s);
      return s;
    });
  return {
    root,
    update(t) {
      root.rotation.set(0.3, t * 0.35, 0.1);
      nodes.forEach((s, i) => s.scale.setScalar(1 + Math.max(0, Math.sin(t * 2 + i)) * 0.35));
      pulses.forEach((s, k) => s.position.copy(pts[s.userData.i]).lerp(pts[s.userData.j], (t * 0.7 + k * 0.37) % 1));
    },
  };
}

// Dust: a few hundred specks drifting up at three depths, from a seeded generator.
function particles(accent) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const count = 260, base = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    base[i * 3] = (rnd() - 0.5) * 4;
    base[i * 3 + 1] = (rnd() - 0.5) * 7;
    base[i * 3 + 2] = -rnd() * 3;
  }
  const pos = new Float32Array(base);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geom, new THREE.PointsMaterial({ color: accent, size: 0.022, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false }));
  return {
    root: points,
    update(t) {
      for (let i = 0; i < pos.length; i += 3) {
        const speed = 0.06 + ((i / 3) % 5) * 0.012;
        pos[i] = base[i] + Math.sin(t * 0.4 + i) * 0.05;
        pos[i + 1] = ((((base[i + 1] + t * speed + 3.5) % 7) + 7) % 7) - 3.5;
      }
      geom.attributes.position.needsUpdate = true;
    },
  };
}

const KINDS = { prompt: bubble, code: brackets, ai: network };

// opts: { y: pixel centre, size: pixel height, particles: true }
function object(canvas, kind, accent, opts = {}) {
  const { y = 1180, size = 620, particles: dust = true } = opts;
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  studio(renderer, scene, accent, 0.01);
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  cam.position.set(0, 0, 6);
  // At z=6 with a 30° field of view the frame is ~3.2 units tall at z=0.
  const unitsPerPx = (2 * 6 * Math.tan((15 * Math.PI) / 180)) / H;
  const parts = [];
  if (dust) {
    const p = particles(accent);
    scene.add(p.root);
    parts.push(p);
  }
  const holder = new THREE.Group();
  holder.scale.setScalar((size * unitsPerPx) / 2);
  const cy = (H / 2 - y) * unitsPerPx;
  scene.add(holder);
  if (KINDS[kind]) {
    const o = KINDS[kind](accent);
    holder.add(o.root);
    parts.push(o);
  }
  return {
    draw(t) {
      holder.position.y = cy + Math.sin(t * 0.9) * 0.04;
      for (const p of parts) p.update(t);
      renderer.render(scene, cam);
    },
  };
}

window.Kojo3D = { turntables, object };

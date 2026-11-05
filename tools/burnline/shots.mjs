// New Burnline shots, captured frame by frame from the real site so the Reels stop reusing
// the same few clips. Each shot is one camera idea from the app itself: Follow, Sat view,
// Chase, Auto-orbit, a slow rise off the satellite, and the planner flying a plane change
// and a bi-elliptic transfer.
//
// Build and serve Burnline's site first (read-only; nothing is written to that repo):
//   cd <orbit-simulation->/web && npm ci && npm run build
//   python3 -m http.server 4173 --bind 127.0.0.1 --directory out
// Then, from this repo:
//   node tools/burnline/shots.mjs follow          # one shot -> footage/burnline/follow.mp4
//   node tools/burnline/shots.mjs all             # every shot, two at a time
//   FRAMES=20 node tools/burnline/shots.mjs rise   # a short probe to check the framing
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { OUT, run } from "./lib.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const DEST = join(ROOT, "footage/burnline");
const N = (n) => Number(process.env.FRAMES ?? n);

const pickSat = async (p, name) => {
  await p.click(".site-action:not(.site-gear)"); await p.tick(3);
  await p.click(".gsheet-bar button"); await p.tick(3);
  await p.type(".gsearch input", name); await p.tick(2);
  await p.click(".glist button", name); await p.tick(1);
};
const key = (p, k) => p.ev(`window.dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)}, bubbles: true }))`);
const globe = async (p, warp, gfx = "high") => {
  await p.load(`/globe/?gfx=${gfx}&gfxguard=0`);
  await p.pause();
  await p.click(".gwarp button", warp);
};

export const SHOTS = {
  /// Follow: the camera locks onto Hubble and rides along as Earth turns under it.
  async follow(p) {
    await globe(p, "60×");
    await pickSat(p, "HST");
    await p.tick(45); // the flight lands
    await key(p, "f"); await p.tick(2);
    await p.full();
    await p.capture("follow", N(210));
  },

  /// Follow the real ISS (the old "globe-iss" clip is actually Tianhe): for posts that
  /// say ISS.
  async iss(p) {
    await globe(p, "60×");
    await pickSat(p, "ISS (ZARYA)");
    await p.tick(45);
    await key(p, "f"); await p.tick(2);
    await p.full();
    await p.capture("follow-iss", N(210));
  },

  /// Sat view: on board Hubble over the night side, tilted toward the horizon so the city
  /// lights, Earth's curve and the limb fill the frame, panning slowly.
  async satview(p) {
    // The sensor footprint would draw a blue arc across the bottom of this view: off.
    await p.load(`/globe/?gfx=high&gfxguard=0`);
    await p.ev(`localStorage.setItem("burnline.cov.sensor", "0")`);
    await globe(p, "60×");
    await pickSat(p, "HST");
    await p.tick(45);
    await key(p, "p"); await p.tick(20);
    await p.full();
    const n = N(210);
    await p.capture("satview", n, async (f) => {
      await p.ev(`(() => { const s = window.__burnlineScene; s.pov.pitch = 1.32; s.pov.yaw = ${(-0.35 + 0.7 * (f / Math.max(1, n - 1))).toFixed(4)}; s.pov.fov = 80; s.camera.fov = 80; s.camera.updateProjectionMatrix(); })()`);
    });
  },

  /// Chase from behind Hubble at 10x, a different spacecraft from the old chase clip.
  async chase(p) {
    await globe(p, "10×");
    await pickSat(p, "HST");
    await p.tick(45);
    await key(p, "c"); await p.tick(20);
    await p.full();
    await p.capture("chase-hst", N(210));
  },

  /// Auto-orbit, close: MetOp-B selected, the camera circling at a third of the wide
  /// shot's distance so the orbit ring and swath cross the frame.
  async orbit(p) {
    await globe(p, "60×");
    await pickSat(p, "METOP-B");
    await p.tick(45);
    await p.ev(`(() => { const s = window.__burnlineScene; const c = s.camera; const t = s.controls.target; const at = t.clone(); t.set(0, 0, 0); c.position.copy(at).setLength(15); c.lookAt(t); s.controls.update(); })()`);
    await p.tick(4);
    await key(p, "o"); await p.tick(2);
    await p.full();
    await p.capture("orbit-close", N(210));
  },

  /// A slow rise: from just behind Aqua, the camera pulls up and away until the whole
  /// Earth is in frame, easing in and out.
  async rise(p) {
    await globe(p, "10×");
    await pickSat(p, "AQUA");
    await p.tick(45);
    await p.full();
    const n = N(210);
    await p.capture("rise", n, async (f) => {
      const k = f / Math.max(1, n - 1);
      const e = k * k * (3 - 2 * k); // smoothstep
      await p.ev(`(() => {
        const s = window.__burnlineScene; const c = s.camera; const t = s.controls.target;
        if (!window.__riseFrom) window.__riseFrom = { dir: c.position.clone().normalize(), sat: t.clone() };
        const r = window.__riseFrom;
        t.copy(r.sat).multiplyScalar(${1 - e});
        c.position.copy(r.dir).multiplyScalar(${(8.2 + 22 * e).toFixed(4)});
        c.up.set(0, 1, 0); c.lookAt(t); s.controls.update();
      })()`);
    });
  },

  /// The planner: a plane change, executed and flown at 300x, riding behind the spacecraft
  /// as the burn swings its orbit onto the new plane.
  async planechange(p) {
    await p.load("/mission/?gfx=high&gfxguard=0");
    await p.pause();
    await p.click(".site-action:not(.site-gear)"); await p.tick(3);
    await p.click(".mkinds button", "Plane change"); await p.tick(3);
    await p.click("[data-tour='mission-execute']"); await p.tick(2);
    await p.click(".gsheet-close"); await p.tick(2);
    await p.click(".gviews button", "Chase"); await p.tick(4);
    await p.click("button[aria-label='Farther']"); await p.tick(1);
    await p.click(".gwarp button", "300×");
    await p.full();
    await p.capture("planechange", N(210));
  },

  /// The planner: a bi-elliptic transfer flown at 3000x, out past the target and back.
  async bielliptic(p) {
    await p.load("/mission/?gfx=high&gfxguard=0");
    await p.pause();
    await p.click(".site-action:not(.site-gear)"); await p.tick(3);
    await p.click(".mkinds button", "Bi-elliptic"); await p.tick(3);
    await p.click("[data-tour='mission-execute']"); await p.tick(2);
    await p.click(".gsheet-close"); await p.tick(2);
    await p.click(".gwarp button", "3000×");
    await p.full();
    await p.capture("bielliptic", N(210));
  },
};

// Frames -> an H.264 clip the sync step copies into public/assets/burnline/.
function encode(name) {
  mkdirSync(DEST, { recursive: true });
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-i", join(OUT, name, "%04d.png"), "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p", "-g", "30", "-movflags", "+faststart", join(DEST, `${name}.mp4`)], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`encode ${name} failed`);
  console.log(`-> footage/burnline/${name}.mp4`);
}
const OUTPUT = { chase: "chase-hst", orbit: "orbit-close", iss: "follow-iss" };

const want = process.argv[2];
const names = want === "all" ? Object.keys(SHOTS) : [want];
for (const n of names) if (!SHOTS[n]) throw new Error(`no shot "${n}"; one of: ${Object.keys(SHOTS).join(", ")}, all`);
if (want === "all") {
  // Two browsers at a time: software WebGL is CPU-bound.
  const queue = [...names];
  const { spawn } = await import("node:child_process");
  const one = (n) => new Promise((res) => spawn("node", [new URL(import.meta.url).pathname, n], { stdio: "inherit", env: process.env }).on("exit", res));
  await Promise.all([0, 1].map(async () => {
    for (let n; (n = queue.shift()); ) await one(n);
  }));
} else {
  const out = OUTPUT[want] ?? want;
  rmSync(join(OUT, out), { recursive: true, force: true });
  await run(SHOTS[want]);
  if (!process.env.FRAMES && !process.exitCode) encode(out);
}

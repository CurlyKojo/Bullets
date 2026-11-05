// {flow} footage: the real client, filmed frame by frame at phone size, one feature per
// shot. The backend is tools/flow/demo-server.mjs (scripted AI text, see that file), so
// start it first:
//   cd <flow-v2>/client && npm ci && npx vite build
//   node tools/flow/demo-server.mjs <flow-v2>/client/dist 4180
// Then:
//   node tools/flow/shots.mjs generate     # one shot -> footage/flow/flow-generate.mp4
//   node tools/flow/shots.mjs all
//   FRAMES=20 node tools/flow/shots.mjs fit  # a short probe
//
// Kept off camera on purpose: the login screen, the footer, the Evaluator and Acronyms
// pages and the Package Builder headings all carry Air Force wording, which the account
// never shows. The rank selector is set to CIV for the same reason.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { OUT, run, setOut } from "../burnline/lib.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const DEST = join(ROOT, "footage/flow");
const DEMO = process.env.DEMO ?? "http://127.0.0.1:4180";
process.env.BASE = DEMO;
setOut(join(ROOT, ".cache/footage/flow"));
const SCRIPT = JSON.parse(readFileSync(new URL("./script.json", import.meta.url), "utf8"));
const N = (n) => Number(process.env.FRAMES ?? n);
const release = () => fetch(`${DEMO}/demo/release`).then((r) => r.json());

// Signed in (the token is all the client checks; the demo server accepts it), the rank
// tier off the military default, and the page scrolled to `y`.
async function open(p, y = 0) {
  await p.load("/", `!!document.querySelector(".gen-btn")`, 500);
  await p.ev(`localStorage.setItem("flow.jwt", "demo")`);
  await p.load("/", `!!document.querySelector(".gen-btn")`, 2500);
  await p.pause();
  // The footer names the Air Force; it never appears in a Reel.
  await p.ev(`(() => { const st = document.createElement("style"); st.textContent = ".app-footer{display:none !important}"; document.head.appendChild(st); })()`);
  await p.ev(`(() => { const s = document.querySelectorAll(".control-grid select")[1]; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(s, "CIV"); s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
  await scrollTo(p, y);
  await p.tick(3);
}
const scrollTo = (p, y) => p.ev(`document.scrollingElement.scrollTop = ${Math.round(y)}`);
const top = (p, sel, i = 0) => p.ev(`(() => { const e = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; return e ? e.getBoundingClientRect().top + document.scrollingElement.scrollTop : 0; })()`);
const typeInto = (p, sel, value) =>
  p.ev(`(() => { const s = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(s, ${JSON.stringify(value)}); s.dispatchEvent(new Event("input", { bubbles: true })); })()`);
// An eased scroll from a to b over frames [f0, f1].
const glide = (f, f0, f1, a, b) => {
  if (f < f0 || f > f1) return null;
  const k = (f - f0) / Math.max(1, f1 - f0);
  return a + (b - a) * (k * k * (3 - 2 * k));
};
// Generate and land the statements before a shot starts.
async function generated(p) {
  await typeInto(p, ".raw-input", SCRIPT.notes);
  await p.tick(2);
  await p.click(".gen-btn.primary");
  await p.tick(4);
  await release();
  for (let i = 0; i < 40 && !(await p.ev(`document.querySelectorAll(".bullet-card").length`)); i++) await p.tick(1);
  await p.tick(150); // the toast clears
}

export const SHOTS = {
  /// Notes typed in, Generate, Kojo charges up, the statements land.
  async generate(p) {
    await open(p, 0);
    // The header is sticky (~125 px): park the notes box just under it.
    const y0 = (await top(p, ".raw-input")) - 200;
    const yOut = (await top(p, ".output-panel")) - 260;
    await scrollTo(p, y0);
    const notes = SCRIPT.notes;
    const n = N(240);
    await p.capture("flow-generate", n, async (f) => {
      if (f >= 4 && f <= 4 + Math.ceil(notes.length / 3)) await typeInto(p, ".raw-input", notes.slice(0, (f - 4) * 3));
      const s = glide(f, 96, 118, y0, yOut);
      if (s !== null) await scrollTo(p, s);
      if (f === 92) await p.click(".gen-btn.primary");
      if (f === 160) await release();
    });
  },

  /// The Coach: open the strength strip on a statement, the tips and checklist unfold.
  async coach(p) {
    await open(p, 0);
    await generated(p);
    const y = (await top(p, ".bullet-card", 0)) - 120;
    await scrollTo(p, y);
    const n = N(180);
    await p.capture("flow-coach", n, async (f) => {
      if (f === 18) await p.click(".coach-strip");
      const s = glide(f, 60, 110, y, y + 260);
      if (s !== null) await scrollTo(p, s);
    });
  },

  /// Lengthen: a statement short of two full lines grows to fill them, and Kojo calls the
  /// perfect fit.
  async fit(p) {
    await open(p, 0);
    await generated(p);
    // Room above the card: the perfect-fit badge pops out of its top edge.
    const y = (await top(p, ".bullet-card", 0)) - 260;
    await scrollTo(p, y);
    const n = N(180);
    await p.capture("flow-fit", n, async (f) => {
      if (f === 24) await p.click(".bullet-card .bullet-actions button", "Lengthen");
      if (f === 56) await release();
    });
  },

  /// Save a statement and open the library: it's at the top of the saved list.
  async save(p) {
    await open(p, 0);
    await generated(p);
    const y = (await top(p, ".bullet-card", 1)) - 140;
    await scrollTo(p, y);
    const n = N(210);
    let yLib = 0;
    await p.capture("flow-save", n, async (f) => {
      // Saving opens the library on its own; then glide down to it.
      if (f === 20) await p.ev(`document.querySelectorAll(".bullet-card")[1].querySelector(".bullet-actions .gold").click()`);
      if (f === 50) yLib = (await p.ev(`(() => { const b = [...document.querySelectorAll(".sect-toggle")].find((x) => x.textContent.includes("SAVED LIBRARY")); return b.getBoundingClientRect().top + document.scrollingElement.scrollTop; })()`)) - 150;
      const s = yLib ? glide(f, 54, 96, y, yLib) : null;
      if (s !== null) await scrollTo(p, s);
    });
  },
};

function encode(name) {
  mkdirSync(DEST, { recursive: true });
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-i", join(OUT, name, "%04d.png"), "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p", "-g", "30", "-movflags", "+faststart", join(DEST, `${name}.mp4`)], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`encode ${name} failed`);
  console.log(`-> footage/flow/${name}.mp4`);
}

const want = process.argv[2];
const names = want === "all" ? Object.keys(SHOTS) : [want];
for (const n of names) if (!SHOTS[n]) throw new Error(`no shot "${n}"; one of: ${Object.keys(SHOTS).join(", ")}, all`);
// One at a time: the demo server's held responses are shared.
for (const n of names) {
  if (want === "all") {
    spawnSync("node", [new URL(import.meta.url).pathname, n], { stdio: "inherit", env: process.env });
    continue;
  }
  const out = `flow-${n}`;
  rmSync(join(OUT, out), { recursive: true, force: true });
  await run(SHOTS[n]);
  if (!process.env.FRAMES && !process.exitCode) encode(out);
}

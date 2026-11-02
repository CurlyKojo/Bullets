#!/usr/bin/env node
// Pulls every project's footage into public/assets/<project>/ so the Reels can use it.
//
//   node scripts/sync.mjs              # all projects
//   node scripts/sync.mjs ghost wisp   # just these
//   node scripts/sync.mjs --fresh      # re-copy even if the file is already there
//
// Each project repo is shallow-cloned into .cache/repos/<id> (or fetched if it is already
// there). Nothing is ever written back to a project repo. STUDIO_REPOS=/some/dir makes it
// use existing checkouts in that directory first (matched by repo name, case-insensitive).
//
// Conversions: GIF becomes a looping MP4 at 1080 wide; SVG becomes a 1080 px PNG; the
// "wisp" tool renders Wisp's six states at full resolution from the Wisp repo's own code.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { ROOT, arg, projects, run } from "./lib.mjs";

const fresh = Boolean(arg("fresh"));
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const all = projects();
const cache = join(ROOT, ".cache/repos");
mkdirSync(cache, { recursive: true });

const findLocal = (url) => {
  const dir = process.env.STUDIO_REPOS;
  if (!dir || !existsSync(dir)) return null;
  const name = basename(url).toLowerCase();
  const hit = readdirSync(dir).find((d) => d.toLowerCase() === name && existsSync(join(dir, d, ".git")));
  return hit ? join(dir, hit) : null;
};

const checkout = (p) => {
  const local = findLocal(p.repo);
  if (local) return local;
  const dest = join(cache, p.id);
  const env = { ...process.env, GIT_LFS_SKIP_SMUDGE: "1" };
  if (existsSync(join(dest, ".git"))) {
    try {
      run("git", ["-C", dest, "fetch", "--depth", "1", "origin", "HEAD"], { env, timeout: 600000 });
      run("git", ["-C", dest, "reset", "--hard", "FETCH_HEAD"], { env });
    } catch (e) {
      console.warn(`  ${p.id}: fetch failed, using the cached copy (${String(e.message).split("\n")[0]})`);
    }
  } else {
    run("git", ["clone", "--depth", "1", p.repo, dest], { env, timeout: 900000 });
  }
  return dest;
};

const ensurePy = () => {
  try {
    run("python3", ["-c", "import pygame, cairosvg, PIL"]);
  } catch {
    console.log("  installing pygame, cairosvg, pillow for the Wisp renderer");
    run("python3", ["-m", "pip", "install", "-q", "pygame", "cairosvg", "pillow"], { timeout: 600000 });
  }
};

let copied = 0;
let kept = 0;
for (const p of Object.values(all)) {
  if (!p.repo || (only.length && !only.includes(p.id))) continue;
  const out = join(ROOT, "public/assets", p.id);
  mkdirSync(out, { recursive: true });
  let repo;
  try {
    repo = checkout(p);
  } catch (e) {
    console.warn(`! ${p.id}: could not get ${p.repo}. ${p.private ? "It is private: attach it to this session first. " : ""}${String(e.message).split("\n")[0]}`);
    continue;
  }
  for (const [key, spec] of Object.entries(p.assets ?? {})) {
    if (typeof spec === "object" && spec.tool === "wisp") {
      const dir = join(out, key);
      const want = spec.states.map((s) => join(dir, `${s}.mp4`));
      if (!fresh && want.every((f) => existsSync(f))) {
        kept += want.length;
        continue;
      }
      ensurePy();
      run("python3", [join(ROOT, "tools/wisp_render.py"), repo, dir, "--seconds", "8", "--states", ...spec.states], { timeout: 1800000 });
      copied += want.length;
      continue;
    }
    const src = join(repo, spec);
    if (!existsSync(src)) {
      console.warn(`! ${p.id}:${key} missing in the repo: ${spec}`);
      continue;
    }
    const ext = extname(spec).toLowerCase();
    const destExt = ext === ".gif" ? ".mp4" : ext === ".svg" ? ".png" : ext;
    const dest = join(out, key + destExt);
    if (!fresh && existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) {
      kept++;
      continue;
    }
    if (ext === ".gif") {
      // Loop it to at least 10 s, scale to 1080 wide with a sharp filter (pixel-art safe),
      // and pad to even dimensions for H.264.
      run("ffmpeg", ["-v", "error", "-y", "-stream_loop", "4", "-i", src, "-t", "12", "-vf", "scale=1080:-2:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", dest]);
    } else if (ext === ".svg") {
      ensurePy();
      run("python3", ["-c", `import cairosvg; cairosvg.svg2png(url=${JSON.stringify(src)}, write_to=${JSON.stringify(dest)}, output_width=1080)`]);
    } else {
      copyFileSync(src, dest);
    }
    copied++;
  }
  console.log(`✓ ${p.id}`);
}
console.log(`sync: ${copied} written, ${kept} already current`);

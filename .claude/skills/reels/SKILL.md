---
name: reels
description: Make, change or schedule Kojo Labs Instagram Reels: render today's or a specific post, write new posts for the queue, change how a scene looks, add footage from a project repo, refresh the brand kit (avatar, highlight covers), or post to Instagram. Use for anything touching posts/, projects/, src/, scripts/, brand/ or out/ in this repo, and whenever the user says video, reel, post, clip, caption, hook, cover, highlight, profile picture or Instagram, even without naming a file.
---

# Kojo Labs Reels

This repo turns a short JSON script into a beat-cut vertical Reel. The planner
(`scripts/plan.mjs`) puts every cut on the song's beat grid; the engine draws it.
The engine is HyperFrames (`scripts/hf/engine.mjs`, HTML + GSAP rendered frame by frame);
the older Remotion project in `src/` stays as a fallback (`--engine remotion`) and still
draws the cover and the brand kit. Read `README.md` for the map. The writing rules are in `posts/WRITING.md`, the
account itself in `brand/PROFILE.md` and `brand/LAUNCH.md`.

## Loops

**Render a post** (about 3–5 min):

```bash
node scripts/sync.mjs              # once per session; pulls footage from the project repos
node scripts/daily.mjs --post 004  # or no --post for the next in the queue
```

Read the report. Hand the file over with `SendUserFile` on `out/latest/reel.mp4` (display
`attach`) plus the caption, song and downbeat from the report. Add `--mark` only when the
post is really being used.

**Plan without rendering**: `node scripts/daily.mjs --post 004 --dry` prints every cut.

**Write posts**: follow `posts/WRITING.md`; then `npm run check` (typecheck plus every post
plans cleanly). Facts must come from `projects/*.json` or the project repos.

**Change the look**: every scene type is a function in `scripts/hf/engine.mjs`
(`sceneParts`), transitions in `enterJs`/`exitJs`, the 3D in `scripts/hf/kojo3d.src.js`
(three.js, bundled at build time). Look at frames instead of a full render:

```bash
node scripts/daily.mjs --post 002 --build      # writes .cache/hf/002-.../ and prints each scene's window
cd .cache/hf/002-ghost-build-part1
export HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx hyperframes@0.9.13 check --json             # layout, legibility, timing, motion
npx hyperframes@0.9.13 snapshot --at 1.5,4.3,7.5  # PNGs plus a contact sheet
```

**Brand kit**: `node scripts/brand.mjs` re-renders `brand/kit/`.

## Gotchas

- What the engine does: words land one at a time, settling from 1.35x; tall footage fills
  the frame, square footage sits on a rounded card, wide stills feather into the backdrop
  (fitted, never cropped); STLs turn on turntables (real files, studio-lit); stats roll
  like an odometer; type scenes type out with Shiki colours (`lang` on the scene); split
  scenes wipe; tips get a 3D object chosen from the post's `kind` (bubble for prompt,
  `</>` for coding, network for AI) and the first tip of a tip Reel one Fluent emoji
  (`public/emoji/`, MIT). Studio Reels colour each scene with the accent of the project
  it shows. End card: the K mark draws itself on, then the wordmark.
- Transitions, each with a cause: a light leak on the first downbeat, a dip into the end
  card, an iris into a grid, otherwise whip / zoom-through / blur swap in rotation.
- Craft rules from motionmaxxing (posts/VIRAL.md): no progress bar, tags, kickers or
  counters; end card is mark + wordmark, 3 beats. daily.mjs fails a render whose ending
  freezes for over 1.4 s or that has blank frames.
- `hyperframes check` warns about captions shorter than its reading time (0.5 s + 0.3 s a
  word) and about the 1 s end card. The end card is short on purpose (loops into a
  rewatch); captions are the real fix: keep them under about 8 words.
- Renders can't reach a CDN from the cloud sandbox: GSAP comes from node_modules and
  three.js is bundled, both copied into the project. Keep it that way.
- HyperFrames needs the headless shell: `renderProject` passes REMOTION_BROWSER from
  `renderEnv()` as HYPERFRAMES_BROWSER_PATH. Plain Chrome has no beginFrame and is slower.
- Scene roots must stay transparent: an opaque root hides the outgoing scene during a
  transition (a black flash at the seam).
- Fresh footage: no clip in two posts in a row or more than twice in the queue
  (`npm run check`). Burnline shots are captured frame by frame from the real site with
  `tools/burnline/shots.mjs` (build and serve Burnline's `web/` locally first; the live
  site is blocked from the sandbox). Each shot takes ~7 min. Clips land in
  `footage/burnline/` (committed) and `npm run sync` copies them in. Note the old
  `globe-iss` clip is actually Tianhe: use `follow-iss` when the words say ISS.
- Never push anything to the project repos (especially Orbit-Simulation-). This repo only
  reads them, into `.cache/repos/`.
- Words stay inside `SAFE` in `src/theme.ts`; Instagram's UI covers the rest.
- Instagram allows 5 hashtags per post. `scripts/plan.mjs` enforces it.

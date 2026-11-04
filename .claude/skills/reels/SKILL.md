---
name: reels
description: Make, change or schedule Kojo Labs Instagram Reels: render today's or a specific post, write new posts for the queue, change how a scene looks, add footage from a project repo, refresh the brand kit (avatar, highlight covers), or post to Instagram. Use for anything touching posts/, projects/, src/, scripts/, brand/ or out/ in this repo, and whenever the user says video, reel, post, clip, caption, hook, cover, highlight, profile picture or Instagram, even without naming a file.
---

# Kojo Labs Reels

This repo is a Remotion project that turns a short JSON script into a beat-cut vertical
Reel. Read `README.md` for the map. The writing rules are in `posts/WRITING.md`, the
account itself in `brand/PROFILE.md` and `brand/LAUNCH.md`.

## Loops

**Render a post** (5–10 min; STL scenes are the slow part):

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

**Change the look**: scenes are in `src/scenes/Scenes.tsx`, shared pieces in
`src/components/`, tokens in `src/theme.ts`. Check a single frame instead of a full render:

```bash
node scripts/daily.mjs --post 002 --dry   # find the frame you want from the cut list
npx remotion still src/index.ts Reel out/check.png --props=out/002-ghost-talks/props.json --frame=300 --log=error
```

(`props.json` exists after one full render; set REMOTION_BROWSER to the headless shell in
/opt/pw-browsers as scripts/lib.mjs does.)

**Brand kit**: `node scripts/brand.mjs` re-renders `brand/kit/`.

## Gotchas

- Visual upgrades and where they live: beat-centred transitions with a light leak on the
  drop (`src/Reel.tsx`, `src/components/LightLeak.tsx` from remocn, MIT), studio lighting
  and contact shadows on STLs (`src/components/Stl.tsx`, drei), odometer numbers
  (`src/components/Rolling.tsx`), syntax colours from Shiki at plan time (`highlight()` in
  `scripts/plan.mjs`, set `lang` on a type scene) and the CSS grain gradient behind
  text-led scenes (`src/components/Grain.tsx`).
- Don't add @react-three/postprocessing: its EffectComposer draws nothing under
  Remotion's frame-by-frame rendering. Don't put a WebGL shader behind whole scenes: in
  software WebGL it made renders 2-4x slower. Both were tried.

- WebGL needs `swangle` (set in remotion.config.ts). Plain `swiftshader` can't create a
  context in the headless shell, and the STL scenes fail.
- Remotion without REMOTION_BROWSER tries to download Chromium and fails offline. The
  scripts set it; raw `npx remotion` calls need it exported.
- Never push anything to the project repos (especially Orbit-Simulation-). This repo only
  reads them, into `.cache/repos/`.
- Words stay inside `SAFE` in `src/theme.ts`; Instagram's UI covers the rest.
- Instagram allows 5 hashtags per post. `scripts/plan.mjs` enforces it.

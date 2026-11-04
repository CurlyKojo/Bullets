# Kojo Labs studio

The content engine behind **Kojo Labs** (`@kojolabs.dev`), the Instagram account for
everything I build: software, 3D prints, and the hardware they run on.

Write a post as a few lines of JSON, and this repo turns it into a finished vertical Reel:
cut on the beat of a chosen song, hook in the first second, real footage from the project
repos, spinning 3D turntables of the actual STL files, captions in the safe zone, an end
card, a grid cover, and the Instagram caption with hashtags. One command, about five
minutes.

The look: cuts land on the beat with real transitions (a light leak on the drop), 3D parts
get studio lighting and soft shadows, numbers roll like an odometer, code is syntax
coloured, and text-led scenes sit on a slow grain gradient. Motion components adapted
from [remocn](https://github.com/Remocn/remocn) (MIT); syntax colours by
[Shiki](https://github.com/shikijs/shiki); 3D lighting by
[drei](https://github.com/pmndrs/drei); floating 3D emoji from Microsoft's
[Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT).

## What's here

| Path | What it is |
|---|---|
| `brand/PROFILE.md` | The Instagram profile, field by field: name, handle, bio, links, highlights |
| `brand/LAUNCH.md` | Launch plan, posting schedule, what makes the videos perform |
| `brand/kit/` | Profile picture, story highlight covers, wordmark (rendered) |
| `posts/` | The queue: one JSON script per Reel. `WRITING.md` is the format and rules |
| `projects/` | One file per project: name, accent colour, true facts, where its footage lives |
| `src/` | The Remotion video project: scenes, STL turntables, brand stills |
| `scripts/daily.mjs` | Render the next post: video, cover, caption, contact sheet, download page |
| `scripts/sync.mjs` | Pull footage from the project repos into `public/assets/` |
| `scripts/publish-instagram.mjs` | Optional: post straight to Instagram via the Graph API |
| `tools/wisp_render.py` | Renders Wisp's states at full resolution from the Wisp repo's own code |
| `NIGHTLY.md` | The scheduled task that does all of it every day |

## Projects it covers

| Project | Repo | Footage |
|---|---|---|
| Burnline (satellite sim) | Orbit-Simulation- | the Reel clip library, the UI |
| Ghost (3D printed companion) | Ghost-from-Destiny- | renders + all 12 STLs as turntables |
| Wisp (Pi assistant face) | Wisp- | six states rendered at 1080×1920 |
| {flow} (AI bullet writer) | Flow-V2 | the Kojo mascot, animated before/after demos |

Adding a project: drop a `projects/<id>.json` (copy one), list its assets, `npm run sync`.

## Run it

```bash
npm ci
npm run sync                         # pull footage (needs access to the project repos)
node scripts/daily.mjs --dry         # see the next post's cut, song and timing
node scripts/daily.mjs               # render it -> out/latest/
node scripts/daily.mjs --post 004    # render a specific post
npm run check                        # typecheck + every post plans cleanly
npm run brand                        # re-render the profile kit
npm run preview                      # Remotion Studio, for tinkering with scenes
```

Output in `out/latest/`: `reel.mp4` (1080×1920, 30 fps, H.264, silent track), `cover.jpg`,
`caption.txt`, `report.json` (song, downbeat second), `qa/contact.jpg`, `page.html`.

Music is never baked in. Add the suggested song in Instagram at post time so it counts as
trending audio; the report says which second to start it so the cuts land on the beat.

## Rules

- Never push to the project repos. This repo only reads them.
- Every fact in a post is true and comes from the project's repo.
- Destiny and the Ghost belong to Bungie; the Ghost is a fan project and its posts say so.

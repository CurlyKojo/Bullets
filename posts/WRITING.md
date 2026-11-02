# Writing a post

A post is one JSON file in this folder: `NNN-project-slug.json`. The daily run takes the
lowest-numbered one that isn't in `state.json` yet. Run `npm run check` after writing.

## Shape

```json
{
  "id": "022-ghost-wiring",
  "project": "ghost",
  "mood": "hype",
  "hook": { "title": "Wiring a *talking* Ghost in 15 seconds", "media": "ghost:open", "cover": "Wiring a talking Ghost" },
  "scenes": [
    { "type": "media", "media": "ghost:core-back", "title": "The *brain*", "caption": "Raspberry Pi 4" },
    { "type": "stat", "prefix": "$", "value": 165, "title": "all in", "media": "ghost:parts" }
  ],
  "end": { "title": "Follow for *part 3*", "sub": "free files · link in bio" },
  "hashtags": ["print", "robot"],
  "caption": "What you'd say if you were texting a friend about it.\n\nSecond paragraph with the numbers.\n\nA question so people comment."
}
```

- `project`: a file in `projects/`. Its accent colour and name label the video.
- `mood`: hype, cinematic, chill, playful or dark. Picks the song from `music.json`.
- `*word*` paints that word in the accent colour. One or two per title, on the word that
  matters.
- `cover`: shorter title for the grid thumbnail. Optional, falls back to the hook.
- `beats` on any scene overrides its length. Defaults: media 4, stat 4, type 12, split 6,
  grid 8, end 6. The hook sizes itself to its word count.
- `hashtags`: names of sets in `brand/hashtags.json` (or literal `#tags`). Five total, max.
  Never put hashtags inside `caption`.

## Media references

`"project:key"`, where key is an asset name in that project's `projects/*.json`:

- `"ghost:hero"`, `"ghost:fin"` (STLs spin as turntables), `"wisp:states/happy"`
- `{ "ref": "burnline:wide", "start": 60 }` starts a clip 60 frames in. Use a different
  start for each scene that reuses a clip.
- `{ "ref": "ghost:hero", "fit": "cover", "zoom": "out" }` fills the frame / pulls back.

New footage: add it to the project's `assets` (path inside that project's repo), then
`npm run sync`.

## Scene types

| type | Use it for | Fields |
|---|---|---|
| `media` | the default: footage, a render, a spinning STL | `media`, `title`, `sub`, `caption` |
| `stat` | one big number counting up | `value`, `decimals`, `prefix`, `unit`, `title`, `media` (dimmed behind) |
| `type` | raw input → polished output (Flow, any tool demo) | `before`, `after`, `labels: [in, out]`, `meter: {used, limit}` |
| `split` | before/after, closed/open, CAD/print | `media`, `media2`, `labels: [top, bottom]`, `title` |
| `grid` | every part of a print at once | `items: [stl refs]`, `title` |

## Rules

1. **Every fact has to be true** and traceable to the project's README or code. The
   `facts` list in each `projects/*.json` is the safe pool. No invented specs, users or
   reviews.
2. **Flow examples are made up** and the caption says so. Never use a real person's
   performance data.
3. **No military references.** Never mention the Air Force, Airmen, EPBs, squadrons, bases
   or any service branch. Flow is pitched as a performance-writing tool for anyone.
4. **Ghost posts** end the caption with the fan-project line (Destiny belongs to Bungie).
5. **Hooks under 10 words.** Formulas that work:
   - "I built/printed X that does Y" (the reveal)
   - "POV: [relatable pain]" (Flow: "your performance review is due tomorrow")
   - "How to [useful thing] in N seconds" (Burnline teaching posts)
   - "Every part of X, one by one" (satisfying)
   - "My X does Y if you Z" (Wisp's personality)
6. **12–20 seconds.** Four to six scenes after the hook.
7. **Captions in plain first person.** Short paragraphs, the numbers, and end on a
   question. No "Excited to share", no "game-changer".
8. Rotate projects. Don't queue two of the same project back to back.

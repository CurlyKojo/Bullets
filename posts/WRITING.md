# Writing a post

A post is one JSON file in this folder: `NNN-project-slug.json`. The daily run takes the
lowest-numbered one that isn't in `state.json` yet. Run `npm run check` after writing.

## What the account is

Kojo Labs is a portfolio of real projects, with useful tips mixed in. Two kinds of post,
alternating so neither runs twice in a row:

- **Project posts** (`project`: burnline, ghost, wisp, flow, studio): what I'm building,
  where it actually stands, and why it's interesting.
- **Tip posts** (`project: "tips"`): one practical idea a viewer can use today. Rotate
  three kinds: prompt engineering (`kind: "Prompt tip"`, accent `#4c8dff`), coding
  (`kind: "Coding tip"`, `#5fe3a1`) and using AI well (`kind: "AI tip"`, `#b18cff`).

## Every Reel needs context and a clear direction

Before writing, answer these four questions. If any answer is fuzzy, the Reel isn't ready.

1. **What is this?** A cold viewer should know within 2 seconds: the tag names the project
   or tip type, the hook says what's going on.
2. **Where does it really stand?** Read the project's `status` in `projects/*.json`.
   Built, live, in design or planned: say it plainly. Unbuilt things get "I'm building",
   "designed to", "will", "Part 1". Never imply something works that hasn't been made.
   (The Ghost is designed, not printed. Wisp's animation is finished, but it isn't running
   on a physical assistant yet.)
3. **Why should I care?** One payoff: a number, a transformation, a surprise or a tip
   they can use. Every scene moves toward it.
4. **What do I do next?** The end card and caption give exactly one action: follow for
   part 2, save the tip, try it, comment.

The hook earns the first second, the scenes deliver the promise, the end gives the next
step. Nothing in between that doesn't serve that line.

## Shape

```json
{
  "id": "036-ghost-first-print",
  "project": "ghost",
  "mood": "hype",
  "hook": { "title": "Building a talking Ghost. Part 2: the *first print*", "media": "ghost:fin", "cover": "Ghost Part 2: first print" },
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
- `kind` (optional): overrides the project's label in the tag, e.g. "Prompt tip".
- `accent` (optional): overrides the project's accent colour.
- `mood`: hype, cinematic, chill, playful or dark. Picks the song from `music.json`.
- `*word*` paints that word in the accent colour. One or two per title, on the word that
  matters.
- `cover`: shorter title for the grid thumbnail. Optional, falls back to the hook.
- `beats` on any scene overrides its length. Defaults: media 4, stat 4, type 12, split 6,
  grid 8, tip 8, end 6. The hook sizes itself to its word count.
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
| `type` | raw input → polished output: Flow demos, bad prompt → good prompt, messy code → clean code | `before`, `after`, `labels: [in, out]`, `mono: true` for code and prompts, `lang` (python, shellscript, markdown...) for syntax colours, or `beforeLang` / `afterLang` when the two halves differ ("text" = none), `meter: {used, limit}` |
| `tip` | one rule in big words with a line of why, with a 3D object below it that matches the tip kind | `index` ("Rule 1 of 3"), `title`, `body`, optional `media` (dimmed, replaces the 3D) |
| `split` | before/after, closed/open, CAD/print | `media`, `media2`, `labels: [top, bottom]`, `title` |
| `grid` | every part of a print at once | `items: [stl refs]`, `title` |

## Rules

1. **Every fact has to be true** and traceable to the project's README or code. The
   `facts` list in each `projects/*.json` is the safe pool, and `status` says what's real.
   No invented specs, users or reviews. Each project's `avoid` list holds claims it hasn't
   earned yet; `npm run check` rejects any post that uses them.
2. **Flow examples are made up** and the caption says so. Never use a real person's
   performance data.
3. **No military references.** Never mention the Air Force, Airmen, EPBs, squadrons, bases
   or any service branch. Flow is pitched as a performance-writing tool for anyone.
4. **Ghost posts** end the caption with the fan-project line (Destiny belongs to Bungie).
5. **Hooks under 12 words, built to stop the scroll.** Formulas that work:
   - "I'm building X that does Y. Part N." (build series, for anything unfinished)
   - "I built X that does Y" (the reveal, only once it's really built)
   - "POV: [relatable pain]" (Flow: "your performance review is due tomorrow")
   - "Stop doing X" / "You're doing X wrong" (tips: name the mistake)
   - "One [thing] beats ten [things]" (tips: a surprising rule)
   - "How to [useful thing]" (Burnline teaching posts)
   - "Every part of X, one by one" (satisfying)
6. **12–25 seconds.** Project posts: four to six scenes after the hook. Tip posts: one
   before/after `type` scene plus two or three `tip` scenes, so there's time to read.
   Tips must be accurate and usable as written; test any code or prompt before posting it.
7. **Captions in plain first person.** Short paragraphs, the numbers, and end on a
   question. No "Excited to share", no "game-changer".
8. **Never repeat a shot inside a post.** Each scene shows something new. A clip can come
   back only from a different moment (`start` at least 60 frames apart), and assets a
   project lists under `lookalikes` count as the same shot. `npm run check` enforces it.
9. **Alternate project posts and tip posts**, rotate the projects and rotate the three tip
   kinds. Never two of the same project or tip kind back to back.

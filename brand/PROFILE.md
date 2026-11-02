# Kojo Labs: the Instagram profile, field by field

Everything you type into Instagram when you set the account up. Copy it straight in.

## Name and handle

**Kojo Labs.** An independent studio name: it reads as a real engineering shop, it covers
software and hardware equally, and it carries straight over from "{flow} by Kojo" and your
GitHub (CurlyKojo). "Labs" also gives you room: every project is an experiment that ships.

| Field | Value |
|---|---|
| Username | `@kojolabs.dev` (`@kojolabs` and `@kojo.labs` were taken) |
| Name | `Kojo Labs · AI + Code Tips` (26 characters, searchable), or plain `Kojo Labs` |
| Category | Engineer (or Science, Technology & Engineering) |
| Account type | **Creator**, not Business. Business accounts lose most of the Reels music library. |

The Name field is indexed by Instagram search. "Kojo Labs" alone is clean; adding
"Code + 3D Printing" helps people find you by topic. The handle lives in
`brand/brand.json`; change it there and the next render picks it up.

## Bio (128 of 150 characters)

```
Kojo · Developer & maker
I build AI tools, simulations and 3D-printed hardware.
Practical AI, coding + prompt-engineering tips ↓
```

Line one is who you are, line two is what you build, line three is why to follow.
"Developer" stays true whatever the day job is; swap in "Software engineer" if that's
the title.

## Profile picture

`brand/kit/avatar.png`: the Kojo Labs mark, white on graphite with the signal-blue node.
It's built to read at Instagram's 110 px circle. `avatar-light.png` is the reverse for
anywhere with a white background (LinkedIn, a GitHub org, email signature).

The mark is a K drawn as one upright and two arms meeting at a node. The node is a solder
joint, an orbit's periapsis and a graph vertex all at once, which is the studio in one
shape.

## Links (Instagram allows 5)

| Title | URL |
|---|---|
| {flow}: AI for performance and award statements | your Flow production URL |
| Burnline: satellite simulation | https://orbit-simulation.vercel.app |
| Wisp: live demo | https://wisp-two-tau.vercel.app |
| Ghost: open-source files | https://github.com/CurlyKojo/Ghost-from-Destiny- |
| GitHub | https://github.com/CurlyKojo |

Flow goes first. It's the product, and the first link gets most of the taps.

## Contact button

Add an email under Edit profile → Contact options. A dedicated address
(`hello@` on your own domain) looks far more professional than a personal Gmail.
`kojolabs.dev` or `kojolabs.com` are worth checking; a one-page site there with the
same five links can replace the Instagram link list later.

## Story highlights

Covers are in `brand/kit/` (`highlight-*.png`): thin white line icons on graphite, each
project's accent on one detail.

| Highlight | Cover | What goes in it |
|---|---|---|
| Software | `highlight-apps.png` | screen recordings, Flow and Burnline demos |
| Prints | `highlight-prints.png` | prints coming off the bed, timelapses, fails |
| Ghost | `highlight-ghost.png` | the Ghost build start to finish |
| Burnline | `highlight-burnline.png` | satellite clips, the devlog Reel |
| Wisp | `highlight-wisp.png` | Wisp states, the round display |
| Flow | `highlight-flow.png` | before/after statements, feature releases |
| In progress | `highlight-wip.png` | whatever's on the bench this week, the Ghost build |
| Tips | `highlight-tips.png` | your best prompt, coding and AI tip Reels, so new visitors binge them |

## Pinned posts (pin 3)

1. `001-studio-intro`: what Kojo Labs is
2. `002-ghost-talks`: the most shareable build
3. `004-flow-pov`: the product

## Brand system

- **Colour**: graphite `#0a0c0f`, paper `#f4f6f8`, signal blue `#4c8dff`. That's the
  whole brand palette. Inside a video, the project keeps its own accent (Burnline
  orange, Wisp teal, Ghost ice blue, Flow blue) so each one is recognisable at a glance,
  and the studio frame around it stays the same.
- **Type**: Geist for everything, Geist Mono for labels and numbers.
- **Motion**: words rise and fade on a tight stagger, cuts land on the beat with a faint
  lift, no bounces, no glow. The work is the loud part.
- **Voice**: first person, plain, specific. Numbers over adjectives ("32 hours of
  printing", not "a long print"). No emoji in captions, no hype words.
- **Files**: `brand/kit/` has the avatar (dark and light), highlight covers and the
  wordmark banner. `npm run brand` re-renders all of it from `src/Brand.tsx`.

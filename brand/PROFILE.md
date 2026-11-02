# The Instagram profile, field by field

Everything you type into Instagram when you set the account up. Copy it straight in.

## Name

**Kojo Builds**

Why: it says exactly what the account is (a person who builds things), it works for software
*and* prints, and it turns into a hook format on its own ("Kojo builds a talking Ghost").
It also keeps the Kojo mascot and the Flow brand under one name.

## Username

Try these in order and take the first one that's free:

1. `@kojobuilds`
2. `@kojo.builds`
3. `@builtbykojo`
4. `@curlykojo` (matches your GitHub, good fallback)

If you end up with anything other than `@kojobuilds`, change `handle` in `brand/brand.json`
and every video's end card updates on the next render.

## Profile picture

`brand/kit/avatar.png`: the Kojo mascot cropped to the face and lightning, built to read
at Instagram's tiny circle size. `brand/kit/avatar-full.png` is the full figure if you'd
rather show the whole character.

## Bio (132 of 150 characters)

```
I write the code + 3D print the body it lives in
👻 talking Ghost · 🛰️ satellite sim · 🔥 Pi face · ⚡ AI for Airmen
Free STLs + code ↓
```

## Category

**Science, Technology & Engineering** (or "Digital creator" if that one isn't offered).
Switch to a **Creator** account (Settings → Account type and tools). It unlocks insights,
the trending-audio library on Reels and the API if you ever turn on auto-posting.

## Links (Instagram allows 5)

| Title | URL |
|---|---|
| {flow}: AI for Air Force bullets | your Flow production URL (Vercel) |
| Burnline: satellite sim | https://orbit-simulation.vercel.app |
| Wisp: play in your browser | https://wisp-two-tau.vercel.app |
| Ghost: free STLs + code | https://github.com/CurlyKojo/Ghost-from-Destiny- |
| Everything on GitHub | https://github.com/CurlyKojo |

Put Flow first. It's the one that can make money, and the first link gets most of the taps.

## Story highlights

Covers are in `brand/kit/` (`highlight-*.png`). Instagram crops the middle into a circle.

| Highlight | Cover | What goes in it |
|---|---|---|
| Apps | `highlight-apps.png` | screen recordings, Flow and Burnline demos |
| Prints | `highlight-prints.png` | prints coming off the bed, timelapses, fails |
| Ghost | `highlight-ghost.png` | the Ghost build start to finish |
| Burnline | `highlight-burnline.png` | satellite clips, the daily devlog Reel |
| Wisp | `highlight-wisp.png` | Wisp states, the round display |
| Flow | `highlight-flow.png` | before/after bullets, feature drops |
| WIP | `highlight-wip.png` | whatever's on the bench this week |

## Pinned posts (pin 3)

1. `001-studio-intro`: who you are and what the account is
2. `002-ghost-talks`: the most shareable thing you've made
3. `004-flow-pov`: the one that sells

## Brand look

- **Colours**: ink `#05070d`, electric blue `#4fbef6`, gold `#e7b94c`, all pulled off the
  mascot. Each project keeps its own accent inside its videos (Burnline orange, Wisp teal,
  Ghost ice blue) so a viewer can tell them apart at a glance.
- **Type**: Space Grotesk for headlines, Inter for captions, JetBrains Mono for labels.
- **Voice**: first person, plain, specific. Numbers over adjectives. "32 hours of printing"
  beats "a long print".

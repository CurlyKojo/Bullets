# Bullets

A web app for drafting and refining short, constraint-bound bullet points (e.g. résumé bullets, product copy, status update lines) with help from Claude. The user describes what they want, sets a character-count window, and the app generates candidates that fit inside it.

## What we're building

The core loop: **describe → generate → save → iterate**.

1. **Describe** what the bullet should say (free-form textarea).
2. **Set constraints** — a min/max character window, with quick presets.
3. **Generate** candidates via the Claude API, sized to fit the window.
4. **Review** results in cards with at-a-glance fit indicators.
5. **Save** keepers; **rephrase** any bullet ("Different Verbiage") to get variations within the same window.

## Key features

### AI generation mode
- Description textarea — what the bullet should convey.
- Generate button — calls Claude with the description + character window.
- "Different Verbiage" — regenerates a saved bullet as variations, same window.
- Prompts pass the exact min/max to Claude so output is pre-sized.

### Character count limits panel
Sits between the description textarea and the Generate button.
- **Min / Max number inputs** — clamp against each other (min ≤ max − 1).
- **Visual range bar** — green gradient on a 0–500 scale showing the target window, with endpoint dot indicators.
- **Quick presets** — Tight (80–120), Standard (100–160), Full (140–200). Active preset highlights green.

### Bullet cards
Used both for AI results and saved bullets. Each card shows:
- The bullet text.
- A fit indicator using the current min/max:
  - `✓ within {min}–{max}` (green) when in range.
  - `⚠ below min ({min})` (orange) when too short.
  - `⚠ above max ({max})` (orange) when too long.
- Actions: save, copy, rephrase ("Different Verbiage"), delete.

## Stack

- Frontend: React + TypeScript, Vite.
- Styling: Tailwind CSS.
- AI: Anthropic SDK (`@anthropic-ai/sdk`), `claude-opus-4-7`. Called from a server-side handler — never from the browser.
- API proxy: a single Vercel-style serverless function at `api/generate.ts` holds the API key and exposes `POST /api/generate`. The Vite dev server mounts the same handler as middleware so `npm run dev` works without `vercel` CLI.
- State: local React state. Persistence (localStorage or backend store) will be added when needed.

The browser bundle never sees `ANTHROPIC_API_KEY` — it's read from `process.env` on the server only.

## Deploy

Designed to deploy to Vercel as a static site + serverless function:

1. Push the branch to GitHub.
2. Import the repo in Vercel — it auto-detects Vite, builds with `npm run build`, and bundles `api/generate.ts` as a Node serverless function.
3. Set `ANTHROPIC_API_KEY` in Vercel's project env vars.
4. Deploy.

Local dev: `cp .env.example .env`, set `ANTHROPIC_API_KEY`, `npm run dev`.

## Non-goals (for now)

- Auth, multi-user, sharing.
- Server-side persistence.
- Rich-text editing — bullets are plain text.
- Bulk import/export.

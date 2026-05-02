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
- API: Vercel-style serverless functions in `api/`. Vite mounts the same handlers as middleware in dev, so `npm run dev` works without the Vercel CLI.
- Auth: GitHub OAuth + invite allowlist. JWT session in an `HttpOnly` cookie, signed with `SESSION_SECRET`.
- Rate limit: Upstash Redis stores per-user daily counters with a 25h TTL. Configurable via `DAILY_LIMIT`.
- State: local React state. Persistence (localStorage or backend store) will be added when needed.

The browser bundle never sees `ANTHROPIC_API_KEY`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, or the Upstash creds — all of those are read from `process.env` on the server only.

## API surface

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/login` | GET | Redirects to GitHub OAuth. Sets a CSRF state cookie. |
| `/api/auth/callback` | GET | OAuth callback. Verifies state, fetches GitHub user, checks allowlist, sets session cookie, redirects to `/`. |
| `/api/auth/me` | GET | Returns `{username, used, limit, rate_limited}` if signed in, 401 otherwise. |
| `/api/auth/logout` | GET | Clears session cookie, redirects to `/`. |
| `/api/generate` | POST | Requires session. Increments per-user counter. 429 if over limit. Calls Claude with the description + min/max window. |

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel — it auto-detects Vite, builds with `npm run build`, and bundles each file in `api/` as a serverless function. (`api/_lib/` is shared code, not exposed as routes.)
3. Set the env vars from `.env.example` in Vercel's project env vars (Production + Preview).
4. After the first deploy, add the production URL to your GitHub OAuth App's callback list, and set `BASE_URL=https://<your-vercel-url>` in Vercel's env vars.

## Local dev

```
cp .env.example .env
# fill in ANTHROPIC_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET,
# ALLOWED_USERS, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, BASE_URL
npm install
npm run dev
```

Local OAuth callback: `http://localhost:5173/api/auth/callback`. You can either register two GitHub OAuth Apps (one for dev, one for prod) or update the production app's callback URL when switching.

## Non-goals (for now)

- Auth, multi-user, sharing.
- Server-side persistence.
- Rich-text editing — bullets are plain text.
- Bulk import/export.

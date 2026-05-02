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

## Stack (planned)

- Frontend: React + TypeScript, Vite.
- Styling: Tailwind CSS.
- AI: Anthropic SDK (`@anthropic-ai/sdk`), latest Claude model.
- State: local React state to start; persistence (localStorage or a small backend) added when needed.

This is intentionally minimal — we'll iterate on structure as features land.

## Non-goals (for now)

- Auth, multi-user, sharing.
- Server-side persistence.
- Rich-text editing — bullets are plain text.
- Bulk import/export.

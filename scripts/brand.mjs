#!/usr/bin/env node
// Renders the profile kit into brand/kit/: the profile picture (face crop for the circle,
// plus the full figure), one story-highlight cover per icon, and the wordmark banner.
//
//   node scripts/brand.mjs
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, renderEnv, run } from "./lib.mjs";

const env = renderEnv();
const kit = join(ROOT, "brand/kit");
mkdirSync(kit, { recursive: true });
const still = (id, file, props) =>
  run("npx", ["remotion", "still", "src/index.ts", id, join(kit, file), ...(props ? [`--props=${JSON.stringify(props)}`] : []), "--log=error"], { env, timeout: 600000 });

still("Avatar", "avatar.png", { variant: "face" });
still("Avatar", "avatar-full.png", { variant: "full" });
const highlights = {
  apps: "#4fbef6",
  prints: "#e7b94c",
  burnline: "#ff8a2b",
  ghost: "#7fd6ff",
  wisp: "#5fe8d0",
  flow: "#4fbef6",
  wip: "#e7b94c",
};
for (const [icon, accent] of Object.entries(highlights)) still("Highlight", `highlight-${icon}.png`, { icon, accent });
still("Wordmark", "wordmark.png");
console.log(`brand kit -> brand/kit/ (${Object.keys(highlights).length} highlights, 2 avatars, wordmark)`);

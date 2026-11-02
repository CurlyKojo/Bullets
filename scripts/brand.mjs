#!/usr/bin/env node
// Renders the profile kit into brand/kit/: the profile picture (the mark on graphite, plus
// a light version), one story-highlight cover per icon, and the wordmark banner.
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

still("Avatar", "avatar.png", { variant: "mark" });
still("Avatar", "avatar-light.png", { variant: "light" });
const highlights = {
  apps: "#4c8dff",
  prints: "#4c8dff",
  burnline: "#ff8a2b",
  ghost: "#7fd6ff",
  wisp: "#5fe8d0",
  flow: "#4fbef6",
  wip: "#4c8dff",
};
for (const [icon, accent] of Object.entries(highlights)) still("Highlight", `highlight-${icon}.png`, { icon, accent });
still("Wordmark", "wordmark.png");
console.log(`brand kit -> brand/kit/ (${Object.keys(highlights).length} highlights, 2 avatars (dark, light), wordmark)`);

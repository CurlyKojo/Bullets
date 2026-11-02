#!/usr/bin/env node
// Checks every post in posts/ plans cleanly: known project, every media reference
// resolves (run sync first), fits the length cap, has a caption. Exit 1 on any problem.
import { buildProps, listPosts, pickSong } from "./plan.mjs";
import { readJson } from "./lib.mjs";

const brand = readJson("brand/brand.json");
let bad = 0;
const ids = new Set();
for (const p of listPosts()) {
  const problems = [];
  if (ids.has(p.id)) problems.push("duplicate id");
  ids.add(p.id);
  if (!p.file.startsWith(p.id)) problems.push(`file name ${p.file} doesn't match id ${p.id}`);
  if (!p.hook?.title) problems.push("no hook title");
  if (!p.caption) problems.push("no caption");
  if (p.caption && p.caption.length > 2000) problems.push(`caption is ${p.caption.length} chars (Instagram allows 2,200 including hashtags)`);
  if ((p.caption?.match(/#\w+/g) ?? []).length) problems.push("put hashtags in the hashtags field, not the caption");
  try {
    const plan = buildProps(p, pickSong(p, "2026-01-01"), brand);
    if (plan.seconds < 6) problems.push(`only ${plan.seconds.toFixed(1)} s`);
  } catch (e) {
    problems.push(e.message);
  }
  if (problems.length) {
    bad++;
    console.log(`✗ ${p.id}\n  - ${problems.join("\n  - ")}`);
  }
}
console.log(bad ? `${bad} post(s) need fixing` : `all ${ids.size} posts plan cleanly`);
process.exit(bad ? 1 : 0);

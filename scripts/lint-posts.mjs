#!/usr/bin/env node
// Checks every post in posts/ plans cleanly: known project, every media reference
// resolves (run sync first), fits the length cap, has a caption. Exit 1 on any problem.
import { buildProps, listPosts, pickSong } from "./plan.mjs";
import { projects, readJson } from "./lib.mjs";

const all = projects();
// Two shots that would read as the same picture: the same asset (a video counts as new
// footage only if it starts at least 2 s apart), or two assets the project lists as
// lookalikes. Split scenes are exempt; comparing two near-identical images is their job.
const shots = (p) => {
  const out = [];
  const add = (ref, where) => {
    if (!ref) return;
    const o = typeof ref === "string" ? { ref } : ref;
    const [pid, ...rest] = o.ref.split(":");
    const key = rest.join(":");
    const group = (all[pid]?.lookalikes ?? []).find((g) => g.includes(key));
    out.push({ id: group ? `${pid}:[${group.join("|")}]` : o.ref, start: o.start ?? 0, where });
  };
  add(p.hook?.media, "hook");
  (p.scenes ?? []).forEach((s, i) => {
    if (s.type === "split") return;
    add(s.media, `scene ${i + 1}`);
  });
  return out;
};
const repeats = (p) => {
  const list = shots(p);
  const found = [];
  list.forEach((a, i) => list.slice(i + 1).forEach((b) => {
    if (a.id === b.id && Math.abs(a.start - b.start) < 60) found.push(`${a.where} and ${b.where} show the same shot (${a.id})`);
  }));
  return found;
};

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
  problems.push(...repeats(p));
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

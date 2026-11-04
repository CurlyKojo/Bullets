#!/usr/bin/env node
// Checks every post in posts/ plans cleanly: known project, every media reference
// resolves (run sync first), fits the length cap, has a caption. Exit 1 on any problem.
import { buildProps, listPosts, pickSong } from "./plan.mjs";
import { projects, readJson } from "./lib.mjs";

const all = projects();
// Two shots that would read as the same picture: the same asset (a video counts as new
// footage only if it starts at least 2 s apart), or two assets the project lists as
// lookalikes. The two halves of a split may be lookalikes (comparing them is the point),
// but neither may appear anywhere else in the post.
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
    add(s.media, `scene ${i + 1}`);
    if (s.type === "split") add(s.media2, `scene ${i + 1}`);
  });
  return out;
};
// Every word a viewer will see or read, for the claims check.
const texts = (p) => {
  const out = [p.caption ?? ""];
  for (const s of [p.hook ?? {}, ...(p.scenes ?? []), p.end ?? {}]) for (const k of ["title", "sub", "caption", "cover", "body"]) if (s[k]) out.push(s[k]);
  return out.join("\n").toLowerCase().replace(/\*/g, "");
};
// A project's "avoid" list holds claims it hasn't earned yet (the Ghost isn't printed).
// They're checked on the project's own posts and on any post that names the project.
const claims = (p) => {
  const t = texts(p);
  const found = [];
  for (const proj of Object.values(all)) {
    if (!proj.avoid?.length) continue;
    // Studio posts talk about every project, so they're held to every project's list.
    if (p.project !== proj.id && p.project !== "studio" && !t.includes(proj.name.toLowerCase())) continue;
    for (const phrase of proj.avoid) if (t.includes(phrase)) found.push(`claims "${phrase}" about ${proj.name}: ${proj.status ?? "not true yet"}`);
  }
  return found;
};
// The research rules (posts/VIRAL.md), as checks.
// A new shot at least every ~3 s; scenes you read get a little longer.
const MAX_SCENE_S = { hook: 4.2, media: 3.3, stat: 3.3, split: 4.2, grid: 4.6, tip: 4.4, type: 7.8 };
const MAX_REEL_S = { tips: 26, default: 30 };
const CTA = /\b(send|save|share|tag|comments?|follow|try it|link in bio)\b|\?/i;
const EMOJI = /\p{Extended_Pictographic}/gu;
const viral = (p) => {
  const found = [];
  let plan;
  try {
    plan = buildProps(p, pickSong(p, "2026-01-01"), brand);
  } catch {
    return found;
  }
  for (const sc of plan.props.scenes) {
    const max = MAX_SCENE_S[sc.type];
    if (max && sc.dur / 30 > max) found.push(`${sc.type} scene "${(sc.title ?? "").replace(/\*/g, "")}" holds ${(sc.dur / 30).toFixed(1)} s; keep it under ${max} s (fewer beats)`);
  }
  const cap = MAX_REEL_S[p.project] ?? MAX_REEL_S.default;
  if (plan.seconds > cap) found.push(`runs ${plan.seconds.toFixed(1)} s; ${p.project === "tips" ? "tips" : "this kind of Reel"} should stay under ${cap} s`);
  // Page chrome (motionmaxxing): counters and kicker labels read as a slide deck.
  for (const sc of [p.hook ?? {}, ...(p.scenes ?? [])]) {
    for (const k of ["title", "sub", "caption"]) if (/\b\d+\s*(of|\/)\s*\d+\b/i.test(sc[k] ?? "")) found.push(`"${sc[k]}" is a counter; counters read as page chrome, cut it`);
    if (sc.index) found.push(`kicker label "${sc.index}" above a headline reads as a slide; drop it`);
  }
  const paras = (p.caption ?? "").trim().split(/\n\s*\n/);
  if (!paras.slice(-2).some((x) => CTA.test(x))) found.push("caption needs a call to action in its last two paragraphs (send, save, follow, a question...)");
  const emoji = (p.caption ?? "").match(EMOJI) ?? [];
  if (emoji.length > 1) found.push(`caption has ${emoji.length} emoji; one at most, and only if it adds something`);
  return found;
};

const repeats = (p) => {
  const list = shots(p);
  const found = [];
  list.forEach((a, i) => list.slice(i + 1).forEach((b) => {
    if (a.where === b.where) return; // the two halves of one split
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
  problems.push(...claims(p));
  problems.push(...viral(p));
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

#!/usr/bin/env node
// Today's Reel, start to finish.
//
//   node scripts/daily.mjs                 # next unposted post in posts/, render, caption, page
//   node scripts/daily.mjs --post 004-flow-pov   # a specific post
//   node scripts/daily.mjs --song "Animals"      # override the song
//   node scripts/daily.mjs --dry           # plan only: print the cut, render nothing
//   node scripts/daily.mjs --mark          # record the post as used in posts/state.json
//   node scripts/daily.mjs --sync          # pull fresh footage first
//   node scripts/daily.mjs --engine remotion     # render with the old Remotion engine
//   node scripts/daily.mjs --build         # write the HyperFrames project only (.cache/hf/<post>/)
//
// Writes out/<post id>/ and copies the result to out/latest/: reel.mp4 (the upload),
// cover.jpg (grid thumbnail), caption.txt, report.json, qa/contact.jpg, page.html.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, arg, readJson, renderEnv, run } from "./lib.mjs";
import { buildProps, highlight, listPosts, nextPost, pickSong, state } from "./plan.mjs";
import { renderProject, writeProject } from "./hf/engine.mjs";

const date = arg("date", new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }));
const want = arg("post");
const post = want ? listPosts().find((p) => p.id === want || p.file.startsWith(want)) : nextPost();
if (!post) {
  console.log(want ? `No post matching "${want}" in posts/.` : "QUEUE EMPTY: every post in posts/ is marked used. Write new ones (posts/WRITING.md).");
  process.exit(want ? 1 : 2);
}
if (arg("sync")) run("node", ["scripts/sync.mjs"], { stdio: "inherit", timeout: 3600000 });

const brand = readJson("brand/brand.json");
const song = pickSong(post, date, arg("song"));
const plan = buildProps(post, song, brand);
await highlight(plan.props);
const remaining = listPosts().filter((p) => !state().posted[p.id] && p.id !== post.id).length;

const lines = [
  `post     ${post.id} (${post.project})`,
  `length   ${plan.seconds.toFixed(1)} s, ${plan.props.scenes.length} scenes`,
  ...plan.props.scenes.map((s) => `  ${(s.from / 30).toFixed(2).padStart(6)}s  ${s.type.padEnd(5)} ${s.title ?? s.before ?? ""}`.trimEnd()),
  `song     ${song.artist} - ${song.title} (${song.bpm} BPM, ${song.mood})${song.note ? `, ${song.note}` : ""}`,
  `downbeat ${plan.downbeat.toFixed(2)} s: start the song so its first big hit lands here`,
  `queue    ${remaining} post(s) left after this one${remaining < 5 ? "  << LOW: write more (posts/WRITING.md)" : ""}`,
];
const engine = arg("engine", "hyperframes");
if (engine !== "hyperframes" && engine !== "remotion") throw new Error(`--engine is hyperframes or remotion, not "${engine}"`);
lines.push(`engine   ${engine}`);
const hfDir = join(ROOT, ".cache/hf", post.id);
if (arg("build")) {
  const built = writeProject(plan.props, hfDir);
  console.log([...lines, ...built.scenes.map((s) => `  ${s.id.padEnd(14)} ${String(s.start).padStart(6)}s +${s.dur}s  in:${s.in || "-"} out:${s.out || "-"}`), `project  ${hfDir}`].join("\n"));
  process.exit(0);
}
if (arg("dry")) {
  console.log(lines.join("\n"));
  process.exit(0);
}

const out = join(ROOT, "out", post.id);
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "qa"), { recursive: true });
const propsFile = join(out, "props.json");
writeFileSync(propsFile, JSON.stringify(plan.props, null, 2));

const env = renderEnv();
const t0 = Date.now();
const master = join(out, "master.mp4");
if (engine === "hyperframes") {
  writeProject(plan.props, hfDir);
  renderProject(hfDir, master, env);
} else {
  run("npx", ["remotion", "render", "src/index.ts", "Reel", master, `--props=${propsFile}`, "--concurrency=4", "--log=error"], { env, timeout: 3600000 });
}

// The upload copy: H.264 High at a generous bitrate (Instagram re-encodes everything, and
// it does far less damage to a clean source), a silent AAC track so every uploader and
// the Graph API accept it, and faststart for streaming.
const reel = join(out, "reel.mp4");
run("ffmpeg", [
  "-v", "error", "-y", "-i", master, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
  "-map", "0:v", "-map", "1:a", "-shortest",
  "-c:v", "libx264", "-profile:v", "high", "-level", "4.2", "-crf", "16", "-maxrate", "14M", "-bufsize", "28M", "-preset", "slow",
  "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
  "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", reel,
]);
rmSync(master);

run("npx", ["remotion", "still", "src/index.ts", "Cover", join(out, "cover.png"), `--props=${propsFile}`, "--log=error"], { env, timeout: 600000 });
run("ffmpeg", ["-v", "error", "-y", "-i", join(out, "cover.png"), "-q:v", "2", join(out, "cover.jpg")]);
rmSync(join(out, "cover.png"));

// One contact sheet: a frame from the middle of every scene, for a single-glance check.
const mids = plan.props.scenes.map((s) => s.from + Math.min(s.dur - 1, Math.round(s.dur * 0.6)));
const sel = mids.map((f) => `eq(n\\,${f})`).join("+");
run("ffmpeg", ["-v", "error", "-y", "-i", reel, "-vf", `select='${sel}',scale=270:480,tile=${Math.min(mids.length, 6)}x${Math.ceil(mids.length / 6)}:padding=6:color=black`, "-frames:v", "1", "-vsync", "0", join(out, "qa/contact.jpg")]);

const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration,size", "-of", "json", reel]));
const v = probe.streams.find((s) => s.codec_type === "video");
const duration = Number(probe.format.duration);
const sizeMb = Number(probe.format.size) / 1e6;
const problems = [];
if (v.width !== 1080 || v.height !== 1920) problems.push(`frame is ${v.width}x${v.height}, want 1080x1920`);
// Render checks in the spirit of motionmaxxing's gates, with ffmpeg: the picture must not
// sit frozen for more than 1.4 s at the end, and must never go blank for more than 3 frames.
{
  const freeze = spawnSync("ffmpeg", ["-v", "info", "-i", reel, "-vf", "freezedetect=n=0.002:d=0.5", "-map", "0:v", "-f", "null", "-"], { encoding: "utf8" }).stderr ?? "";
  const starts = [...freeze.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...freeze.matchAll(/freeze_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const last = starts.length > ends.length ? starts[starts.length - 1] : null;
  if (last !== null && plan.seconds - last > 1.4) problems.push(`the picture holds still for the last ${(plan.seconds - last).toFixed(1)} s; end on motion or keep the end hold under 1.4 s`);
  const black = spawnSync("ffmpeg", ["-v", "info", "-i", reel, "-vf", "blackdetect=d=0.11:pix_th=0.04", "-an", "-f", "null", "-"], { encoding: "utf8" }).stderr ?? "";
  const blanks = [...black.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)];
  for (const [, a, b] of blanks) problems.push(`blank frames from ${a} s to ${b} s`);
}
if (Math.abs(duration - plan.seconds) > 0.25) problems.push(`duration ${duration.toFixed(2)} s, planned ${plan.seconds.toFixed(2)} s`);
if (sizeMb > 250) problems.push(`file is ${sizeMb.toFixed(0)} MB`);

writeFileSync(join(out, "caption.txt"), plan.caption + "\n");
const report = {
  date,
  post: post.id,
  project: post.project,
  seconds: Number(duration.toFixed(2)),
  sizeMb: Number(sizeMb.toFixed(1)),
  song: `${song.artist} - ${song.title}`,
  bpm: song.bpm,
  downbeat: Number(plan.downbeat.toFixed(2)),
  queueLeft: remaining,
  renderSeconds: Math.round((Date.now() - t0) / 1000),
  engine,
  problems,
};
writeFileSync(join(out, "report.json"), JSON.stringify(report, null, 2));

// The download page the nightly run republishes as an Artifact.
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const tpl = readFileSync(join(ROOT, "artifact/daily.html"), "utf8");
const page = tpl
  .replaceAll("{{DATE}}", esc(date))
  .replaceAll("{{TITLE}}", esc(post.hook.title.replace(/\*/g, "")))
  .replaceAll("{{PROJECT}}", esc(post.project))
  .replaceAll("{{SONG}}", esc(report.song))
  .replaceAll("{{BPM}}", String(song.bpm))
  .replaceAll("{{DOWNBEAT}}", report.downbeat.toFixed(2))
  .replaceAll("{{SECONDS}}", report.seconds.toFixed(1))
  .replaceAll("{{CAPTION}}", esc(plan.caption))
  .replaceAll("{{POST}}", esc(post.id));
writeFileSync(join(out, "page.html"), page);

const latest = join(ROOT, "out/latest");
rmSync(latest, { recursive: true, force: true });
mkdirSync(join(latest, "qa"), { recursive: true });
for (const f of ["reel.mp4", "cover.jpg", "caption.txt", "report.json", "page.html", "qa/contact.jpg"]) copyFileSync(join(out, f), join(latest, f));

if (arg("mark")) {
  const st = state();
  st.posted[post.id] = date;
  writeFileSync(join(ROOT, "posts/state.json"), JSON.stringify(st, null, 2) + "\n");
}

console.log(
  [
    ...lines,
    `rendered ${report.seconds} s, ${report.sizeMb} MB in ${report.renderSeconds} s`,
    `files    out/latest/{reel.mp4,cover.jpg,caption.txt,page.html,qa/contact.jpg}`,
    arg("mark") ? `marked   ${post.id} as posted ${date}` : `not marked (pass --mark to use it up)`,
    problems.length ? `PROBLEMS ${problems.join("; ")}` : `checks   ok`,
  ].join("\n"),
);
if (problems.length) process.exit(1);

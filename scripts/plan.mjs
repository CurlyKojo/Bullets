// Turns a post script (posts/*.json) into the Reel's props: resolves media references,
// lays every scene on the song's beat grid, and builds the Instagram caption.
import { existsSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { ROOT, projects, readJson } from "./lib.mjs";

const FPS = 30;
const MAX_SECONDS = 34;

// How long each scene type holds by default, in beats.
const DEFAULT_BEATS = { hook: 4, media: 4, stat: 4, type: 12, split: 6, grid: 8, tip: 8, end: 3 };

export const listPosts = () =>
  readdirSync(join(ROOT, "posts"))
    .filter((f) => /^\d{3}-.+\.json$/.test(f))
    .sort()
    .map((f) => ({ file: f, ...readJson(`posts/${f}`) }));

export const state = () => (existsSync(join(ROOT, "posts/state.json")) ? readJson("posts/state.json") : { posted: {} });

// The next post: anything marked "next": true jumps the queue (one-off features like a
// showcase), otherwise the lowest number not yet posted.
export const nextPost = () => {
  const done = state().posted;
  const open = listPosts().filter((p) => !done[p.id]);
  return open.find((p) => p.next) ?? open[0];
};

// Same song never two days running, and mood-matched when the post asks for one.
export const pickSong = (post, date, title) => {
  const { tracks } = readJson("music.json");
  if (title) {
    const t = tracks.find((x) => x.title.toLowerCase() === String(title).toLowerCase());
    if (!t) throw new Error(`No track titled "${title}" in music.json`);
    return t;
  }
  const pool = post.mood ? tracks.filter((t) => t.mood === post.mood) : tracks;
  const list = pool.length ? pool : tracks;
  const day = Math.floor(Date.parse(date) / 86400000);
  return list[day % list.length];
};

const KIND = { ".mp4": "video", ".webm": "video", ".mov": "video", ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image", ".stl": "stl" };

// "ghost:hero" or { ref: "burnline:wide", start: 60, zoom: "out" } -> Media
const resolveMedia = (ref, all) => {
  if (!ref) return undefined;
  const o = typeof ref === "string" ? { ref } : ref;
  const [pid, ...rest] = o.ref.split(":");
  const key = rest.join(":");
  const project = all[pid];
  if (!project) throw new Error(`Unknown project in media ref "${o.ref}"`);
  const dir = join(ROOT, "public/assets", pid);
  const prefix = key.includes("/") ? key : key;
  const hit = existsSync(join(dir, prefix + ".mp4"))
    ? prefix + ".mp4"
    : ["png", "jpg", "webp", "stl", "mp4"].map((e) => `${prefix}.${e}`).find((f) => existsSync(join(dir, f)));
  if (!hit) throw new Error(`Media "${o.ref}" not found under public/assets/${pid}/. Run: node scripts/sync.mjs ${pid}`);
  const kind = KIND[extname(hit)];
  return {
    kind,
    src: `assets/${pid}/${hit}`,
    ...(kind === "stl" ? { color: o.color ?? project.filament ?? "#e9e4da" } : {}),
    ...(o.start !== undefined ? { start: o.start } : {}),
    ...(o.fit ? { fit: o.fit } : {}),
    ...(o.zoom ? { zoom: o.zoom } : {}),
  };
};

// Hooks have to be readable before the first cut: about half a second plus a fifth of a second
// per word, rounded up to whole beats, never under four.
const hookBeats = (title, beat) => {
  const words = (title ?? "").split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.ceil((0.6 + 0.22 * words) / beat));
};

export const buildCaption = (post, project) => {
  const sets = readJson("brand/hashtags.json");
  const names = [...(post.hashtags ?? []), ...(project.hashtags ?? []), "maker"];
  const tags = [];
  for (const n of names) {
    for (const t of n.startsWith("#") ? [n] : sets[n] ?? []) {
      if (!tags.includes(t) && tags.length < 5) tags.push(t);
    }
  }
  return `${post.caption.trim()}\n\n${tags.join(" ")}`;
};

export const buildProps = (post, song, brand) => {
  const all = projects();
  const project = all[post.project];
  if (!project) throw new Error(`Post ${post.id}: unknown project "${post.project}"`);
  const beatSec = 60 / song.bpm;
  const beat = (n) => Math.round(n * beatSec * FPS);

  const raw = [
    { type: "hook", ...post.hook, beats: post.hook.beats ?? hookBeats(post.hook.title, beatSec) },
    ...post.scenes,
    { type: "end", ...(post.end ?? {}) },
  ];
  // Beats are counted cumulatively and rounded once, so cuts never drift off the grid.
  let at = 0;
  const scenes = raw.map((s) => {
    const n = s.beats ?? DEFAULT_BEATS[s.type] ?? 4;
    const from = beat(at);
    at += n;
    const { beats: _b, media, media2, items, ...rest } = s;
    return {
      ...rest,
      from,
      dur: beat(at) - from,
      ...(media ? { media: resolveMedia(media, all) } : {}),
      ...(media2 ? { media2: resolveMedia(media2, all) } : {}),
      ...(items ? { items: items.map((m) => resolveMedia(m, all)) } : {}),
    };
  });
  // Emoji props are used sparingly: one, on the first tip card of a tip Reel, nowhere else.
  const firstTip = post.project === "tips" ? scenes.find((sc) => sc.type === "tip" && !sc.media) : undefined;
  if (firstTip) firstTip.prop = true;
  const total = beat(at);
  if (total / FPS > MAX_SECONDS) throw new Error(`Post ${post.id} runs ${(total / FPS).toFixed(1)} s; keep it under ${MAX_SECONDS} s (fewer scenes or beats).`);
  return {
    props: {
      total,
      bpm: song.bpm,
      accent: post.accent ?? project.accent,
      project: { name: project.name, kind: post.kind ?? project.kind, link: project.link },
      handle: brand.handle,
      brand: brand.name,
      scenes,
    },
    downbeat: scenes[1].from / FPS,
    seconds: total / FPS,
    caption: buildCaption(post, project),
  };
};

// Syntax colours for code in before/after scenes. A scene with `lang` (or `beforeLang` /
// `afterLang`) gets its text tokenised here, at plan time, so the video just paints
// coloured spans as it types. Theme: vitesse-dark, muted enough to sit on graphite.
export const highlight = async (props) => {
  const { codeToTokens } = await import("shiki");
  const toLines = async (text, lang) => {
    if (!text || !lang || lang === "text") return undefined;
    const { tokens } = await codeToTokens(text, { lang, theme: "vitesse-dark" });
    return tokens.map((line) => line.map((t) => ({ t: t.content, c: t.color })));
  };
  for (const s of props.scenes) {
    if (s.type !== "type") continue;
    s.beforeTokens = await toLines(s.before, s.beforeLang ?? s.lang);
    s.afterTokens = await toLines(s.after, s.afterLang ?? s.lang);
  }
  return props;
};

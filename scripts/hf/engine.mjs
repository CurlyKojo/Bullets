// The HyperFrames engine: turns a planned Reel (the props scripts/plan.mjs builds, already
// on the song's beat grid) into a HyperFrames project and renders it.
//
//   writeProject(props, dir)        HTML scenes + copied media under dir/
//   renderProject(dir, file, env)   npx hyperframes render -> file (MP4)
//
// Every scene is its own sub-composition with one paused GSAP timeline; anything that is not
// a tween (typing, rolling digits, 3D) is drawn from that timeline's clock, so each frame is a
// pure function of time. Rules it follows: HyperFrames' render contract, Instagram's safe
// zone (words between 250 and 1340 px, clear of the right rail) and the motion craft in
// posts/VIRAL.md (words land like speech, no page chrome, every frame alive, short end).
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, projects, run } from "../lib.mjs";

const FPS = 30;
const INK = "#0a0c0f", PAPER = "#f4f6f8", DIM = "#8f99a6", LINE = "#232a33";
const OK = "#5fe3a1";
const H = 0.15; // half the overlap at each seam
const HF = "hyperframes@0.9.13";

const r3 = (x) => Math.round(x * 1000) / 1000;
const sec = (frames) => r3(frames / FPS);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Same picks as the Remotion set: prompt tips get the chat bubble, coding the brackets, AI the network.
const kindFor = (label = "") => {
  const l = label.toLowerCase();
  if (l.includes("prompt")) return "prompt";
  if (l.includes("coding") || l.includes("code")) return "code";
  return "ai";
};
const EMOJI = { prompt: "light-bulb", code: "laptop", ai: "brain" };

// ---- Media probing ----------------------------------------------------------------------
function probe(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height:format=duration", "-of", "json", file], { encoding: "utf8" });
  try {
    const j = JSON.parse(r.stdout);
    const s = j.streams.find((x) => x.width) ?? {};
    return { w: s.width ?? 1080, h: s.height ?? 1920, dur: Number(j.format?.duration) || 0 };
  } catch {
    return { w: 1080, h: 1920, dur: 0 };
  }
}

// ---- Words ------------------------------------------------------------------------------
// "*word*" marks the accent. Every word is its own span so it can land on its own.
// A word that follows a star with no space ("*Ghost*.") is glued to the one before it.
function words(text, cls, accent) {
  let out = "";
  let hot = false;
  let prev = ""; // the raw text before the last star, to tell "*a*." from "the *a*"
  for (const tok of String(text).split(/(\*)/)) {
    if (tok === "*") {
      hot = !hot;
      continue;
    }
    const joined = prev !== "" && !/\s$/.test(prev) && !/^\s/.test(tok);
    prev = tok || prev;
    tok.split(/\s+/).forEach((w, i) => {
      if (!w) return;
      const glue = i === 0 && out && joined;
      out += `${out && !glue ? " " : ""}<span class="${cls}"${hot ? ` style="color:${accent}"` : ""}>${esc(w)}</span>`;
    });
  }
  return out;
}
const plain = (t) => String(t ?? "").replace(/\*/g, "");
const titleSize = (t) => {
  const n = plain(t).length;
  return n <= 14 ? 128 : n <= 26 ? 104 : n <= 44 ? 88 : 76;
};
// Words land like speech: whole words, settling from 1.35x, never growing from zero.
const wordsJs = (sel, at, gap) =>
  `tl.fromTo("${sel}", { opacity: 0, scale: 1.35, filter: "blur(6px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.34, ease: "expo.out", stagger: ${gap} }, ${r3(at)});`;
const lineJs = (sel, at) =>
  `tl.fromTo("${sel}", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out" }, ${r3(at)});`;

const FONT_FACE = `
    @font-face { font-family: "Geist"; src: url("assets/fonts/Geist.woff2") format("woff2"); font-weight: 100 900; }
    @font-face { font-family: "Geist Mono"; src: url("assets/fonts/GeistMono.woff2") format("woff2"); font-weight: 100 900; }`;

const copyCss = (P) => `
    #${P}-copy { position: absolute; left: 80px; right: 140px; top: 270px; }
    #${P}-title { font-family: "Geist", sans-serif; font-weight: 600; line-height: 1.02; letter-spacing: -0.035em; color: ${PAPER}; margin: 0;
      text-shadow: 0 4px 30px rgba(0,0,0,0.45); text-wrap: balance; }
    .${P}-w { display: inline-block; transform-origin: 50% 70%; }
    #${P}-sub { margin: 22px 0 0; font: 500 42px/1.25 "Geist", sans-serif; color: ${DIM}; text-wrap: balance; }
    #${P}-cap { position: absolute; left: 80px; right: 140px; top: 1222px; margin: 0;
      font: 500 44px/1.24 "Geist", sans-serif; letter-spacing: -0.01em; color: ${PAPER};
      text-shadow: 0 2px 14px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.6); text-wrap: balance; }`;

// Title (+ sub) at the top of the safe zone and the caption as a subtitle near the bottom.
function copyBlock(P, s, accent, at, { gap = 0.167, size, top } = {}) {
  const html = [];
  const js = [];
  if (s.title || s.sub) {
    html.push(`<div id="${P}-copy"${top ? ` style="top:${top}px"` : ""}>`);
    if (s.title) {
      html.push(`<h1 id="${P}-title" style="font-size:${size ?? titleSize(s.title)}px">${words(s.title, `${P}-w`, accent)}</h1>`);
      js.push(wordsJs(`.${P}-w`, at, gap));
    }
    if (s.sub) {
      html.push(`<p id="${P}-sub">${esc(s.sub)}</p>`);
      js.push(lineJs(`#${P}-sub`, at + 0.25));
    }
    html.push(`</div>`);
  }
  if (s.caption) {
    html.push(`<p id="${P}-cap">${esc(s.caption)}</p>`);
    js.push(lineJs(`#${P}-cap`, at + 0.1)); // with the title: captions need every frame of read time
  }
  return { html: html.join("\n      "), js: js.join("\n    ") };
}

// ---- Backdrop: ink, a faint grid and two accent glows that drift for the whole scene ------
const backdropCss = (P, accent) => `
    #${P}-bg { position: absolute; inset: 0; background: ${INK}; overflow: hidden; }
    #${P}-grid { position: absolute; inset: 0; opacity: 0.35;
      background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 72px 72px;
      mask-image: radial-gradient(ellipse 70% 55% at 50% 45%, #000 30%, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 70% 55% at 50% 45%, #000 30%, transparent 75%); }
    .${P}-glow { position: absolute; width: 900px; height: 900px; border-radius: 50%; filter: blur(80px); background: ${accent}; }
    #${P}-glow-a { left: -260px; top: 240px; opacity: 0.22; }
    #${P}-glow-b { left: 460px; top: 980px; opacity: 0.12; }`;
const backdropHtml = (P) => `<div id="${P}-bg" data-layout-ignore><div id="${P}-grid"></div><div id="${P}-glow-a" class="${P}-glow"></div><div id="${P}-glow-b" class="${P}-glow"></div></div>`;
const backdropJs = (P, dur) => `tl.fromTo("#${P}-glow-a", { x: 0, y: 0 }, { x: 140, y: -90, duration: ${dur}, ease: "sine.inOut" }, 0);
    tl.fromTo("#${P}-glow-b", { x: 0, y: 0 }, { x: -120, y: 70, duration: ${dur}, ease: "sine.inOut" }, 0);`;

// ---- Media ------------------------------------------------------------------------------
// One picture in a box (the full frame by default). Tall footage fills the box; square and
// landscape footage sits on a rounded card; landscape stills feather into the backdrop; an
// STL turns on a turntable. Returns css/html/js plus the 3D it needs, if any.
function mediaLayer(P, id, m, dur, ctx, { box = { top: 0, height: 1920 }, dim = 0, push = true, fill = false, uiCardTop } = {}) {
  const out = { css: "", html: "", js: "", three: null, mode: "none" };
  if (!m || m.kind === "none" || !m.src) return out;
  const el = `${P}-${id}`;
  const full = box.top === 0 && box.height === 1920;
  if (m.kind === "stl") {
    out.mode = "stl";
    ctx.assets.add(m.src);
    out.three = { type: "turntables", items: [{ src: m.src, x: 540, y: box.top + box.height * (full ? 0.5 : 0.5), size: full ? 640 : Math.min(560, box.height * 0.7), color: m.color, delay: 0.1 }] };
    return out;
  }
  ctx.assets.add(m.src);
  const info = probe(join(ROOT, "public", m.src));
  const aspect = info.w / info.h;
  const tall = aspect < 0.7;
  const fitCover = fill || !full || tall || m.fit === "cover";
  const z0 = m.zoom === "out" ? 1.12 : 1.0, z1 = m.zoom === "out" ? 1.02 : 1.08;
  const timed = `class="clip" data-start="0" data-duration="${dur}" data-track-index="0"`;
  let media;
  if (m.kind === "video") {
    let start = (m.start ?? 0) / FPS;
    if (info.dur && start + dur > info.dur - 0.05) start = Math.max(0, info.dur - dur - 0.05);
    media = `<video id="${el}-v" ${timed} data-media-start="${r3(start)}" src="${m.src}" muted playsinline></video>`;
  } else {
    media = `<img id="${el}-v" ${timed} src="${m.src}" alt="" />`;
  }
  if (m.ui && full) {
    // An app's own screen, big enough to read: near full width, cropped to the part
    // under the app's header (m.uiTop px of the source, which also drops the app's own
    // wordmark), from just under the title down to the caption.
    out.mode = "ui";
    const w = 940, k = w / info.w, top = uiCardTop ?? 420, bottom = 1196;
    const h = bottom - top, srcTop = (m.uiTop ?? 0) * k;
    out.css = `
    #${el} { position: absolute; left: ${(1080 - w) / 2}px; top: ${top}px; width: ${w}px; height: ${h}px; border-radius: 30px; overflow: hidden;
      box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12); background: #000; }
    #${el}-v { position: absolute; left: 0; top: ${-Math.round(srcTop)}px; width: ${w}px; height: ${Math.round(info.h * k)}px; object-fit: cover; }`;
    out.html = `<div id="${el}">${media}</div>`;
    out.js = `tl.fromTo("#${el}", { y: 14 }, { y: -10, duration: ${dur}, ease: "sine.inOut" }, 0);`;
    return out;
  }
  if (fitCover) {
    out.mode = "cover";
    out.css = `
    #${el} { position: absolute; left: 0; top: ${box.top}px; width: 1080px; height: ${box.height}px; overflow: hidden; }
    #${el}-z { position: absolute; inset: 0; transform-origin: 50% 50%; }
    #${el}-v { position: absolute; left: 0; top: 0; width: 1080px; height: ${box.height}px; object-fit: cover; }`;
    out.html = `<div id="${el}"><div id="${el}-z">${media}</div>${dim ? `<div style="position:absolute;inset:0;background:rgba(5,7,13,${dim})"></div>` : ""}</div>`;
    if (push) out.js = `tl.fromTo("#${el}-z", { scale: ${z0} }, { scale: ${z1}, duration: ${dur}, ease: "none" }, 0);`;
    return out;
  }
  if (m.kind === "video") {
    // A card: square or landscape footage, framed and drifting gently.
    out.mode = "card";
    const w = aspect >= 1.2 ? 900 : 720;
    const h = Math.round(w / aspect);
    const top = Math.round(430 + Math.max(0, (740 - h) / 2));
    out.css = `
    #${el} { position: absolute; left: ${(1080 - w) / 2}px; top: ${top}px; width: ${w}px; height: ${h}px; border-radius: 44px; overflow: hidden;
      box-shadow: 0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07); background: #000; }
    #${el}-v { position: absolute; left: 0; top: 0; width: ${w}px; height: ${h}px; object-fit: cover; }`;
    out.html = `<div id="${el}">${media}</div>${dim ? `<div style="position:absolute;inset:0;background:rgba(5,7,13,${dim})"></div>` : ""}`;
    out.js = `tl.fromTo("#${el}", { y: 40, rotation: -1.2 }, { y: -20, rotation: 0.8, duration: ${dur}, ease: "sine.inOut" }, 0);`;
    return out;
  }
  // A still that isn't tall: feathered into the backdrop, drifting.
  out.mode = "feather";
  // Fit inside the frame, so reference sheets and labelled renders keep their edges.
  const w = Math.min(1040, Math.round(1040 * Math.min(1, aspect)));
  const h = Math.round(w / aspect);
  const cy = 900;
  out.css = `
    #${el} { position: absolute; inset: 0; }
    #${el}-v { position: absolute; left: ${(1080 - w) / 2}px; top: ${Math.round(cy - h / 2)}px; width: ${w}px; height: ${h}px;
      mask-image: radial-gradient(ellipse 52% 54% at 50% 50%, #000 70%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 52% 54% at 50% 50%, #000 70%, transparent 100%); }`;
  out.html = `<div id="${el}">${media}</div>${dim ? `<div style="position:absolute;inset:0;background:rgba(5,7,13,${dim})"></div>` : ""}`;
  out.js = `tl.fromTo("#${el}-v", { x: 30, y: 10, scale: ${z0} }, { x: -20, y: -10, scale: ${r3((z0 + z1) / 2)}, duration: ${dur}, ease: "sine.inOut" }, 0);`;
  return out;
}

// Top and bottom scrims so words read over full-bleed footage.
const scrimHtml = (P) => `<div id="${P}-scrim" style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(10,12,15,0.82) 0%, rgba(10,12,15,0.3) 24%, rgba(10,12,15,0) 38%, rgba(10,12,15,0) 54%, rgba(10,12,15,0.65) 64%, rgba(10,12,15,0.7) 74%, rgba(10,12,15,0) 90%)"></div>`;

// ---- Scenes -----------------------------------------------------------------------------
function sceneParts(s, P, r, ctx) {
  const dur = s.d;
  const accent = s.accent ?? r.accent;
  const at = s.cutIn + 0.05;
  const kind3d = kindFor(r.project.kind);
  let css = backdropCss(P, accent) + copyCss(P);
  const html = [];
  const js = [backdropJs(P, dur)];
  let three = null;
  const extra = []; // clock-driven drawers: JS bodies taking (t)

  if (s.type === "hook") {
    const ml = mediaLayer(P, "m", s.media, dur, ctx, { push: false, uiCardTop: 640 });
    const textOnly = ml.mode === "none";
    css += ml.css;
    html.push(ml.html);
    if (ml.mode === "cover") js.push(`tl.fromTo("#${P}-m-z", { scale: 1.12 }, { scale: 1.02, duration: ${dur}, ease: "power2.out" }, 0);`);
    else js.push(ml.js);
    if (ml.three) three = ml.three;
    if (textOnly) three = { type: "object", kind: kind3d, y: 1290, size: 500 };
    if (ml.mode === "cover") html.push(scrimHtml(P));
    // A short accent at the end of the hook ("*1–10*") becomes the giant number under it.
    const m = /^(.*?)\s*\*([^*]{1,6})\*\s*$/.exec(s.title ?? "");
    if (m && !m[1].includes("*")) {
      css += `
    #${P}-copy { top: ${textOnly ? 380 : 290}px; }
    #${P}-big { font: 600 300px/0.95 "Geist", sans-serif; letter-spacing: -0.05em; color: ${accent}; margin: 18px 0 0 -8px; font-variant-numeric: tabular-nums; }`;
      html.push(`<div id="${P}-copy"><h1 id="${P}-title" style="font-size:84px">${words(m[1], `${P}-w ${P}-a`, accent)}</h1><div id="${P}-big"><span class="${P}-w ${P}-b">${esc(m[2])}</span></div>${s.sub ? `<p id="${P}-sub">${esc(s.sub)}</p>` : ""}</div>`);
      js.push(wordsJs(`.${P}-a`, 0, 0.1));
      const nWords = m[1].split(/\s+/).filter(Boolean).length;
      js.push(`tl.fromTo(".${P}-b", { opacity: 0, scale: 1.35, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "expo.out" }, ${r3(0.1 * nWords + 0.2)});`);
      if (s.sub) js.push(lineJs(`#${P}-sub`, 0.1 * nWords + 0.45));
      if (s.caption) {
        html.push(`<p id="${P}-cap">${esc(s.caption)}</p>`);
        js.push(lineJs(`#${P}-cap`, 0.3));
      }
    } else {
      const size = textOnly ? (plain(s.title).length > 40 ? 96 : 112) : undefined;
      const c = copyBlock(P, s, accent, 0, { gap: 0.1, size, top: textOnly ? 380 : 290 });
      html.push(c.html);
      js.push(c.js);
    }
  }

  if (s.type === "media") {
    const ml = mediaLayer(P, "m", s.media, dur, ctx);
    css += ml.css;
    html.push(ml.html);
    js.push(ml.js);
    if (ml.three) three = ml.three;
    if (ml.mode === "cover") html.push(scrimHtml(P));
    const c = copyBlock(P, s, accent, at);
    html.push(c.html);
    js.push(c.js);
  }

  if (s.type === "stat") {
    const ml = mediaLayer(P, "m", s.media, dur, ctx, { dim: 0.62, fill: true });
    css += ml.css;
    html.push(ml.html);
    js.push(ml.js);
    if (ml.three) three = ml.three;
    // The number rolls like an odometer: one column of digits per place.
    const dec = s.decimals ?? 0;
    const value = Number(s.value ?? 0);
    const final = value.toFixed(dec);
    const intDigits = final.split(".")[0].replace("-", "").length;
    const places = [];
    for (let e = intDigits - 1; e >= -dec; e--) places.push(e);
    const col = (e) => `<span class="${P}-col" data-e="${e}"><span class="${P}-strip">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<span>${d}</span>`).join("")}</span></span>`;
    const digits = places.map((e) => (e === -1 ? `<span class="${P}-dot">.</span>${col(e)}` : col(e))).join("");
    css += `
    #${P}-num { position: absolute; left: 80px; right: 120px; top: 400px; font: 600 300px/1 "Geist", sans-serif; letter-spacing: -0.04em; color: ${PAPER};
      font-variant-numeric: tabular-nums; white-space: nowrap; display: flex; align-items: flex-end; }
    .${P}-col { display: inline-block; height: 1em; overflow: hidden; }
    .${P}-strip { display: flex; flex-direction: column; }
    .${P}-strip > span { height: 1em; line-height: 1em; display: block; }
    #${P}-unit { font-size: 120px; letter-spacing: -0.03em; margin: 0 0 22px 16px; color: ${accent}; }
    #${P}-copy { top: 760px; }`;
    html.push(`<div id="${P}-num" data-layout-ignore>${s.prefix ? `<span>${esc(s.prefix)}</span>` : ""}${digits}${s.unit ? `<span id="${P}-unit">${esc(s.unit)}</span>` : ""}</div>`);
    js.push(`tl.fromTo("#${P}-num", { opacity: 0, scale: 1.12, filter: "blur(8px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "expo.out", transformOrigin: "0% 100%" }, ${r3(s.cutIn)});`);
    const rollEnd = Math.min(dur - 0.2, s.cutIn + 0.75);
    extra.push(`(function () {
      var cols = Array.prototype.slice.call(document.querySelectorAll(".${P}-col"));
      var V = ${value}, DEC = ${dec}, A = ${r3(s.cutIn + 0.07)}, B = ${r3(rollEnd)};
      return function (t) {
        var p = Math.min(1, Math.max(0, (t - A) / (B - A)));
        var e4 = 1 - Math.pow(1 - p, 4);
        var c = p >= 1 ? V : V * e4;
        cols.forEach(function (el) {
          var e = Number(el.getAttribute("data-e"));
          var q = c / Math.pow(10, e);
          var fl = Math.floor(q + 1e-6);
          var x;
          if (p >= 1) x = (e === -DEC ? Math.round(q) : fl) % 10;
          else if (e === -DEC) x = q % 10;
          else x = (fl % 10) + Math.max(0, (q - fl - 0.9) * 10);
          el.firstChild.style.transform = "translateY(" + (-x) + "em)";
          el.style.opacity = e > 0 && c < Math.pow(10, e) && p < 1 ? 0.25 : 1;
        });
      };
    })()`);
    const c = copyBlock(P, { title: s.title, caption: undefined, sub: s.sub }, accent, at + 0.2, { size: 72 });
    html.push(c.html);
    js.push(c.js);
    if (s.caption) {
      html.push(`<p id="${P}-cap" style="top:1000px">${esc(s.caption)}</p>`);
      js.push(lineJs(`#${P}-cap`, at + 0.4));
    }
  }

  if (s.type === "type") {
    if (s.media) {
      const ml = mediaLayer(P, "m", s.media, dur, ctx, { dim: 0.7, fill: true });
      css += ml.css;
      html.push(ml.html);
      js.push(ml.js);
    } else {
      three = { type: "object", kind: "none", y: 0, size: 0 }; // dust only
    }
    const before = s.before ?? "", after = s.after ?? "";
    const toSegs = (tokens, text) => (tokens ? tokens.flatMap((line, i) => [...(i ? [{ t: "\n" }] : []), ...line.map((x) => ({ t: x.t, c: x.c }))]) : [{ t: text }]);
    const bSegs = toSegs(s.beforeTokens, before), aSegs = toSegs(s.afterTokens, after);
    const typeEnd = Math.min(dur * 0.42, Math.max(12, before.length * 0.9) / FPS) + s.cutIn;
    const flip = typeEnd + 6 / FPS;
    const bSize = before.length > 120 ? 30 : before.length < 60 ? 44 : 38;
    const aSize = after.length > 150 ? (s.mono ? 30 : 34) : s.mono ? 37 : 40;
    css += `
    #${P}-copy { top: 250px; }
    #${P}-cards { position: absolute; top: 560px; left: 80px; width: 860px; display: flex; flex-direction: column; gap: 34px; }
    .${P}-card { background: rgba(11,14,20,0.92); border: 1.5px solid ${LINE}; border-radius: 20px; padding: 34px 38px; box-shadow: 0 30px 80px rgba(0,0,0,0.45); }
    .${P}-label { font: 500 28px/1 "Geist Mono", monospace; color: ${DIM}; margin-bottom: 16px; }
    #${P}-before { font: 400 ${bSize}px/1.35 "Geist Mono", monospace; color: ${PAPER}; min-height: 104px; white-space: pre-wrap; }
    #${P}-after { font: ${s.mono ? 400 : 600} ${aSize}px/1.35 ${s.mono ? '"Geist Mono", monospace' : '"Geist", sans-serif'}; color: ${PAPER}; min-height: 160px; white-space: pre-wrap; }
    #${P}-caret { color: ${accent}; }
    #${P}-meter { margin-top: 22px; }
    #${P}-mrow { display: flex; justify-content: space-between; font: 500 28px/1 "Geist Mono", monospace; color: ${DIM}; }
    #${P}-track { height: 12px; border-radius: 6px; background: #1c2433; margin-top: 10px; overflow: hidden; }
    #${P}-fill { height: 100%; width: 0; background: linear-gradient(90deg, ${accent}, ${OK}); }
    #${P}-flash { position: absolute; inset: 0; background: ${accent}; opacity: 0; mix-blend-mode: screen; pointer-events: none; }`;
    const segHtml = (segs, id) => segs.map((g, i) => `<span class="${P}-${id}s" data-i="${i}"${g.c ? ` style="color:${g.c}"` : ""}></span>`).join("");
    const meter = s.meter
      ? `<div id="${P}-meter"><div id="${P}-mrow"><span>${esc(s.meter.label ?? "lines used")}</span><span id="${P}-mval">0 / ${s.meter.limit}</span></div><div id="${P}-track"><div id="${P}-fill"></div></div></div>`
      : "";
    html.push(`<div id="${P}-cards" data-hold>
        <div class="${P}-card" id="${P}-bcard"><div class="${P}-label">${esc(s.labels?.[0] ?? "what you wrote")}</div><div id="${P}-before">${segHtml(bSegs, "b")}<span id="${P}-caret">▍</span></div></div>
        <div class="${P}-card" id="${P}-acard"><div class="${P}-label" style="color:${accent}">${esc(s.labels?.[1] ?? "what comes out")}</div><div id="${P}-after">${segHtml(aSegs, "a")}</div>${meter}</div>
      </div>
      <div id="${P}-flash"></div>`);
    js.push(`tl.fromTo("#${P}-cards", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "expo.out" }, ${r3(s.cutIn)});`);
    js.push(`tl.fromTo("#${P}-acard", { opacity: 0.25, borderColor: "${accent}33" }, { opacity: 1, borderColor: "${accent}", duration: 0.12, ease: "power2.out" }, ${r3(flip)});`);
    js.push(`tl.fromTo("#${P}-flash", { opacity: 0 }, { opacity: 0.18, duration: ${r3(2 / FPS)}, ease: "none" }, ${r3(flip - 2 / FPS)});`);
    js.push(`tl.to("#${P}-flash", { opacity: 0, duration: 0.2, ease: "power2.out" }, ${r3(flip)});`);
    extra.push(`(function () {
      var B = ${JSON.stringify(bSegs.map((g) => g.t))}, A = ${JSON.stringify(aSegs.map((g) => g.t))};
      var bEls = document.querySelectorAll(".${P}-bs"), aEls = document.querySelectorAll(".${P}-as");
      var caret = document.getElementById("${P}-caret");
      var mval = document.getElementById("${P}-mval"), fill = document.getElementById("${P}-fill");
      var NB = ${before.length}, NA = ${after.length}, T0 = ${r3(s.cutIn + 2 / FPS)}, T1 = ${r3(typeEnd)}, FLIP = ${r3(flip)};
      var M = ${s.meter ? JSON.stringify({ used: s.meter.used, limit: s.meter.limit }) : "null"};
      function paint(els, segs, n) { for (var i = 0; i < els.length; i++) { var p = segs[i].slice(0, Math.max(0, n)); n -= segs[i].length; els[i].textContent = p; } }
      var clamp = function (x) { return Math.min(1, Math.max(0, x)); };
      return function (t) {
        paint(bEls, B, Math.floor(clamp((t - T0) / (T1 - T0)) * NB));
        paint(aEls, A, Math.floor(clamp((t - FLIP) / ${r3(14 / FPS)}) * NA));
        caret.style.opacity = t < FLIP && Math.floor(t * ${FPS} / 8) % 2 === 0 ? 1 : 0;
        if (M) {
          var k = clamp((t - FLIP - ${r3(8 / FPS)}) / ${r3(14 / FPS)});
          mval.textContent = Math.round(M.used * k) + " / " + M.limit + (k >= 1 ? " \\u2713" : "");
          mval.style.color = k >= 1 ? "${OK}" : "${PAPER}";
          fill.style.width = (M.used / M.limit) * 100 * k + "%";
        }
      };
    })()`);
    if (s.title) {
      const c = copyBlock(P, { title: s.title }, accent, at, { size: 76 });
      html.push(c.html);
      js.push(c.js);
    }
  }

  if (s.type === "split") {
    const top = mediaLayer(P, "m1", s.media, dur, ctx, { box: { top: 0, height: 960 } });
    const bot = mediaLayer(P, "m2", s.media2, dur, ctx, { box: { top: 960, height: 960 } });
    css += top.css + bot.css;
    css += `
    #${P}-lower { position: absolute; inset: 0; }
    .${P}-chip { position: absolute; left: 80px; font: 600 34px/1 "Geist Mono", monospace; color: ${INK}; padding: 10px 18px; border-radius: 10px; }
    #${P}-rule { position: absolute; left: 0; top: 958px; width: 1080px; height: 4px; background: ${accent}; transform-origin: 0 50%; }
    #${P}-pill { position: absolute; left: 0; right: 0; top: 890px; display: flex; justify-content: center; }
    #${P}-pillin { background: ${INK}; padding: 14px 30px; border-radius: 14px; border: 1.5px solid ${LINE}; max-width: 900px; text-align: center; }
    #${P}-title { font: 600 64px/1.05 "Geist", sans-serif; letter-spacing: -0.03em; color: ${PAPER}; margin: 0; }`;
    html.push(top.html);
    html.push(`<div id="${P}-lower">${bot.html}</div>`);
    if (s.labels?.[0]) html.push(`<div class="${P}-chip" style="top:260px;background:${PAPER}">${esc(s.labels[0])}</div>`);
    if (s.labels?.[1]) html.push(`<div class="${P}-chip" id="${P}-chip2" style="top:1240px;background:${accent}">${esc(s.labels[1])}</div>`);
    html.push(`<div id="${P}-rule"></div>`);
    if (s.title) html.push(`<div id="${P}-pill"><div id="${P}-pillin"><h1 id="${P}-title">${words(s.title, `${P}-w`, accent)}</h1></div></div>`);
    js.push(top.js, bot.js);
    if (top.three || bot.three) three = { type: "turntables", items: [...(top.three?.items ?? []), ...(bot.three?.items ?? [])] };
    js.push(`tl.fromTo("#${P}-lower", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.55, ease: "power3.inOut" }, ${r3(s.cutIn + 0.13)});`);
    js.push(`tl.fromTo("#${P}-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: "power3.inOut" }, ${r3(s.cutIn + 0.13)});`);
    if (s.labels?.[1]) js.push(`tl.fromTo("#${P}-chip2", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, ${r3(s.cutIn + 0.5)});`);
    if (s.title) js.push(`tl.fromTo("#${P}-pillin", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, ${r3(at)});`, wordsJs(`.${P}-w`, at + 0.05, 0.167));
  }

  if (s.type === "grid") {
    const items = s.items ?? [];
    const n = items.length;
    const cols = n <= 4 ? 2 : n <= 12 ? 3 : 4;
    const rows = Math.ceil(n / cols);
    const y0 = 580, y1 = 1240;
    const rowH = (y1 - y0) / rows, colW = 900 / cols;
    const size = Math.min(rowH * 1.15, colW * 0.72, 380);
    const cells = items.map((m, i) => ({ x: Math.round(90 + colW * ((i % cols) + 0.5)), y: Math.round(y0 + rowH * (Math.floor(i / cols) + 0.5)), m }));
    for (const c of cells) ctx.assets.add(c.m.src);
    three = { type: "turntables", items: cells.map((c, i) => ({ src: c.m.src, x: c.x, y: c.y, size, color: c.m.color, delay: s.cutIn + 0.18 + i * 0.045 })) };
    css += `
    .${P}-sh { position: absolute; width: ${Math.round(size * 0.95)}px; height: ${Math.round(size * 0.17)}px; border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 70%); }`;
    html.push(`<div data-layout-ignore>${cells.map((c) => `<div class="${P}-sh" style="left:${Math.round(c.x - size * 0.475)}px;top:${Math.round(c.y + size * 0.31)}px"></div>`).join("")}</div>`);
    js.push(`tl.fromTo(".${P}-sh", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out", stagger: 0.05 }, ${r3(s.cutIn + 0.2)});`);
    const c = copyBlock(P, { title: s.title, sub: s.sub }, accent, at + 0.1, {});
    html.push(c.html);
    js.push(c.js);
    if (s.caption) {
      html.push(`<p id="${P}-cap" style="top:1262px">${esc(s.caption)}</p>`);
      js.push(lineJs(`#${P}-cap`, at + 0.2));
    }
  }

  if (s.type === "tip") {
    if (s.media) {
      const ml = mediaLayer(P, "m", s.media, dur, ctx, { dim: 0.78, fill: true });
      css += ml.css;
      html.push(ml.html);
      js.push(ml.js);
    } else {
      three = { type: "object", kind: kind3d, y: 1230, size: 520 };
      if (s.prop) {
        const name = EMOJI[kind3d];
        ctx.assets.add(`emoji/${name}.png`); // copied to assets/emoji/
        css += `
    #${P}-prop { position: absolute; left: 805px; top: 925px; width: 150px; height: 150px; filter: drop-shadow(0 16px 20px rgba(0,0,0,0.45)); }`;
        html.push(`<img id="${P}-prop" src="assets/emoji/${name}.png" alt="" />`);
        js.push(`tl.fromTo("#${P}-prop", { opacity: 0, scale: 0.85, y: 12, rotation: -6 }, { opacity: 1, scale: 1, y: -12, rotation: 6, duration: 0.5, ease: "expo.out" }, ${r3(s.cutIn + 0.3)});`);
        js.push(`tl.to("#${P}-prop", { y: 10, rotation: -4, duration: ${r3(Math.max(0.3, dur - s.cutIn - 0.8))}, ease: "sine.inOut" }, ${r3(s.cutIn + 0.8)});`);
      }
    }
    css += `
    #${P}-copy { top: 440px; }
    #${P}-body { margin: 36px 0 0; font: 400 44px/1.35 "Geist", sans-serif; color: ${DIM}; max-width: 860px; }`;
    const size = plain(s.title).length > 36 ? 84 : 100;
    html.push(`<div id="${P}-copy">${s.title ? `<h1 id="${P}-title" style="font-size:${size}px">${words(s.title, `${P}-w`, accent)}</h1>` : ""}${s.body ? `<p id="${P}-body">${esc(s.body)}</p>` : ""}</div>`);
    if (s.title) js.push(wordsJs(`.${P}-w`, at + 0.08, 0.167));
    const nWords = plain(s.title).split(/\s+/).filter(Boolean).length;
    if (s.body) js.push(lineJs(`#${P}-body`, at + 0.167 * nWords + 0.2));
  }

  if (s.type === "end") {
    // The mark draws itself on, the wordmark joins it, then it holds. Nothing else: the
    // caption carries the ask.
    css += `
    #${P}-mark { position: absolute; left: 380px; top: 560px; width: 320px; height: 320px; }
    #${P}-word { position: absolute; left: 0; right: 0; top: 930px; text-align: center;
      font: 600 104px/1 "Geist", sans-serif; letter-spacing: -0.035em; color: ${PAPER}; margin: 0; }
    #${P}-word .${P}-dim { color: ${DIM}; font-weight: 400; }`;
    const [first, ...rest] = String(r.brand ?? "Kojo Labs").split(" ");
    html.push(`<svg id="${P}-mark" viewBox="0 0 100 100" fill="none" stroke-linecap="square">
        <circle id="${P}-ring" cx="50" cy="50" r="46" stroke="${PAPER}" stroke-width="3" opacity="0.35" stroke-dasharray="289.03" />
        <path id="${P}-stem" d="M35 26 V74" stroke="${PAPER}" stroke-width="6" stroke-dasharray="48" />
        <path id="${P}-arm1" d="M47 50 L67 26" stroke="${PAPER}" stroke-width="6" stroke-dasharray="31.3" />
        <path id="${P}-arm2" d="M47 50 L67 74" stroke="${PAPER}" stroke-width="6" stroke-dasharray="31.3" />
        <circle id="${P}-dot" cx="47" cy="50" r="6.9" fill="${accent}" />
      </svg>
      <h1 id="${P}-word"><span class="${P}-w">${esc(first)}</span>${rest.length ? ` <span class="${P}-w ${P}-dim">${esc(rest.join(" "))}</span>` : ""}</h1>`);
    const t = s.cutIn;
    js.push(`tl.fromTo("#${P}-ring", { strokeDashoffset: 289.03, rotation: -90, transformOrigin: "50% 50%" }, { strokeDashoffset: 0, rotation: 0, duration: 0.6, ease: "power3.out" }, ${r3(t)});
    tl.fromTo("#${P}-stem", { strokeDashoffset: 48 }, { strokeDashoffset: 0, duration: 0.3, ease: "power3.out" }, ${r3(t + 0.08)});
    tl.fromTo("#${P}-arm1, #${P}-arm2", { strokeDashoffset: 31.3 }, { strokeDashoffset: 0, duration: 0.28, ease: "power3.out", stagger: 0.05 }, ${r3(t + 0.2)});
    tl.fromTo("#${P}-dot", { opacity: 0, scale: 1.8, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "expo.out" }, ${r3(t + 0.36)});`);
    js.push(wordsJs(`.${P}-w`, t + 0.3, 0.167));
  }

  return { css, html: html.filter(Boolean).join("\n      "), js: js.filter(Boolean).join("\n    "), three, extra };
}

// ---- Transitions, each with a cause, written into the scenes' own timelines ---------------
function enterJs(s, P) {
  switch (s.inSeam) {
    case "whip":
      return `tl.fromTo("#${P}-cam", { x: 1080, filter: "blur(14px)" }, { x: 0, filter: "blur(0px)", duration: ${r3(2 * H)}, ease: "power3.out" }, 0);`;
    case "blurswap":
      return `tl.fromTo("#${P}-cam", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: ${r3(2 * H)}, ease: "power2.out" }, 0);`;
    case "zoomthrough":
      return `tl.fromTo("#${P}-cam", { opacity: 0, scale: 1.18, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "expo.out" }, 0.05);`;
    case "iris":
      return `tl.fromTo("#${P}-cam", { clipPath: "circle(0% at 540px 900px)" }, { clipPath: "circle(130% at 540px 900px)", duration: 0.42, ease: "power3.inOut" }, 0);`;
    case "dip":
      return `tl.fromTo("#${P}-cam", { opacity: 0 }, { opacity: 1, duration: ${r3(2 * H)}, ease: "power2.out" }, 0);`;
    default:
      return "";
  }
}
function exitJs(s, P) {
  const t0 = r3(s.cutOut - H);
  switch (s.outSeam) {
    case "whip":
      return `tl.to("#${P}-cam", { x: -1080, filter: "blur(14px)", duration: ${r3(2 * H)}, ease: "power3.in" }, ${t0});`;
    case "blurswap":
      return `tl.to("#${P}-fg", { opacity: 0, filter: "blur(10px)", duration: 0.2, ease: "power2.in" }, ${r3(t0 + 0.05)});`;
    case "zoomthrough":
      return `tl.to("#${P}-cam", { scale: 1.5, opacity: 0, filter: "blur(12px)", duration: ${r3(2 * H)}, ease: "power3.in" }, ${t0});`;
    case "iris":
      return `tl.to("#${P}-cam", { scale: 1.25, duration: 0.45, ease: "power2.in" }, ${r3(Math.max(0, s.cutOut - 0.45))});`;
    case "dip":
      return `tl.to("#${P}-cam", { opacity: 0, filter: "blur(8px)", duration: ${r3(2 * H)}, ease: "power2.in" }, ${t0});`;
    default:
      return "";
  }
}

// The light leak over the first cut (the song's first downbeat), in the Reel's accent.
function leakScene(accent) {
  return `<template>
  <style>
    #root { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; }
    .leak-blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0; }
    #leak-a { left: -500px; top: 300px; width: 1300px; height: 1300px;
      background: radial-gradient(circle, #ffffff 0%, color-mix(in srgb, ${accent} 55%, white) 25%, ${accent} 45%, rgba(0,0,0,0) 70%); }
    #leak-b { left: -300px; top: 700px; width: 900px; height: 900px;
      background: radial-gradient(circle, #ffffff 0%, color-mix(in srgb, ${accent} 30%, white) 30%, rgba(0,0,0,0) 70%); }
  </style>
  <div id="root" data-composition-id="leak" data-width="1080" data-height="1920" data-layout-ignore>
    <div id="leak-a" class="leak-blob"></div>
    <div id="leak-b" class="leak-blob"></div>
  </div>
  <script>
    (function () {
    var tl = gsap.timeline({ paused: true });
    tl.fromTo("#leak-a", { x: -200, opacity: 0 }, { x: 900, opacity: 1, duration: 0.42, ease: "power2.in" }, 0);
    tl.to("#leak-a", { x: 1500, opacity: 0, duration: 0.28, ease: "power2.out" }, 0.42);
    tl.fromTo("#leak-b", { x: -100, opacity: 0 }, { x: 700, opacity: 0.9, duration: 0.36, ease: "power3.in" }, 0.06);
    tl.to("#leak-b", { x: 1300, opacity: 0, duration: 0.28, ease: "power2.out" }, 0.42);
    tl.set({}, {}, 0.7);
    window.__timelines = window.__timelines || {};
    window.__timelines["leak"] = tl;
    })();
  </script>
</template>
`;
}

function sceneFile(s, P, r, ctx) {
  const p = sceneParts(s, P, r, ctx);
  const has3d = !!p.three;
  const threeJs = !has3d
    ? ""
    : p.three.type === "turntables"
      ? `Kojo3D.turntables(document.getElementById("${P}-canvas"), ${JSON.stringify(p.three.items)}, "${r.accent}")`
      : `Promise.resolve(Kojo3D.object(document.getElementById("${P}-canvas"), "${p.three.kind}", "${r.accent}", ${JSON.stringify({ y: p.three.y, size: p.three.size })}))`;
  const clocked = has3d || p.extra.length;
  return `<template>
  <style>${FONT_FACE}
    #root { position: absolute; inset: 0; overflow: hidden; background: transparent; }
    #${P}-cam { position: absolute; inset: 0; transform-origin: 50% 50%; }
    #${P}-fg { position: absolute; inset: 0; }
    #${P}-canvas { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
${p.css}
  </style>
  <div id="root" data-composition-id="${P}" data-width="1080" data-height="1920">
    <div id="${P}-cam">
      ${backdropHtml(P)}
      <div id="${P}-fg">
      ${has3d ? `<canvas id="${P}-canvas" width="1080" height="1920" data-layout-ignore></canvas>` : ""}
      ${p.html}
      </div>
    </div>
  </div>
  <script>
    (function () {
    var tl = gsap.timeline({ paused: true });
    ${p.js}
    ${enterJs(s, P)}
    ${exitJs(s, P)}
    ${
      clocked
        ? `var clock = { t: 0 }, stage = null;
    var drawers = [${p.extra.join(",\n")}];
    var draw = function () { for (var i = 0; i < drawers.length; i++) drawers[i](clock.t); if (stage) stage.draw(clock.t); };
    tl.to(clock, { t: ${s.d}, duration: ${s.d}, ease: "none", onUpdate: draw }, 0);
    draw();
    window.addEventListener("hf-seek", draw);${
      has3d
        ? `
    window.__hf = window.__hf || {};
    window.__hf.buildReady = window.__hf.buildReady || {};
    window.__hf.buildReady["${P}-3d"] = ${threeJs}.then(function (st) { stage = st; draw(); });`
        : ""
    }`
        : ""
    }
    tl.set({}, {}, ${s.d});
    window.__timelines = window.__timelines || {};
    window.__timelines["${P}"] = tl;
    })();
  </script>
</template>
`;
}

// ---- The project ------------------------------------------------------------------------
export function writeProject(props, dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "compositions"), { recursive: true });
  mkdirSync(join(dir, "assets", "lib"), { recursive: true });
  mkdirSync(join(dir, "assets", "fonts"), { recursive: true });

  const scenes = props.scenes;
  const n = scenes.length;
  // Seams: a light leak on the first cut, a dip into the end card, an iris into a grid, and
  // otherwise a rotation of whip / zoom-through / blur swap, so no two seams in a row match.
  const ROT = ["whip", "zoomthrough", "blurswap"];
  let k = 0;
  const seams = [];
  for (let i = 0; i < n - 1; i++) {
    const next = scenes[i + 1];
    seams.push(i === 0 ? "leak" : next.type === "end" ? "dip" : next.type === "grid" ? "iris" : ROT[k++ % ROT.length]);
  }
  const cuts = [...scenes.map((s) => sec(s.from)), sec(props.total)];
  const ids = scenes.map((s, i) => `s${i}-${s.type}`);
  const S = scenes.map((s, i) => {
    const inSeam = seams[i - 1], outSeam = seams[i];
    const pre = i === 0 || inSeam === "leak" ? 0 : H;
    const post = i === n - 1 || outSeam === "leak" ? 0 : H;
    const start = r3(cuts[i] - pre);
    const d = r3(cuts[i + 1] + post - start);
    return { ...s, start, d, cutIn: r3(pre), cutOut: r3(d - post), inSeam, outSeam };
  });

  // A studio Reel spans projects: each scene wears the colour of the project it shows.
  if (/studio/i.test(props.project.kind ?? "")) {
    const all = projects();
    for (const s of S) {
      if (s.type === "hook" || s.type === "end") continue;
      const src = s.media?.src ?? s.items?.[0]?.src ?? "";
      const pid = /^assets\/([^/]+)\//.exec(src)?.[1];
      if (pid && all[pid]?.accent) s.accent = all[pid].accent;
    }
  }
  const ctx = { assets: new Set() };
  S.forEach((s, i) => writeFileSync(join(dir, "compositions", `${ids[i]}.html`), sceneFile(s, ids[i], props, ctx)));
  writeFileSync(join(dir, "compositions", "leak.html"), leakScene(props.accent));

  // Media, fonts and libraries: copied in, so the render needs no network.
  for (const src of ctx.assets) {
    const from = join(ROOT, "public", src);
    if (!existsSync(from)) throw new Error(`missing public/${src}: run npm run sync`);
    const to = join(dir, src.startsWith("assets/") ? src : `assets/${src}`);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
  for (const f of ["Geist.woff2", "GeistMono.woff2"]) copyFileSync(join(ROOT, "public/fonts", f), join(dir, "assets/fonts", f));
  copyFileSync(join(ROOT, "node_modules/gsap/dist/gsap.min.js"), join(dir, "assets/lib/gsap.min.js"));
  run("npx", ["esbuild", "scripts/hf/kojo3d.src.js", "--bundle", "--minify", "--format=iife", `--outfile=${join(dir, "assets/lib/kojo3d.min.js")}`, "--log-level=error"]);

  const total = sec(props.total);
  const hosts = S.map(
    (s, i) => `      <div id="${ids[i]}" data-composition-id="${ids[i]}" data-composition-src="compositions/${ids[i]}.html"
        data-start="${s.start}" data-duration="${s.d}" data-track-index="${i + 1}" data-track-kind="graphics"
        data-width="1080" data-height="1920" style="z-index:${i + 1}"></div>`,
  ).join("\n");
  writeFileSync(
    join(dir, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/lib/gsap.min.js"></script>
    <script src="assets/lib/kojo3d.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: ${INK}; }
      #ground { position: absolute; inset: 0; background: ${INK}; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1080" data-height="1920">
      <div id="ground"></div>
${hosts}
      <div id="leak" data-composition-id="leak" data-composition-src="compositions/leak.html"
        data-start="${r3(cuts[1] - 0.3)}" data-duration="0.7" data-track-index="${n + 1}" data-track-kind="graphics"
        data-width="1080" data-height="1920" style="z-index:${n + 10}"></div>
    </div>
    <script>
      var tl = gsap.timeline({ paused: true });
      tl.set({}, {}, ${total});
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`,
  );
  writeFileSync(join(dir, "hyperframes.json"), JSON.stringify({ paths: { blocks: "compositions", components: "compositions/components", assets: "assets" }, media: { autoProxy: true } }, null, 2));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: "reel", name: "reel" }, null, 2));
  return { scenes: S.map((s, i) => ({ id: ids[i], start: s.start, dur: s.d, in: s.inSeam ?? "", out: s.outSeam ?? "" })), total };
}

// HyperFrames needs a Chromium; renderEnv() in lib.mjs finds the sandbox's headless shell.
export function renderProject(dir, file, env) {
  const e = { ...env };
  if (!e.HYPERFRAMES_BROWSER_PATH && e.REMOTION_BROWSER) e.HYPERFRAMES_BROWSER_PATH = e.REMOTION_BROWSER;
  run("npx", ["--yes", HF, "render", "--quality", "delivery", "-o", file], { cwd: dir, env: e, timeout: 3600000 });
}

export function checkProject(dir, env) {
  const e = { ...env };
  if (!e.HYPERFRAMES_BROWSER_PATH && e.REMOTION_BROWSER) e.HYPERFRAMES_BROWSER_PATH = e.REMOTION_BROWSER;
  const r = spawnSync("npx", ["--yes", HF, "check", "--json"], { cwd: dir, env: e, encoding: "utf8", maxBuffer: 1 << 28, timeout: 1800000 });
  return JSON.parse(r.stdout || "{}");
}

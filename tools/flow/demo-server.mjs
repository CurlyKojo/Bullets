// A stand-in backend for capturing {flow} footage. The UI is the real client (built from
// the flow-v2 repo, untouched); this server answers its API with the same response shapes
// as the real server, but the AI text is scripted (script.json) instead of coming from
// Anthropic, because the sandbox has no key. Character counts are measured from the text,
// so the line meter, the strength checklist and "perfect fit" are the app's real logic.
//
//   node tools/flow/demo-server.mjs <flow-v2>/client/dist [port]
//
// Responses to /api/generate and /api/refine are held until GET /demo/release, so a
// capture can film the "charging" state for as long as it wants.
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const DIST = process.argv[2];
const PORT = Number(process.argv[3] ?? 4180);
if (!DIST || !existsSync(join(DIST, "index.html"))) throw new Error("usage: demo-server.mjs <client/dist> [port]");
const HERE = new URL(".", import.meta.url).pathname;
const SCRIPT = JSON.parse(readFileSync(join(HERE, "script.json"), "utf8"));
const FONTS = join(HERE, "../../.cache/flow-fonts");

// The app's Google Fonts, fetched once and served locally (the capture browser has no proxy).
const FONT_CSS = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap";
function fonts() {
  if (existsSync(join(FONTS, "fonts.css"))) return;
  mkdirSync(FONTS, { recursive: true });
  const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
  const css = spawnSync("curl", ["-sSfL", "-A", ua, FONT_CSS], { encoding: "utf8" }).stdout;
  if (!css) throw new Error("could not fetch the Google Fonts CSS");
  let i = 0;
  const local = css.replace(/url\((https:[^)]+)\)/g, (_, url) => {
    const name = `f${i++}.woff2`;
    spawnSync("curl", ["-sSfL", "-o", join(FONTS, name), url]);
    return `url(/demo-fonts/${name})`;
  });
  writeFileSync(join(FONTS, "fonts.css"), local);
}
fonts();

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".mp4": "video/mp4", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const balance = { tokenLimit: 50000, tokensUsed: 1790 };
const bal = () => ({ ...balance, tokensRemaining: balance.tokenLimit - balance.tokensUsed });
const spend = (n) => ((balance.tokensUsed += n), { tokensUsed: n, tokensRemaining: bal().tokensRemaining });
const library = SCRIPT.library.map((t, i) => ({ id: `s${i}`, text: t.text, chars: t.text.length, category: t.category, created_at: "2026-11-01T18:00:00Z" }));
let held = [];
const hold = (fn) => new Promise((res) => held.push(() => res(fn())));
const withChars = (b) => ({ ...b, chars: b.text.length });

async function api(req, body) {
  const u = new URL(req.url, "http://x");
  const p = u.pathname;
  if (p === "/demo/release") {
    const n = held.length;
    held.splice(0).forEach((f) => f());
    return { released: n };
  }
  if (p === "/api/health") return { ok: true, model: "claude-sonnet-5-5", keyConfigured: true, data: "supabase" };
  if (p === "/auth/login") return { token: "demo", username: SCRIPT.username, isAdmin: false, ...bal() };
  if (p === "/me") return { username: SCRIPT.username, isAdmin: false, ...bal() };
  if (p === "/api/generate") return hold(() => ({ bullets: SCRIPT.generate.map(withChars), meta: spend(2412) }));
  if (p === "/api/refine") {
    const pick = SCRIPT.refine.find((r) => r.action === body.action && body.bullet.startsWith(r.from.slice(0, 40)));
    const text = pick?.text ?? body.bullet;
    return hold(() => ({ text, chars: text.length, meta: spend(611) }));
  }
  if (p === "/api/bullets" && req.method === "GET") return library;
  if (p === "/api/bullets" && req.method === "POST") {
    const row = { id: `n${library.length}`, text: body.text, chars: body.text.length, category: body.category, created_at: "2026-11-05T18:00:00Z" };
    library.unshift(row);
    return row;
  }
  if (p.startsWith("/api/bullets/") && req.method === "DELETE") return { ok: true };
  return null;
}

createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  if (path.startsWith("/api/") || path.startsWith("/auth/") || path === "/me" || path.startsWith("/demo/")) {
    let raw = "";
    for await (const c of req) raw += c;
    const out = await api(req, raw ? JSON.parse(raw) : {});
    res.writeHead(out === null ? 404 : 200, { "content-type": "application/json" });
    return res.end(JSON.stringify(out ?? { error: "not in the demo" }));
  }
  if (path.startsWith("/demo-fonts/")) {
    res.writeHead(200, { "content-type": "font/woff2" });
    return res.end(readFileSync(join(FONTS, path.slice(12))));
  }
  if (path === "/demo-fonts.css") {
    res.writeHead(200, { "content-type": "text/css" });
    return res.end(readFileSync(join(FONTS, "fonts.css")));
  }
  const file = join(DIST, path === "/" ? "index.html" : path);
  if (!file.startsWith(DIST) || !existsSync(file) || path === "/") {
    // The page itself: same HTML, with the Google Fonts link pointed at the local copy.
    const html = readFileSync(join(DIST, "index.html"), "utf8").replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/, "/demo-fonts.css");
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(html);
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(PORT, "127.0.0.1", () => console.log(`{flow} demo on http://127.0.0.1:${PORT}`));

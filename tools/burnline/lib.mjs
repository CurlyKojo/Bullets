// Deterministic capture of the running site: Chrome's headless shell with virtual time
// and BeginFrame control, so each frame is exactly 1/30 s of app time however long the
// software renderer takes to draw it. Frames land in public/footage/<scene>/NNNN.png at
// 1080x1920 (a 540x960 phone at 2x; the flag below is what makes BeginFrame screenshots
// come out at 2x, the metrics override alone leaves them at 540x960).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";

// Copied from Burnline's video/capture/lib.mjs (our own project), with the headless shell
// found automatically and frames written under .cache/footage/ in this repo.
const SHELL = process.env.SHELL_PATH ?? (() => {
  for (const d of readdirSync("/opt/pw-browsers").filter((d) => d.startsWith("chromium_headless_shell")).sort().reverse()) {
    for (const p of ["chrome-headless-shell-linux64/chrome-headless-shell", "chrome-linux/headless_shell"]) if (existsSync(`/opt/pw-browsers/${d}/${p}`)) return `/opt/pw-browsers/${d}/${p}`;
  }
  throw new Error("no headless shell in /opt/pw-browsers; set SHELL_PATH");
})();
export const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
export const OUT = new URL("../../.cache/footage/burnline/", import.meta.url).pathname;
export const FPS = 30;

export async function open() {
  const port = 9900 + Math.floor(Math.random() * 90);
  const chrome = spawn(SHELL, ["--no-sandbox", "--hide-scrollbars", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-begin-frame-control", "--run-all-compositor-stages-before-draw", "--disable-new-content-rendering-timeout", "--disable-threaded-animation", "--disable-threaded-scrolling", "--disable-checker-imaging", "--window-size=540,960", "--force-device-scale-factor=2", `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let wsUrl;
  for (let i = 0; i < 50 && !wsUrl; i++) {
    await sleep(200);
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; } catch {}
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const waiters = [];
  const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push((m.params.exceptionDetails.exception?.description ?? "").slice(0, 160));
    if (m.method) for (const w of waiters.splice(0)) { if (w.method === m.method) w.res(m.params); else waiters.push(w); }
  };
  const { result: { targetId } } = await rpc("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId } } = await rpc("Target.attachToTarget", { targetId, flatten: true });
  function rpc(method, params = {}, sid) { return new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId: sid })); }); }
  const send = (method, params) => rpc(method, params, sessionId);
  const once = (method) => new Promise((res) => waiters.push({ method, res }));
  await send("Page.enable"); await send("Runtime.enable"); await send("HeadlessExperimental.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 540, height: 960, deviceScaleFactor: 2, mobile: true });
  const T0 = Date.now();
  const log = (s) => console.log(`[${((Date.now() - T0) / 1000).toFixed(0)}s] ${s}`);
  const ev = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error("evaluate: " + (r.result.exceptionDetails.exception?.description ?? "").slice(0, 200));
    return r.result?.result?.value;
  };
  const p = {
    log, errors,
    /// Navigate and wait for the app's status line, then let textures and labels settle.
    async load(path, ready = `/objects|Planned|T\\+/.test(document.querySelector('.gstatus')?.textContent ?? '')`, settleMs = 4000) {
      await send("Page.navigate", { url: BASE + path });
      for (let i = 0; i < 300; i++) { if (await ev(ready)) break; await sleep(300); }
      await sleep(settleMs);
      log(`loaded ${path}`);
    },
    /// Freeze app time; from here only `tick`/`capture` move it.
    async pause() { await send("Emulation.setVirtualTimePolicy", { policy: "pause" }); },
    /// Advance app time by n frames without saving.
    async tick(n = 1) { for (let i = 0; i < n; i++) await p.frame(); },
    async frame() {
      const expired = once("Emulation.virtualTimeBudgetExpired");
      await send("Emulation.setVirtualTimePolicy", { policy: "advance", budget: 1000 / FPS });
      await expired;
      return send("HeadlessExperimental.beginFrame", { interval: 1000 / FPS, noDisplayUpdates: false, screenshot: { format: "png" } });
    },
    /// Save n frames to public/footage/<name>. `onFrame(f)` runs before frame f, for a
    /// scene that scrolls, types or drags while it records.
    async capture(name, n, onFrame) {
      const dir = OUT + name;
      mkdirSync(dir, { recursive: true });
      const t = Date.now();
      for (let f = 0; f < n; f++) {
        if (onFrame) await onFrame(f);
        const r = await p.frame();
        if (!r.result?.screenshotData) throw new Error(`no screenshot at ${name} ${f}: ${JSON.stringify(r.error ?? r.result)}`);
        writeFileSync(`${dir}/${String(f).padStart(4, "0")}.png`, Buffer.from(r.result.screenshotData, "base64"));
        if (f % 30 === 29) log(`${name} ${f + 1}/${n} (${((Date.now() - t) / (f + 1) / 1000).toFixed(2)} s/frame)`);
      }
      log(`${name} done: ${n} frames`);
    },
    /// Click the first element matching `sel` whose text includes `text` (page-side, so a
    /// hidden element, e.g. under full screen, still takes it).
    async click(sel, text = "") {
      await ev(`(() => { const els = [...document.querySelectorAll(${JSON.stringify(sel)})]; const el = ${JSON.stringify(text)} ? els.find((e) => e.textContent.includes(${JSON.stringify(text)})) : els[0]; if (!el) throw new Error("no element " + ${JSON.stringify(sel + " " + text)}); el.click(); })()`);
    },
    /// Enter the app's full-screen mode and hide its exit button, for clean footage.
    async full() {
      await p.click(".gfull");
      await ev(`(() => { const st = document.createElement("style"); st.textContent = ".gfull-exit{display:none !important}"; document.head.appendChild(st); })()`);
      await p.tick(2);
    },
    /// A wheel step on the view (zoom in the 3D scene), at CSS-pixel x, y.
    async wheel(x, y, deltaY) {
      await send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY });
    },
    /// Scroll by `dy` CSS px (page-side; wheel events never resolve here): the element
    /// matching `sel` if it scrolls, else the first scrollable thing inside it or above it.
    async scroll(sel, dy) {
      await ev(`(() => {
        const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error("no element " + ${JSON.stringify(sel)});
        const can = (e) => e && e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY);
        let t = can(el) ? el : [...el.querySelectorAll("*")].find(can);
        for (let a = el.parentElement; !t && a; a = a.parentElement) if (can(a)) t = a;
        (t ?? document.scrollingElement).scrollTop += ${dy};
      })()`);
    },
    /// Set a React-controlled <select>.
    async select(sel, value) {
      await ev(`(() => { const s = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(s, ${JSON.stringify(value)}); s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    },
    /// Type into a React-controlled <input> (the catalog search), as one change.
    async type(sel, value) {
      await ev(`(() => { const s = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(s, ${JSON.stringify(value)}); s.dispatchEvent(new Event("input", { bubbles: true })); })()`);
    },
    ev,
    async close() { ws.close(); chrome.kill(); },
  };
  return p;
}

export async function run(scene) {
  const p = await open();
  try {
    await scene(p);
  } catch (e) {
    p.log("FAIL " + String(e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    if (p.errors.length) p.log("page errors: " + p.errors.slice(0, 3).join(" | "));
    await p.close();
  }
}

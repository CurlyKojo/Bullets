// Shared helpers for the studio scripts.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

export const projects = () =>
  Object.fromEntries(
    readdirSync(join(ROOT, "projects"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const p = readJson(`projects/${f}`);
        return [p.id, p];
      }),
  );

// Remotion needs a Chromium. The cloud sandbox has Playwright's headless shell
// preinstalled; anywhere else Remotion downloads its own.
export const renderEnv = () => {
  const env = { ...process.env };
  if (!env.REMOTION_BROWSER && existsSync("/opt/pw-browsers")) {
    for (const d of readdirSync("/opt/pw-browsers").filter((d) => d.startsWith("chromium_headless_shell")).sort().reverse()) {
      const shell = join("/opt/pw-browsers", d, "chrome-headless-shell-linux64", "chrome-headless-shell");
      if (existsSync(shell)) {
        env.REMOTION_BROWSER = shell;
        break;
      }
    }
  }
  return env;
};

export const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28, ...opts });
  if (r.status !== 0) {
    const tail = `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim().split("\n").slice(-25).join("\n");
    throw new Error(`${cmd} ${args.slice(0, 4).join(" ")} failed (exit ${r.status})\n${tail}`);
  }
  return (r.stdout ?? "").trim();
};

export const arg = (name, fallback = undefined) => {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};

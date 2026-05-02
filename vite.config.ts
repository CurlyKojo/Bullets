import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type ApiHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

const ROUTES: Array<{ path: string; file: string }> = [
  { path: "/api/auth/login", file: "api/auth/login.ts" },
  { path: "/api/auth/callback", file: "api/auth/callback.ts" },
  { path: "/api/auth/me", file: "api/auth/me.ts" },
  { path: "/api/auth/logout", file: "api/auth/logout.ts" },
  { path: "/api/generate", file: "api/generate.ts" },
];

function apiDevServer(): Plugin {
  return {
    name: "bullets-api-dev",
    configureServer(server) {
      for (const route of ROUTES) {
        server.middlewares.use(route.path, (req, res, next) => {
          server
            .ssrLoadModule(path.resolve(process.cwd(), route.file))
            .then((mod) => (mod.default as ApiHandler)(req, res))
            .catch(next);
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of [
    "ANTHROPIC_API_KEY",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "SESSION_SECRET",
    "ALLOWED_USERS",
    "BASE_URL",
    "DAILY_LIMIT",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ]) {
    if (env[key]) process.env[key] = env[key];
  }
  return {
    plugins: [react(), apiDevServer()],
    server: { port: 5173 },
  };
});

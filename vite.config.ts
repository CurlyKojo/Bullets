import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type ApiHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

function apiDevServer(): Plugin {
  return {
    name: "bullets-api-dev",
    configureServer(server) {
      server.middlewares.use("/api/generate", (req, res, next) => {
        server
          .ssrLoadModule(path.resolve(process.cwd(), "api/generate.ts"))
          .then((mod) => (mod.default as ApiHandler)(req, res))
          .catch(next);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  }
  return {
    plugins: [react(), apiDevServer()],
    server: { port: 5173 },
  };
});

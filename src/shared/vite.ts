/**
 * Singleton Vite development server management
 * 
 * Maintains a single Vite server instance that can be reused across
 * multiple test runs to avoid startup overhead.
 */

import type { ViteDevServer } from "vite";
import { REACT_ENV_ROOT } from "./constants.js";

// Singleton state
let viteServer: ViteDevServer | null = null;
let viteServerPort = 5173;

export async function getOrStartViteServer(): Promise<{ server: ViteDevServer; url: string }> {
  if (viteServer) {
    return { server: viteServer, url: `http://localhost:${viteServerPort}` };
  }

  // Dynamically import vite to avoid issues if not installed
  const { createServer } = await import("vite");
  
  viteServer = await createServer({
    root: REACT_ENV_ROOT,
    server: {
      port: viteServerPort,
      strictPort: false, // Allow using different port if 5173 is taken
    },
    logLevel: "error", // Reduce noise in logs
  });

  await viteServer.listen();
  viteServerPort = viteServer.config.server.port!;
  
  const url = `http://localhost:${viteServerPort}`;
  console.error(`[mcp-tutor] Vite dev server started at ${url}`);
  
  return { server: viteServer, url };
}

export async function stopViteServer(): Promise<void> {
  if (viteServer) {
    await viteServer.close();
    viteServer = null;
    console.error("[mcp-tutor] Vite dev server stopped");
  }
}

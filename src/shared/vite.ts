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

/**
 * Check if the external Vite dev server is running on port 5174
 * (This is separate from the programmatic server above)
 */
export async function checkExternalViteServer(): Promise<{ 
  running: boolean; 
  port?: number;
  message: string;
}> {
  // Try port 5174 first (most common)
  const ports = [5174, 5173, 5175, 5176];
  
  for (const port of ports) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`http://localhost:${port}`, {
        signal: controller.signal,
        headers: { 'Accept': 'text/html' }
      });
      
      clearTimeout(timeoutId);
      
      // Vite server should respond with HTML or at least respond successfully
      if (response.ok || response.status === 404 || response.status === 304) {
        return {
          running: true,
          port,
          message: `✅ Vite dev server is running on http://localhost:${port}`
        };
      }
    } catch (error: any) {
      // If aborted due to timeout or connection refused, try next port
      continue;
    }
  }
  
  return {
    running: false,
    message: '⚠️ Vite dev server is not running.\n\nTo start it, run:\n  cd environments/react/template\n  npm run dev\n\nOr the server will start automatically when you visit http://localhost:5174 in your browser.'
  };
}

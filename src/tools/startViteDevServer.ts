import { spawn } from "child_process";
import net from "node:net";

/**
 * Starts the Vite dev server for React exercises on port 5174.
 * Usage: Registered as an MCP tool for reliably starting the correct dev server.
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" });
    socket.on("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

export async function startViteDevServer(port: number = 5174): Promise<{ content: { type: "text"; text: string }[] }> {
  if (await isPortInUse(port)) {
    return {
      content: [{ type: "text", text: `✅ Vite dev server already running on http://localhost:${port}` }],
    };
  }

  try {
    const child = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
      cwd: "environments/react/template",
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    return {
      content: [{ type: "text", text: `✅ Vite dev server starting on http://localhost:${port}` }],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text", text: `❌ Failed to start Vite dev server: ${err?.message || String(err)}` }],
    };
  }
}

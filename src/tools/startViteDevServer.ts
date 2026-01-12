import { exec } from "child_process";

/**
 * Starts the Vite dev server for React exercises on port 5174.
 * Usage: Registered as an MCP tool for reliably starting the correct dev server.
 */
export async function startViteDevServer(port: number = 5174): Promise<{ content: { type: "text"; text: string }[] }> {
  return new Promise((resolve) => {
    exec(
      `npm run dev -- --port ${port}`,
      { cwd: "environments/react/template" },
      (err, stdout, stderr) => {
        if (err) {
          resolve({
            content: [{ type: "text", text: `❌ Failed to start Vite dev server: ${stderr || err.message}` }],
          });
        } else {
          resolve({
            content: [{ type: "text", text: `✅ Vite dev server started on http://localhost:${port}\n${stdout}` }],
          });
        }
      }
    );
  });
}

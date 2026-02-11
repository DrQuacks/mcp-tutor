import { spawn } from "child_process";
import net from "node:net";
import fs from "node:fs/promises";
import path from "node:path";

const VITE_STATE_FILE = path.join(process.cwd(), "session_state_vite_server.json");

type ViteState = {
  port: number;
  pid?: number;
};

/**
 * Starts the Vite dev server for React exercises.
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

async function readViteState(): Promise<ViteState | null> {
  try {
    const raw = await fs.readFile(VITE_STATE_FILE, "utf8");
    const data = JSON.parse(raw);
    if (typeof data.port === "number") {
      return {
        port: data.port,
        pid: typeof data.pid === "number" ? data.pid : undefined,
      };
    }
  } catch {
    // Ignore missing or invalid state file
  }
  return null;
}

async function writeViteState(port: number, pid?: number): Promise<void> {
  try {
    await fs.writeFile(
      VITE_STATE_FILE,
      JSON.stringify({ port, pid }, null, 2),
      "utf8"
    );
  } catch {
    // Best-effort only; failures here shouldn't block starting the server
  }
}

async function clearViteState(): Promise<void> {
  try {
    await fs.unlink(VITE_STATE_FILE);
  } catch {
    // Ignore if file does not exist
  }
}

async function stopViteServerIfRunning(state: ViteState): Promise<boolean> {
  if (!state.pid) {
    return false;
  }

  try {
    process.kill(state.pid);
  } catch (err: any) {
    if (err && err.code === "ESRCH") {
      return false;
    }
    return false;
  }

  // Wait briefly for the process to release the port
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (!(await isPortInUse(state.port))) {
      await clearViteState();
      return true;
    }
  }

  return false;
}

export async function startViteDevServer(port?: number): Promise<{ content: { type: "text"; text: string }[] }> {
  const userRequestedPort = typeof port === "number" ? port : undefined;
  const messages: string[] = [];
  const savedState = await readViteState();

  // Case 1: user explicitly requested a port
  if (userRequestedPort !== undefined) {
    // If we previously started Vite on a different port, try to stop it
    if (savedState && savedState.port !== userRequestedPort) {
      if (await isPortInUse(savedState.port)) {
        const stopped = await stopViteServerIfRunning(savedState);
        if (stopped) {
          messages.push(
            `ℹ️ Stopped existing Vite dev server on http://localhost:${savedState.port}`
          );
        } else {
          messages.push(
            `⚠️ Detected a Vite dev server previously started on http://localhost:${savedState.port}, but could not confirm it was stopped.`
          );
        }
      } else {
        await clearViteState();
      }
    }

    // If the requested port is already in use, either reuse or fail
    if (await isPortInUse(userRequestedPort)) {
      if (savedState && savedState.port === userRequestedPort) {
        const prefix = messages.length ? messages.join("\n") + "\n" : "";
        return {
          content: [
            {
              type: "text",
              text:
                prefix +
                `✅ Vite dev server already running on http://localhost:${userRequestedPort}`,
            },
          ],
        };
      }

      const prefix = messages.length ? messages.join("\n") + "\n" : "";
      return {
        content: [
          {
            type: "text",
            text:
              prefix +
              `❌ Port ${userRequestedPort} is already in use by another process; cannot start Vite dev server there.`,
          },
        ],
      };
    }

    // Start a new Vite server on the requested port
    try {
      const child = spawn("npm", ["run", "dev", "--", "--port", String(userRequestedPort)], {
        cwd: "environments/react/template",
        detached: true,
        stdio: "ignore",
      });
      const pid = child.pid;
      child.unref();

      await writeViteState(userRequestedPort, pid);

      const prefix = messages.length ? messages.join("\n") + "\n" : "";
      return {
        content: [
          {
            type: "text",
            text:
              prefix +
              `✅ Vite dev server starting on http://localhost:${userRequestedPort}`,
          },
        ],
      };
    } catch (err: any) {
      const prefix = messages.length ? messages.join("\n") + "\n" : "";
      return {
        content: [
          {
            type: "text",
            text:
              prefix +
              `❌ Failed to start Vite dev server: ${err?.message || String(err)}`,
          },
        ],
      };
    }
  }

  // Case 2: no explicit port requested
  if (savedState && (await isPortInUse(savedState.port))) {
    return {
      content: [
        {
          type: "text",
          text: `✅ Vite dev server already running on http://localhost:${savedState.port}`,
        },
      ],
    };
  }

  // Saved state exists but port is no longer in use; clear stale state
  if (savedState) {
    await clearViteState();
  }

  const defaultPort = 5174;

  // Try default port next
  if (await isPortInUse(defaultPort)) {
    await writeViteState(defaultPort);
    return {
      content: [
        {
          type: "text",
          text: `✅ Vite dev server already running on http://localhost:${defaultPort}`,
        },
      ],
    };
  }

  // Finally, start a new server on the default port
  try {
    const child = spawn("npm", ["run", "dev", "--", "--port", String(defaultPort)], {
      cwd: "environments/react/template",
      detached: true,
      stdio: "ignore",
    });
    const pid = child.pid;
    child.unref();

    await writeViteState(defaultPort, pid);

    return {
      content: [
        {
          type: "text",
          text: `✅ Vite dev server starting on http://localhost:${defaultPort}`,
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to start Vite dev server: ${err?.message || String(err)}`,
        },
      ],
    };
  }
}

/**
 * Starts a dummy Express backend server for frontend exercises.
 *
 * Pattern is similar to the Vite dev server starter: we track the
 * last-known port and PID in the shared state file so we can
 * detect an already-running server and avoid starting duplicates.
 */

import { spawn } from "child_process";
import net from "node:net";
import fs from "node:fs/promises";
import path from "node:path";

const STATE_FILE = path.join(process.cwd(), "session_state_vite_server.json");

type ServerProcessState = {
  port: number;
  pid?: number;
};

type MultiServerState = {
  vite?: ServerProcessState;
  backend?: ServerProcessState;
};

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

async function readFullState(): Promise<MultiServerState | null> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    const data = JSON.parse(raw);
    if (typeof data === "object" && (data.vite || data.backend)) {
      const state: MultiServerState = {};
      if (data.vite && typeof data.vite.port === "number") {
        state.vite = {
          port: data.vite.port,
          pid: typeof data.vite.pid === "number" ? data.vite.pid : undefined,
        };
      }
      if (data.backend && typeof data.backend.port === "number") {
        state.backend = {
          port: data.backend.port,
          pid: typeof data.backend.pid === "number" ? data.backend.pid : undefined,
        };
      }
      return state;
    }
    // Backwards-compatible: if file was created by older Vite-only code,
    // treat it as Vite state and no backend entry.
    if (typeof data.port === "number") {
      return {
        vite: {
          port: data.port,
          pid: typeof data.pid === "number" ? data.pid : undefined,
        },
      };
    }
  } catch {
    // Ignore missing or invalid file
  }
  return null;
}

async function writeFullState(state: MultiServerState): Promise<void> {
  try {
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Best-effort only
  }
}

async function readBackendState(): Promise<ServerProcessState | null> {
  const state = await readFullState();
  return state?.backend ?? null;
}

async function writeBackendState(port: number, pid?: number): Promise<void> {
  const state = (await readFullState()) ?? {};
  state.backend = { port, pid };
  await writeFullState(state);
}

async function clearBackendState(): Promise<void> {
  try {
    const state = await readFullState();
    if (!state) return;
    delete state.backend;
    if (!state.vite) {
      await fs.unlink(STATE_FILE);
    } else {
      await writeFullState(state);
    }
  } catch {
    // Ignore if file missing
  }
}

async function stopBackendIfRunning(state: ServerProcessState): Promise<boolean> {
  if (!state.pid) return false;

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
      await clearBackendState();
      return true;
    }
  }

  return false;
}

export async function startDummyBackend(port?: number): Promise<{ content: { type: "text"; text: string }[] }> {
  const userRequestedPort = typeof port === "number" ? port : undefined;
  const messages: string[] = [];
  const savedState = await readBackendState();

  // Case 1: explicit port
  if (userRequestedPort !== undefined) {
    if (savedState && savedState.port !== userRequestedPort) {
      if (await isPortInUse(savedState.port)) {
        const stopped = await stopBackendIfRunning(savedState);
        if (stopped) {
          messages.push(
            `ℹ️ Stopped existing dummy backend on http://localhost:${savedState.port}`
          );
        } else {
          messages.push(
            `⚠️ Detected a dummy backend previously started on http://localhost:${savedState.port}, but could not confirm it was stopped.`
          );
        }
      } else {
        await clearBackendState();
      }
    }

    if (await isPortInUse(userRequestedPort)) {
      if (savedState && savedState.port === userRequestedPort) {
        const prefix = messages.length ? messages.join("\n") + "\n" : "";
        return {
          content: [
            {
              type: "text",
              text:
                prefix +
                `✅ Dummy backend already running on http://localhost:${userRequestedPort}`,
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
              `❌ Port ${userRequestedPort} is already in use by another process; cannot start dummy backend there.`,
          },
        ],
      };
    }

    try {
      const child = spawn("npm", ["run", "dummy-backend"], {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
        env: { ...process.env, DUMMY_BACKEND_PORT: String(userRequestedPort) },
      });
      const pid = child.pid;
      child.unref();

      await writeBackendState(userRequestedPort, pid);

      const prefix = messages.length ? messages.join("\n") + "\n" : "";
      return {
        content: [
          {
            type: "text",
            text:
              prefix +
              `✅ Dummy backend starting on http://localhost:${userRequestedPort}`,
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
              `❌ Failed to start dummy backend: ${err?.message || String(err)}`,
          },
        ],
      };
    }
  }

  // Case 2: no explicit port
  if (savedState && (await isPortInUse(savedState.port))) {
    return {
      content: [
        {
          type: "text",
          text: `✅ Dummy backend already running on http://localhost:${savedState.port}`,
        },
      ],
    };
  }

  if (savedState) {
    await clearBackendState();
  }

  const defaultPort = 4000;

  if (await isPortInUse(defaultPort)) {
    await writeBackendState(defaultPort);
    return {
      content: [
        {
          type: "text",
          text: `✅ Dummy backend already running on http://localhost:${defaultPort}`,
        },
      ],
    };
  }

  try {
    const child = spawn("npm", ["run", "dummy-backend"], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
      env: { ...process.env, DUMMY_BACKEND_PORT: String(defaultPort) },
    });
    const pid = child.pid;
    child.unref();

    await writeBackendState(defaultPort, pid);

    return {
      content: [
        {
          type: "text",
          text: `✅ Dummy backend starting on http://localhost:${defaultPort}`,
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to start dummy backend: ${err?.message || String(err)}`,
        },
      ],
    };
  }
}

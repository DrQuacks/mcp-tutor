import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";
import fs from "node:fs/promises";
import path from "node:path";

// Session state will be stored in-memory and persisted to disk
const SESSION_STATE_PATH = path.join(process.cwd(), "session_state.json");
let seniorDevSessions: Record<string, any> = {};


// Load sessions from disk on startup, migrating legacy formats if needed
async function loadSessionsFromDisk() {
  try {
    const data = await fs.readFile(SESSION_STATE_PATH, "utf8");
    let parsed = JSON.parse(data);
    if (process.env.SENIORDEV_DEBUG) {
      console.log("[SeniorDev] Loaded session_state.json:", JSON.stringify(parsed, null, 2));
    } else {
      console.log(`[SeniorDev] Loaded session_state.json with keys: ${Object.keys(parsed).join(", ")}`);
    }
    // Use only the 'seniorDevSessions' field, or migrate legacy formats
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.seniorDevSessions && typeof parsed.seniorDevSessions === 'object') {
        seniorDevSessions = parsed.seniorDevSessions;
        console.log(`[SeniorDev] Loaded seniorDevSessions: ${Object.keys(parsed.seniorDevSessions).length} sessions`);
      } else if (parsed.seniorDevSession && parsed.seniorDevSession.sessionId) {
        seniorDevSessions = { [parsed.seniorDevSession.sessionId]: parsed.seniorDevSession };
        console.log("[SeniorDev] Migrated legacy seniorDevSession format");
      } else if (parsed.sessionId) {
        seniorDevSessions = { [parsed.sessionId]: parsed };
        console.log("[SeniorDev] Migrated legacy sessionId format");
      } else {
        seniorDevSessions = {};
        console.log("[SeniorDev] No seniorDevSessions found in session_state.json");
      }
    } else {
      seniorDevSessions = {};
      console.log("[SeniorDev] session_state.json not an object, resetting seniorDevSessions");
    }
  } catch (e) {
    seniorDevSessions = {};
    console.log("[SeniorDev] Could not read session_state.json, initializing empty seniorDevSessions");
  }
}

// Immediately load sessions
await loadSessionsFromDisk();

// Save sessions to disk in sessionId-keyed format
async function saveSessionsToDisk() {
  // Write each session's full data to a separate file in senior-dev-tutorials/
  await fs.mkdir(path.join(process.cwd(), "senior-dev-tutorials"), { recursive: true });
  for (const [sessionId, session] of Object.entries(seniorDevSessions)) {
    const sessionFile = path.join(process.cwd(), "senior-dev-tutorials", `session-${sessionId}.json`);
    // Write full session data to file
    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2), "utf8");
  }
  if (process.env.SENIORDEV_DEBUG) {
    console.log("[SeniorDev] saveSessionsToDisk: All session data written to senior-dev-tutorials/ directory.");
  } else {
    console.log(`[SeniorDev] saveSessionsToDisk: Wrote ${Object.keys(seniorDevSessions).length} sessions to senior-dev-tutorials/ directory.`);
  }
}

/**
 * Initialize a Senior Dev Mode session by capturing the code change context.
 * Supports git diff (default) or file snapshot mode.
 */
export async function seniorDev_start_mode({ files, fromCommit, toCommit, mode }: {
  files?: string[];
  fromCommit?: string;
  toCommit?: string;
  mode?: "diff" | "file";
}) {
  // 1. Generate a session ID
  const sessionId = uuidv4();
  const repoRoot = process.cwd();
  let fileList: string[] = files || [];
  let before: Record<string, string> = {};
  let after: Record<string, string> = {};
  let diffs: Record<string, string> = {};
  console.log(`[SeniorDev] Starting new session: ${sessionId}`);

  // 2. Determine files to include
  if (!fileList.length) {
    // If not specified, get all changed files (git diff or working dir)
    const diffRange = fromCommit ? `${fromCommit}${toCommit ? `..${toCommit}` : ""}` : "";
    const gitDiffCmd = `git diff --name-only ${diffRange}`.trim();
    fileList = await new Promise<string[]>((resolve, reject) => {
      exec(gitDiffCmd, { cwd: repoRoot }, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout.split("\n").filter(Boolean));
      });
    });
  }

  // 3. For each file, get before/after content and diff
  for (const file of fileList) {
    const absPath = path.join(repoRoot, file);
    // Before: fromCommit or HEAD
    let beforeContent = "";
    if (mode === "file" && fromCommit) {
      // Use git show for specific commit
      beforeContent = await new Promise<string>((resolve) => {
        exec(`git show ${fromCommit}:${file}`, { cwd: repoRoot }, (err, stdout) => {
          resolve(err ? "" : stdout);
        });
      });
    } else if (fromCommit) {
      beforeContent = await new Promise<string>((resolve) => {
        exec(`git show ${fromCommit}:${file}`, { cwd: repoRoot }, (err, stdout) => {
          resolve(err ? "" : stdout);
        });
      });
    } else {
      // Default: HEAD
      beforeContent = await new Promise<string>((resolve) => {
        exec(`git show HEAD:${file}`, { cwd: repoRoot }, (err, stdout) => {
          resolve(err ? "" : stdout);
        });
      });
    }
    before[file] = beforeContent;
    // After: working directory
    try {
      after[file] = await fs.readFile(absPath, "utf8");
    } catch {
      after[file] = "";
    }
    // Diff
    const diffCmd = fromCommit
      ? `git diff ${fromCommit}${toCommit ? `..${toCommit}` : ""} -- ${file}`
      : `git diff HEAD -- ${file}`;
    diffs[file] = await new Promise<string>((resolve) => {
      exec(diffCmd, { cwd: repoRoot }, (err, stdout) => {
        resolve(err ? "" : stdout);
      });
    });
  }

  // 4. Store session state (in-memory, will be written to file by saveSessionsToDisk)
  seniorDevSessions[sessionId] = {
    sessionId,
    files: fileList,
    before,
    after,
    diffs,
    fromCommit: fromCommit || "HEAD",
    toCommit: toCommit || "WORKING",
    mode: mode || "diff",
    createdAt: new Date().toISOString(),
    phase: "awaiting-skill-analysis"
  };
  if (process.env.SENIORDEV_DEBUG) {
    console.log(`[SeniorDev] Session ${sessionId} state before save:`, JSON.stringify(seniorDevSessions[sessionId], null, 2));
  } else {
    console.log(`[SeniorDev] Session ${sessionId} state before save: keys: ${Object.keys(seniorDevSessions[sessionId]).join(", ")}`);
  }
  await saveSessionsToDisk();

  // 5. Return session info
  return {
    content: [
      {
        type: "text" as const,
        text: `Senior Dev Mode session started. Session ID: ${sessionId}\nFiles: ${fileList.join(", ")}`,
      },
    ],
    sessionId,
    files: fileList,
    before,
    after,
    diffs,
    fromCommit: fromCommit || "HEAD",
    toCommit: toCommit || "WORKING",
    mode: mode || "diff",
  };
}

// Export session state for use by other tools
export { seniorDevSessions };

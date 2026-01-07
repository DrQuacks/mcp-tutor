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
    // Use only the 'seniorDevSessions' field, or migrate legacy formats
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.seniorDevSessions && typeof parsed.seniorDevSessions === 'object') {
        seniorDevSessions = parsed.seniorDevSessions;
      } else if (parsed.seniorDevSession && parsed.seniorDevSession.sessionId) {
        seniorDevSessions = { [parsed.seniorDevSession.sessionId]: parsed.seniorDevSession };
      } else if (parsed.sessionId) {
        seniorDevSessions = { [parsed.sessionId]: parsed };
      } else {
        seniorDevSessions = {};
      }
    } else {
      seniorDevSessions = {};
    }
  } catch {
    seniorDevSessions = {};
  }
}

// Immediately load sessions
await loadSessionsFromDisk();

// Save sessions to disk in sessionId-keyed format
async function saveSessionsToDisk() {
  // Read the whole session_state.json, update only the seniorDevSessions field
  let state: any = {};
  try {
    const data = await fs.readFile(SESSION_STATE_PATH, "utf8");
    state = JSON.parse(data);
  } catch {
    state = {};
  }
  state.seniorDevSessions = seniorDevSessions;
  await fs.writeFile(SESSION_STATE_PATH, JSON.stringify(state, null, 2), "utf8");
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

  // 4. Store session state
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
  };
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

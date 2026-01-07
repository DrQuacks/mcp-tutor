import fs from "node:fs/promises";
import path from "node:path";

const SESSION_STATE_PATH = path.join(process.cwd(), "session_state.json");

/**
 * Get the latest Senior Dev Mode session (by createdAt).
 * Returns { sessionId, session } or { error } if none found.
 */
export async function seniorDev_get_latest_session() {
  try {
    const data = await fs.readFile(SESSION_STATE_PATH, "utf8");
    const sessions = JSON.parse(data);
    const sessionList = Object.values(sessions);
    if (!sessionList.length) {
      return { error: "No sessions found." };
    }
    // Sort by createdAt descending
    sessionList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latest = sessionList[0];
    return { sessionId: latest.sessionId, session: latest };
  } catch (err) {
    return { error: `Failed to read session state: ${err}` };
  }
}

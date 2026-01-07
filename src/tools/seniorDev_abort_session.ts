import { seniorDevSessions } from "./seniorDev_start_mode.js";

/**
 * Abort a Senior Dev Mode session, cleaning up any session state.
 * Input: { sessionId: string }
 * Output: { content: [...], aborted: boolean }
 */
export async function seniorDev_abort_session({ sessionId }: { sessionId: string }) {
  if (seniorDevSessions[sessionId]) {
    delete seniorDevSessions[sessionId];
    return {
      content: [
        { type: "text" as const, text: `Session ${sessionId} aborted and cleaned up.` },
      ],
      aborted: true
    };
  } else {
    return {
      content: [
        { type: "text" as const, text: `No session found for ID: ${sessionId}` },
      ],
      aborted: false
    };
  }
}

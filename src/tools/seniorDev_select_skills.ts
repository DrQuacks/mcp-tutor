import { seniorDevSessions } from "./seniorDev_start_mode.js";

/**
 * Allow the user to select which skills/concepts to focus on in the tutorial.
 * This tool takes a sessionId and selectedSkills, updates the session, and returns confirmation.
 *
 * Input: { sessionId: string, selectedSkills: string[] }
 * Output: { content: [...], selectedSkills: string[] }
 */
export async function seniorDev_select_skills({ sessionId, selectedSkills }: { sessionId: string; selectedSkills: string[] }) {
  const session = seniorDevSessions[sessionId];
  if (!session) {
    return {
      content: [
        { type: "text" as const, text: `❌ No session found for ID: ${sessionId}` },
      ],
      selectedSkills: [],
    };
  }
  session.selectedSkills = selectedSkills;
  return {
    content: [
      { type: "text" as const, text: `Skills selected: ${selectedSkills.join(", ")}` },
    ],
    selectedSkills,
  };
}

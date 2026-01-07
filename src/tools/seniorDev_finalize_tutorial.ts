import { seniorDevSessions } from "./seniorDev_start_mode.js";
import { formatTutorialStepForUser } from "../shared/tutorialStepBuilder.js";

/**
 * Finalize the Senior Dev Mode tutorial, presenting a summary and marking the session as complete.
 * Input: { sessionId: string }
 * Output: { content: [...], summary: string }
 */
export async function seniorDev_finalize_tutorial({ sessionId }: { sessionId: string }) {
  const session = seniorDevSessions[sessionId];
  if (!session || !session.tutorialPlan) {
    return {
      content: [
        { type: "text" as const, text: `❌ No tutorial plan found for session: ${sessionId}` },
      ],
      summary: "No tutorial plan found."
    };
  }
  session.completed = true;
  // Build a summary of all steps
  const steps = session.tutorialPlan.steps;
  const summaryLines = [
    `🎉 **Senior Dev Mode Complete!**`,
    `\n**Summary:** Completed all ${steps.length} steps.`,
    "\n---\n"
  ];
  for (const step of steps) {
    summaryLines.push(formatTutorialStepForUser(step));
    summaryLines.push("\n---\n");
  }
  return {
    content: [
      { type: "text" as const, text: summaryLines.join("\n") },
    ],
    summary: `Completed all ${steps.length} steps.`
  };
}

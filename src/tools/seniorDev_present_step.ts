import { seniorDevSessions } from "./seniorDev_start_mode.js";
import { formatTutorialStepForUser } from "../shared/tutorialStepBuilder.js";

/**
 * Present the current tutorial step to the user, including context and instructions.
 * This tool takes a sessionId and stepNumber, retrieves the step from the tutorial plan, and returns it.
 *
 * Input: { sessionId: string, stepNumber: number }
 * Output: { content: [...], step: any }
 */
export async function seniorDev_present_step({ sessionId, stepNumber }: { sessionId: string; stepNumber: number }) {
  const session = seniorDevSessions[sessionId];
  if (!session || !session.tutorialPlan) {
    return {
      content: [
        { type: "text" as const, text: `❌ No tutorial plan found for session: ${sessionId}` },
      ],
      step: null,
    };
  }
  if (session.phase !== "tutorial-generated") {
    return {
      content: [
        { type: "text" as const, text: `❌ Invalid phase: ${session.phase}. Steps can only be presented after tutorial is generated.` },
      ],
      step: null,
    };
  }
  const step = session.tutorialPlan.steps.find((s: any) => s.stepNumber === stepNumber);
  if (!step) {
    return {
      content: [
        { type: "text" as const, text: `❌ Step ${stepNumber} not found in tutorial plan.` },
      ],
      step: null,
    };
  }
  // Use shared formatter for step presentation
  return {
    content: [
      { type: "text" as const, text: formatTutorialStepForUser(step) },
    ],
    step,
  };
}

import { seniorDevSessions } from "./seniorDev_start_mode.js";

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
  const step = session.tutorialPlan.steps.find((s: any) => s.stepNumber === stepNumber);
  if (!step) {
    return {
      content: [
        { type: "text" as const, text: `❌ Step ${stepNumber} not found in tutorial plan.` },
      ],
      step: null,
    };
  }
  // Present the step in the same format as the main tutorial system
  let lines: string[] = [];
  lines.push(`## Step ${step.stepNumber}: ${step.title}`);
  lines.push("");
  if (step.explanation) {
    lines.push(`**Concept:** ${step.explanation}`);
    lines.push("");
  }
  if (step.codeExample) {
    lines.push(`### 💻 Generic Example`);
    lines.push("```");
    lines.push(step.codeExample);
    lines.push("```");
    lines.push("");
  }
  if (step.task) {
    lines.push(`### ✏️ Your Task`);
    lines.push(step.task);
    lines.push("");
  }
  return {
    content: [
      { type: "text" as const, text: lines.join("\n") },
    ],
    step,
  };
}

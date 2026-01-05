import type { TutorialStep } from "./types.js";

/**
 * Builds a TutorialStep object for use in both main tutorials and Senior Dev Mode.
 */
export function buildTutorialStep({
  stepNumber,
  title,
  explanation,
  codeExample,
  task,
  validation,
  diff,
  hints
}: {
  stepNumber: number;
  title: string;
  explanation: string;
  codeExample?: string;
  task: string;
  validation: { type: string; checks: any[] };
  diff?: any;
  hints?: string[];
}): TutorialStep & { diff?: any } {
  return {
    stepNumber,
    title,
    explanation,
    codeExample,
    task,
    validation,
    hints,
    diff,
  };
}

/**
 * Formats a TutorialStep for user presentation (markdown string).
 */
export function formatTutorialStepForUser(step: TutorialStep): string {
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
  return lines.join("\n");
}

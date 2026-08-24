import type { TutorialStep } from "./types.js";

/**
 * Builds a TutorialStep object for use in both main tutorials and Senior Dev Mode.
 */
export function buildTutorialStep({
  stepNumber,
  title,
  explanation,
  codeExample,
  howToStart,
  task,
  checkYourWork,
  commonMistakes,
  interviewThink,
  validation,
  diff,
  hints
}: {
  stepNumber: number;
  title: string;
  explanation: string;
  codeExample?: string;
  howToStart?: string;
  task: string;
  checkYourWork?: string[];
  commonMistakes?: string[];
  interviewThink?: string[];
  validation: { type: string; checks: any[] };
  diff?: any;
  hints?: string[];
}): TutorialStep & { diff?: any } {
  return {
    stepNumber,
    title,
    explanation,
    codeExample,
    howToStart,
    task,
    checkYourWork,
    commonMistakes,
    interviewThink,
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
  if (step.howToStart) {
    lines.push(`### 🧭 How to Start`);
    lines.push(step.howToStart);
    lines.push("");
  }
  if (step.task) {
    lines.push(`### ✏️ Your Task`);
    lines.push(step.task);
    lines.push("");
  }
  if (step.checkYourWork && step.checkYourWork.length > 0) {
    lines.push("### ✅ Check Your Work");
    for (const item of step.checkYourWork) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }
  if (step.commonMistakes && step.commonMistakes.length > 0) {
    lines.push("### ⚠️ Common Mistakes");
    for (const item of step.commonMistakes) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }
  if (step.interviewThink && step.interviewThink.length > 0) {
    lines.push("### 🎯 Interview Think");
    for (const item of step.interviewThink) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

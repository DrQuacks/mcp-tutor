/**
 * Explains the concept of the current tutorial step in simpler terms
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT } from "../shared/constants.js";
import { getTutorialProgress } from "../shared/progress.js";
import type { ToolResponse, TutorialStep } from "../shared/types.js";

export async function tutorExplainConcept({
  tutorialId,
}: {
  tutorialId: string;
}): Promise<ToolResponse> {
  const tutorialPath = path.join(EXERCISES_ROOT, `tutorial-${tutorialId}.json`);

  let tutorialData: any;
  try {
    const content = await fs.readFile(tutorialPath, "utf8");
    tutorialData = JSON.parse(content);
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Tutorial '${tutorialId}' not found or invalid.`,
        },
      ],
    };
  }

  const progress = await getTutorialProgress(tutorialId);
  if (!progress) {
    return {
      content: [
        {
          type: "text",
          text: `❌ No progress found. Start the tutorial first with tutor_start_tutorial.`,
        },
      ],
    };
  }

  const currentStep: TutorialStep = tutorialData.steps[progress.currentStep - 1];
  if (!currentStep) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Invalid step number.`,
        },
      ],
    };
  }

  const lines: string[] = [];
  lines.push(`## 📖 Concept Explanation: ${currentStep.title}`);
  lines.push("");
  lines.push("**What this step is teaching:**");
  lines.push("");
  lines.push(currentStep.explanation);
  lines.push("");
  
  if (currentStep.codeExample) {
    lines.push("**The generic pattern:**");
    lines.push("```tsx");
    lines.push(currentStep.codeExample);
    lines.push("```");
    lines.push("");
  }
  
  lines.push("**Your specific task:**");
  lines.push(currentStep.task);

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
  };
}

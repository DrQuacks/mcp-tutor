/**
 * Provides hints for the current tutorial step
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT } from "../shared/constants.js";
import { getTutorialProgress } from "../shared/progress.js";
import type { ToolResponse, TutorialStep } from "../shared/types.js";

export async function tutorTutorialHint({
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
          text: `❌ No progress found for tutorial '${tutorialId}'. Use tutor_start_tutorial first.`,
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
          text: `❌ Invalid step number ${progress.currentStep}`,
        },
      ],
    };
  }

  const lines: string[] = [];
  lines.push(`## 💡 Hints for Step ${currentStep.stepNumber}: ${currentStep.title}`);
  lines.push("");

  if (currentStep.hints && currentStep.hints.length > 0) {
    for (let i = 0; i < currentStep.hints.length; i++) {
      lines.push(`**Hint ${i + 1}:** ${currentStep.hints[i]}`);
      lines.push("");
    }
  } else {
    lines.push("No hints available for this step. Review the explanation and task description carefully.");
  }

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
  };
}

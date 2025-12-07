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

  // Return data for AI to craft personalized hints with validation
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          requestType: "provide-validated-hint",
          stepNumber: currentStep.stepNumber,
          stepTitle: currentStep.title,
          task: currentStep.task,
          explanation: currentStep.explanation,
          predefinedHints: currentStep.hints || [],
          instruction: "Provide a helpful hint based on the predefined hints (if any) and the task requirements. Make it guidance-focused, not a direct solution. ⚠️ CRITICAL: You MUST call tutor_validate_response with your hint text BEFORE sending it to the student.",
          requireResponseValidation: true,
        }, null, 2),
      },
    ],
  };
}

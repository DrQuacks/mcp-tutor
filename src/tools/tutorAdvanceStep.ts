/**
 * Advances the tutorial to the next step after validation
 * Called by the AI after manually validating student code
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT } from "../shared/constants.js";
import { getTutorialProgress, updateTutorialProgress, markInterviewTutorialComplete } from "../shared/progress.js";
import { filterCopyPasteSolutions } from "../shared/pedagogyFilter.js";
import { createGenericExampleRequest } from "../shared/genericExampleGenerator.js";
import type { ToolResponse, TutorialStep } from "../shared/types.js";
import { formatTutorialStepForUser } from "../shared/tutorialStepBuilder.js";

export async function tutorAdvanceStep({
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

  // Mark current step as complete and advance
  const newCompletedSteps = [...progress.completedSteps, progress.currentStep];
  const nextStep = progress.currentStep + 1;

  if (nextStep <= tutorialData.steps.length) {
    await updateTutorialProgress(tutorialId, tutorialData.title, nextStep, newCompletedSteps);
    const nextStepData: TutorialStep = tutorialData.steps[nextStep - 1];
    // Present the next step using the shared formatter
    return {
      content: [
        {
          type: "text",
          text: formatTutorialStepForUser(nextStepData),
        },
      ],
    };
  } else {
    // Tutorial complete!
    await updateTutorialProgress(tutorialId, tutorialData.title, nextStep, newCompletedSteps);
    await markInterviewTutorialComplete(tutorialId);
    return {
      content: [
        {
          type: "text",
          text:
            "🎉 **Congratulations!** You've completed the entire tutorial!\n\n" +
            `**Summary:** Completed all ${tutorialData.steps.length} steps`,
        },
      ],
    };
  }
}

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

    // Return request for AI to generate generic example and present next step
    const genericExampleData = createGenericExampleRequest(
      nextStepData.title,
      nextStepData.explanation,
      nextStepData.task
    );
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...genericExampleData,
              previousStepNumber: currentStep.stepNumber,
              previousStepTitle: currentStep.title,
              tutorialTitle: tutorialData.title,
              tutorialDescription: tutorialData.description,
              stepNumber: nextStepData.stepNumber,
              totalSteps: tutorialData.steps.length,
              completedSteps: newCompletedSteps,
              task: filterCopyPasteSolutions(nextStepData.task),
              filePath: tutorialData.filePath,
              instruction:
                "Step " +
                currentStep.stepNumber +
                " passed! Generate a generic code example that teaches the new concept without solving the specific task. Then present Step " +
                nextStepData.stepNumber +
                " to the student with your generic example included.",
            },
            null,
            2
          ),
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
          text: JSON.stringify({
            requestType: "tutorial-complete",
            tutorialTitle: tutorialData.title,
            totalSteps: tutorialData.steps.length,
            message: "🎉 Congratulations! You've completed the entire tutorial!",
          }, null, 2),
        },
      ],
    };
  }
}

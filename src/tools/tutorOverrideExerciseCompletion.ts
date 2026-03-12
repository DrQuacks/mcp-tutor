import { loadProgress, saveProgress, markExerciseOverrideCompleted } from "../shared/progress.js";
import type { ToolResponse } from "../shared/types.js";

/**
 * Allows the user to mark an exercise as "completed (user override)" even if
 * not all automated tests have passed. This is recorded on the most recent
 * attempt for the given exerciseId.
 */
export async function tutorOverrideExerciseCompletion(params: {
  exerciseId: string;
}): Promise<ToolResponse> {
  const { exerciseId } = params;

  const progress = await loadProgress();
  const hasAttempt = progress.exercises.some(
    (attempt) => attempt.exerciseId === exerciseId
  );

  if (!hasAttempt) {
    return {
      content: [
        {
          type: "text",
          text: `No attempts found for exerciseId "${exerciseId}". Run the exercise at least once before marking it as completed (user override).`,
        },
      ],
    };
  }

  await markExerciseOverrideCompleted(exerciseId);

  return {
    content: [
      {
        type: "text",
        text: `Marked the most recent attempt for exerciseId "${exerciseId}" as completed (user override).`,
      },
    ],
  };
}

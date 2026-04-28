import { loadProgress } from "./progress.js";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Given a list of all available tutorial IDs and titles, returns their status for the user.
 * Status: "not-started", "in-progress", "completed"
 */
export async function getAllTutorialStatuses(
  allTutorials: Array<{ tutorialId: string; title: string; totalSteps: number }>
): Promise<Array<{ tutorialId: string; title: string; status: "not-started" | "in-progress" | "completed"; currentStep?: number; completedSteps?: number[]; }>> {
  const progress = await loadProgress();
  return allTutorials.map(tut => {
    const userTut = progress.tutorials.find((t) => t.tutorialId === tut.tutorialId);
    if (!userTut) {
      return { tutorialId: tut.tutorialId, title: tut.title, status: "not-started" };
    }
    const isCompleted = userTut.completedSteps.length === tut.totalSteps;
    return {
      tutorialId: tut.tutorialId,
      title: tut.title,
      status: isCompleted ? "completed" : "in-progress",
      currentStep: userTut.currentStep,
      completedSteps: userTut.completedSteps,
    };
  });
}

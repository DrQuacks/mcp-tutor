/**
 * Progress tracking utilities for recording and retrieving user exercise attempts
 */

import fs from "node:fs/promises";
import type { UserProgress, ExerciseAttempt, TutorialProgress } from "./types.js";
import { PROGRESS_FILE, INTERVIEW_PROGRESS_FILE } from "./constants.js";

export async function loadProgress(): Promise<UserProgress> {
  try {
    const content = await fs.readFile(PROGRESS_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    // File doesn't exist yet, return empty progress
    return { exercises: [], tutorials: [] };
  }
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf8");
}

export async function recordAttempt(
  exerciseId: string,
  title: string,
  environment: string,
  passed: boolean,
  testsPassed: number,
  testsTotal: number,
  hintsUsed: number = 0,
  solutionViewed: boolean = false,
  overrideCompleted: boolean = false
): Promise<void> {
  const progress = await loadProgress();
  progress.exercises.push({
    exerciseId,
    title,
    environment,
    passed,
    date: new Date().toISOString(),
    testsPassed,
    testsTotal,
    hintsUsed,
    solutionViewed,
    overrideCompleted,
  });
  await saveProgress(progress);
}

/**
 * Marks the most recent attempt for an exercise as user-override completed.
 * This does not change whether tests passed, but records that the user
 * explicitly considers the exercise complete.
 */
export async function markExerciseOverrideCompleted(exerciseId: string): Promise<void> {
  const progress = await loadProgress();

  // Find the latest attempt for this exercise (search from the end)
  let latestIndex = -1;
  for (let i = progress.exercises.length - 1; i >= 0; i--) {
    if (progress.exercises[i].exerciseId === exerciseId) {
      latestIndex = i;
      break;
    }
  }

  if (latestIndex === -1) {
    // No attempts yet; nothing to mark. Caller can surface a friendly message.
    return;
  }

  progress.exercises[latestIndex].overrideCompleted = true;
  await saveProgress(progress);
}

export async function getTutorialProgress(tutorialId: string): Promise<TutorialProgress | null> {
  const progress = await loadProgress();
  return progress.tutorials.find(t => t.tutorialId === tutorialId) || null;
}

export async function updateTutorialProgress(
  tutorialId: string,
  title: string,
  currentStep: number,
  completedSteps: number[]
): Promise<void> {
  const progress = await loadProgress();
  const existing = progress.tutorials.findIndex(t => t.tutorialId === tutorialId);
  
  const tutorialProgress: TutorialProgress = {
    tutorialId,
    title,
    currentStep,
    completedSteps,
    startedAt: existing >= 0 ? progress.tutorials[existing].startedAt : new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
  
  if (existing >= 0) {
    progress.tutorials[existing] = tutorialProgress;
  } else {
    progress.tutorials.push(tutorialProgress);
  }
  
  await saveProgress(progress);
}

/**
 * Updates interview_progress.json when a tutorial is completed
 */
export async function markInterviewTutorialComplete(tutorialId: string): Promise<void> {
  try {
    const content = await fs.readFile(INTERVIEW_PROGRESS_FILE, "utf8");
    const interviewProgress = JSON.parse(content);
    
    // Find and update the tutorial in interview progress
    let updated = false;
    if (interviewProgress.interviewPrep?.topics) {
      for (const topic of interviewProgress.interviewPrep.topics) {
        if (topic.tutorial?.id === tutorialId) {
          topic.tutorial.completed = true;
          topic.tutorial.completedDate = new Date().toISOString();
          updated = true;
        }
      }
    }
    
    if (updated) {
      // Update stats
      const totalCompleted = interviewProgress.interviewPrep.topics.filter(
        (t: any) => t.tutorial?.completed
      ).length;
      interviewProgress.stats.tutorialsCompleted = totalCompleted;
      interviewProgress.stats.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(INTERVIEW_PROGRESS_FILE, JSON.stringify(interviewProgress, null, 2), "utf8");
    }
  } catch (err) {
    // Interview progress file might not exist or tutorial might not be in it - that's okay
    // This is optional tracking, don't throw errors
  }
}

/**
 * Updates interview_progress.json when an exercise is completed
 */
export async function markInterviewExerciseComplete(
  exerciseId: string,
  testsPassed: number,
  testsTotal: number
): Promise<void> {
  try {
    const content = await fs.readFile(INTERVIEW_PROGRESS_FILE, "utf8");
    const interviewProgress = JSON.parse(content);
    
    // Find and update the exercise in interview progress
    let updated = false;
    if (interviewProgress.interviewPrep?.topics) {
      for (const topic of interviewProgress.interviewPrep.topics) {
        if (topic.exercise?.id === exerciseId) {
          topic.exercise.attempts = (topic.exercise.attempts || 0) + 1;
          topic.exercise.testsPassed = testsPassed;
          topic.exercise.testsTotal = testsTotal;
          
          if (testsPassed === testsTotal) {
            topic.exercise.completed = true;
            topic.exercise.completedDate = new Date().toISOString();
          }
          updated = true;
        }
      }
    }
    
    if (updated) {
      // Update stats
      const totalCompleted = interviewProgress.interviewPrep.topics.filter(
        (t: any) => t.exercise?.completed
      ).length;
      interviewProgress.stats.exercisesCompleted = totalCompleted;
      interviewProgress.stats.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(INTERVIEW_PROGRESS_FILE, JSON.stringify(interviewProgress, null, 2), "utf8");
    }
  } catch (err) {
    // Interview progress file might not exist or exercise might not be in it - that's okay
  }
}

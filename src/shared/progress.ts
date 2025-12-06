/**
 * Progress tracking utilities for recording and retrieving user exercise attempts
 */

import fs from "node:fs/promises";
import type { UserProgress, ExerciseAttempt, TutorialProgress } from "./types.js";
import { PROGRESS_FILE } from "./constants.js";

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
  solutionViewed: boolean = false
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
  });
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

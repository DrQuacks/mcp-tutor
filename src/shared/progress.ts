/**
 * Progress tracking utilities for recording and retrieving user exercise attempts
 */

import fs from "node:fs/promises";
import type { UserProgress, ExerciseAttempt } from "./types.js";
import { PROGRESS_FILE } from "./constants.js";

export async function loadProgress(): Promise<UserProgress> {
  try {
    const content = await fs.readFile(PROGRESS_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    // File doesn't exist yet, return empty progress
    return { exercises: [] };
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

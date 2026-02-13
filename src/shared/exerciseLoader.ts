/**
 * Shared helper for loading exercise JSON and handling tutorial vs exercise distinction.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT } from "./constants.js";
import type { ToolResponse } from "./types.js";

export type LoadedExercise<T = any> =
  | { kind: "ok"; exerciseData: T }
  | { kind: "error"; response: ToolResponse };

export async function loadExercise<T = any>(exerciseId: string): Promise<LoadedExercise<T>> {
  const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);

  try {
    const content = await fs.readFile(exercisePath, "utf8");
    const exerciseData = JSON.parse(content) as T;
    return { kind: "ok", exerciseData };
  } catch (err: any) {
    const tutorialPath = path.join(EXERCISES_ROOT, `tutorial-${exerciseId}.json`);
    try {
      await fs.access(tutorialPath);
      return {
        kind: "error",
        response: {
          content: [
            {
              type: "text",
              text:
                `❌ '${exerciseId}' is a tutorial, not an exercise. ` +
                `Use tutor_check_tutorial_step with tutorialId '${exerciseId}'.`,
            },
          ],
        },
      };
    } catch {
      // fall through to generic error
    }

    return {
      kind: "error",
      response: {
        content: [
          {
            type: "text",
            text: `❌ Exercise '${exerciseId}' not found or invalid.`,
          },
        ],
      },
    };
  }
}

export type SolutionFileCheckResult =
  | { kind: "ok"; solutionPath: string }
  | { kind: "error"; response: ToolResponse };

export async function requireSolutionFile(options: {
  envRoot: string;
  filePath: string;
  missingMessage?: string;
}): Promise<SolutionFileCheckResult> {
  const { envRoot, filePath, missingMessage } = options;
  const solutionPath = path.join(envRoot, filePath);

  try {
    await fs.access(solutionPath);
    return { kind: "ok", solutionPath };
  } catch {
    return {
      kind: "error",
      response: {
        content: [
          {
            type: "text",
            text:
              missingMessage ??
              `❌ Solution file not found at ${filePath}. Did you create the file?`,
          },
        ],
      },
    };
  }
}

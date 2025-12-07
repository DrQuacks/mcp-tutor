/**
 * Provides progressive hints by analyzing student code
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT, NODE_ENV_ROOT, REACT_ENV_ROOT } from "../shared/constants.js";
import type { ToolResponse } from "../shared/types.js";

export async function tutorGetHint({
  exerciseId,
  hintLevel = "gentle",
}: {
  exerciseId: string;
  hintLevel?: "gentle" | "specific" | "detailed";
}): Promise<ToolResponse> {
  const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);
  
  let exerciseData: any;
  try {
    const content = await fs.readFile(exercisePath, "utf8");
    exerciseData = JSON.parse(content);
  } catch (err: any) {
    return {
      content: [{
        type: "text",
        text: `❌ Exercise '${exerciseId}' not found.`,
      }],
    };
  }

  // Read student's current code
  const envRoot = exerciseData.environment === "node" ? NODE_ENV_ROOT : REACT_ENV_ROOT;
  const filePath = path.join(envRoot, exerciseData.filePath);
  
  let studentCode = "";
  try {
    studentCode = await fs.readFile(filePath, "utf8");
  } catch (err: any) {
    return {
      content: [{
        type: "text",
        text: `📝 I don't see your code file yet. Make sure you've created the file at: ${exerciseData.filePath}`,
      }],
    };
  }

  // Return data for AI to analyze student code and provide validated hints
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        requestType: "provide-validated-hint",
        exerciseId,
        exerciseTitle: exerciseData.title,
        hintLevel,
        requirements: exerciseData.requirements,
        hints: exerciseData.hints || [],
        studentCode,
        instruction: `Analyze the student's code and provide a ${hintLevel} hint. Gentle: ask guiding questions. Specific: point out what's missing. Detailed: explain the concept. ⚠️ CRITICAL: You MUST call tutor_validate_response with your hint text BEFORE sending it to the student.`,
        requireResponseValidation: true,
      }, null, 2),
    }],
  };
}

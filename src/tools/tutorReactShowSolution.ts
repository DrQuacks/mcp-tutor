/**
 * Shows complete solution for React exercises
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT } from "../shared/constants.js";
import type { ToolResponse } from "../shared/types.js";

export async function tutorReactShowSolution({
  exerciseId,
}: {
  exerciseId: string;
}): Promise<ToolResponse> {
  const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);

  let exerciseData: any;
  try {
    const content = await fs.readFile(exercisePath, "utf8");
    exerciseData = JSON.parse(content);
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Exercise '${exerciseId}' not found or invalid.`,
        },
      ],
    };
  }

  const lines: string[] = [];
  lines.push(`# Solution for ${exerciseData.title}`);
  lines.push("");
  lines.push("Here's a working solution:");
  lines.push("");
  lines.push("```jsx");
  lines.push(exerciseData.solutionCode);
  lines.push("```");
  lines.push("");
  lines.push("You can copy this into your file or study it to understand the approach.");

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
  };
}

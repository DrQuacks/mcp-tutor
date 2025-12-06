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

  // Analyze the code and provide hints based on level
  const lines: string[] = [];
  lines.push(`💡 **Hint for ${exerciseData.title}** (${hintLevel} level)`);
  lines.push("");
  
  if (hintLevel === "gentle") {
    lines.push("Let me guide you with some questions to think about:");
    lines.push("");
    lines.push("1. Look at the requirements - which ones have you completed?");
    lines.push("2. Are all the necessary elements present in your JSX?");
    lines.push("3. Check the hints section in the exercise description for technical details");
    lines.push("");
    lines.push("💬 Ask for a 'specific' hint if you need me to point out exact issues.");
  } else if (hintLevel === "specific") {
    lines.push("Let me point out some specific things to check:");
    lines.push("");
    
    // Check for common issues based on exercise type
    if (exerciseData.environment === "react") {
      if (!studentCode.includes("useState")) {
        lines.push("❗ I don't see `useState` in your code. You need it for state management.");
      }
      if (studentCode.match(/<input[^>]*>[^<]*<\/input>/)) {
        lines.push("❗ Your input element should be self-closing: `<input />` not `<input></input>`");
      }
      if (exerciseId.includes("input") || exerciseId.includes("text")) {
        if (!studentCode.includes("value=")) {
          lines.push("❗ For a controlled input, you need a `value` prop connected to state");
        }
        if (!studentCode.includes("onChange")) {
          lines.push("❗ You need an `onChange` handler to update state when the user types");
        }
      }
    }
    
    lines.push("");
    lines.push("💬 Ask for a 'detailed' hint if you need concept explanations.");
  } else if (hintLevel === "detailed") {
    lines.push("Let me explain the key concepts:");
    lines.push("");
    
    // Provide relevant hints from the exercise
    if (exerciseData.hints && exerciseData.hints.length > 0) {
      lines.push("**Key concepts:**");
      for (let i = 0; i < Math.min(2, exerciseData.hints.length); i++) {
        lines.push(`- ${exerciseData.hints[i]}`);
      }
    }
    
    lines.push("");
    lines.push("**What to focus on:**");
    // Show first 2-3 requirements
    for (let i = 0; i < Math.min(3, exerciseData.requirements.length); i++) {
      lines.push(`${i + 1}. ${exerciseData.requirements[i]}`);
    }
    
    lines.push("");
    lines.push("💬 If you're still stuck, you can ask to see the solution with `tutor_show_solution`.");
  }

  return {
    content: [{
      type: "text",
      text: lines.join("\n"),
    }],
  };
}

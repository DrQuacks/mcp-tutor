/**
 * Validates AI responses to ensure they don't give away solutions
 */

import fs from "fs/promises";
import path from "path";
import { extractTaskKeywords, quickCheckForSolution } from "../shared/responseValidator.js";
import type { ToolResponse } from "../shared/types.js";

export async function tutorValidateResponse({
  responseText,
  tutorialOrExerciseId,
  stepNumber,
}: {
  responseText: string;
  tutorialOrExerciseId: string;
  stepNumber?: number;
}): Promise<ToolResponse> {
  // Load the tutorial/exercise to get the task description
  // Try with 'tutorial-' prefix first for tutorials, then without for exercises
  let exercisePath = path.join(process.cwd(), "exercises", `tutorial-${tutorialOrExerciseId}.json`);
  let fileExists = false;
  
  try {
    await fs.access(exercisePath);
    fileExists = true;
  } catch {
    // Try without tutorial- prefix
    exercisePath = path.join(process.cwd(), "exercises", `${tutorialOrExerciseId}.json`);
  }
  
  let exerciseTask = "";
  try {
    const content = await fs.readFile(exercisePath, "utf-8");
    const data = JSON.parse(content);
    
    if (data.steps && stepNumber !== undefined) {
      // Tutorial: get specific step
      const step = data.steps[stepNumber - 1];
      if (step) {
        exerciseTask = step.task || step.explanation || "";
      }
    } else if (data.requirements) {
      // Exercise: get requirements
      exerciseTask = Array.isArray(data.requirements) 
        ? data.requirements.join(" ") 
        : data.requirements;
    }
  } catch (err) {
    return {
      content: [{
        type: "text",
        text: `⚠️ Could not load tutorial/exercise: ${tutorialOrExerciseId}`,
      }],
    };
  }
  
  if (!exerciseTask) {
    return {
      content: [{
        type: "text",
        text: "⚠️ Could not determine task description",
      }],
    };
  }
  
  // Extract keywords that would indicate a solution
  const taskKeywords = extractTaskKeywords(exerciseTask);
  
  // Quick check for obvious violations
  const quickCheck = quickCheckForSolution(responseText, taskKeywords);
  
  let feedback = "";
  let approved = true;
  
  if (quickCheck.likelySolution) {
    approved = false;
    feedback = `⚠️ **PEDAGOGICAL VIOLATION DETECTED**

Your response contains code that matches the student's specific task keywords: ${quickCheck.matches.join(", ")}

**Problem:** You're giving away the solution instead of guiding the student.

**Guidelines for pedagogical responses:**
1. ❌ DON'T show code with the exact variable/function names from the task
2. ❌ DON'T provide copy-paste solutions
3. ✅ DO explain what's wrong conceptually ("you're passing X instead of Y")
4. ✅ DO ask guiding questions ("what type of data does this function expect?")
5. ✅ DO point to documentation or general patterns
6. ✅ DO use generic examples with DIFFERENT names than the task

**Rephrase your response to guide without solving.**`;
  } else {
    feedback = `✅ **Response Approved**

Your response appears pedagogical - it guides without giving away the solution.`;
  }
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          approved,
          feedback,
          taskKeywords,
          matchedKeywords: quickCheck.matches,
        }, null, 2),
      },
    ],
  };
}

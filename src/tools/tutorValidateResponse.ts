/**
 * Validates AI responses to ensure they don't give away solutions
 */

import fs from "fs/promises";
import path from "path";
import { extractTaskKeywords, quickCheckForSolution } from "../shared/responseValidator.js";
import type { ToolResponse } from "../shared/types.js";

function hasCodeFence(text: string): boolean {
  return /```[\s\S]*?```/.test(text);
}

function hasQuestion(text: string): boolean {
  return /\?/.test(text);
}

function checkTutorialResponseFormat(responseText: string): {
  passed: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  const conceptPattern = /(concept|what you'll learn|mental model)/i;
  const genericPattern = /(generic|pattern|example)/i;
  const mappingPattern = /(maps to your file|mapping|in your file|this maps)/i;
  const nextActionPattern = /(your next action|your task|next step|do this now|when you're done)/i;
  const interviewPattern = /(interview|how would you explain|why is|what tradeoff)/i;

  if (!conceptPattern.test(responseText)) {
    missing.push("Concept section");
  }

  if (!(genericPattern.test(responseText) && hasCodeFence(responseText))) {
    missing.push("Generic sample code section");
  }

  if (!mappingPattern.test(responseText)) {
    missing.push("Mapping-to-your-file section");
  }

  if (!nextActionPattern.test(responseText)) {
    missing.push("Explicit next action section");
  }

  if (!(interviewPattern.test(responseText) && hasQuestion(responseText))) {
    missing.push("Interview-style question");
  }

  return {
    passed: missing.length === 0,
    missing,
  };
}

export async function tutorValidateResponse({
  responseText,
  tutorialOrExerciseId,
  stepNumber,
}: {
  responseText: string;
  tutorialOrExerciseId: string;
  stepNumber?: number;
}): Promise<ToolResponse> {
  const explicitSolutionMode = /\[solution-mode\]|explicit solution requested|user requested full solution/i.test(
    responseText
  );

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
  let rawStep: any | undefined;
  let isTutorial = false;
  try {
    const content = await fs.readFile(exercisePath, "utf-8");
    const data = JSON.parse(content);
    
    if (data.steps && stepNumber !== undefined) {
      // Tutorial: get specific step
      isTutorial = true;
      const step = data.steps[stepNumber - 1];
      if (step) {
        rawStep = step;
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
  const tutorialFormatCheck = isTutorial
    ? checkTutorialResponseFormat(responseText)
    : { passed: true, missing: [] as string[] };
  
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
  } else if (!tutorialFormatCheck.passed && !explicitSolutionMode) {
    approved = false;
    feedback = `⚠️ **TUTORIAL FORMAT VIOLATION DETECTED**

This response does not follow the required teaching format for tutorial steps.

**Missing required sections:**
${tutorialFormatCheck.missing.map((item, index) => `${index + 1}. ${item}`).join("\n")}

**Required tutorial response structure (strict):**
1. Concept (2-4 bullets)
2. Generic sample code (different names than task)
3. Mapping to the student's actual file/symbols
4. Explicit next action
5. One interview-style question

Please rewrite your response using this structure before sending.`;
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
          taskDescription: exerciseTask,
          validationMeta: {
            taskKeywords,
            matchedKeywords: quickCheck.matches,
            isTutorial,
            explicitSolutionMode,
            tutorialFormatPassed: tutorialFormatCheck.passed,
            tutorialFormatMissing: tutorialFormatCheck.missing,
            hasStepValidationChecks: Boolean(rawStep?.validation && Array.isArray(rawStep.validation.checks)),
            stepValidationChecks: rawStep?.validation?.checks ?? [],
          },
        }, null, 2),
      },
    ],
  };
}

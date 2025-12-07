/**
 * Validates the current tutorial step and advances to next step if successful
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { EXERCISES_ROOT, REACT_ENV_ROOT } from "../shared/constants.js";
import { getTutorialProgress, updateTutorialProgress } from "../shared/progress.js";
import { getOrStartViteServer } from "../shared/vite.js";
import { filterCopyPasteSolutions } from "../shared/pedagogyFilter.js";
import { createGenericExampleRequest } from "../shared/genericExampleGenerator.js";
import type { ToolResponse, TutorialStep } from "../shared/types.js";

export async function tutorCheckTutorialStep({
  tutorialId,
}: {
  tutorialId: string;
}): Promise<ToolResponse> {
  const tutorialPath = path.join(EXERCISES_ROOT, `tutorial-${tutorialId}.json`);

  let tutorialData: any;
  try {
    const content = await fs.readFile(tutorialPath, "utf8");
    tutorialData = JSON.parse(content);
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Tutorial '${tutorialId}' not found or invalid.`,
        },
      ],
    };
  }

  const progress = await getTutorialProgress(tutorialId);
  if (!progress) {
    return {
      content: [
        {
          type: "text",
          text: `❌ No progress found for tutorial '${tutorialId}'. Use tutor_start_tutorial first.`,
        },
      ],
    };
  }

  const currentStep: TutorialStep = tutorialData.steps[progress.currentStep - 1];
  if (!currentStep) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Invalid step number ${progress.currentStep}`,
        },
      ],
    };
  }

  // Read the student's code
  const envRoot = tutorialData.environment === "node" ? 
    path.join(process.cwd(), "environments/node") : 
    REACT_ENV_ROOT;
  const filePath = path.join(envRoot, tutorialData.filePath);

  let studentCode: string;
  try {
    studentCode = await fs.readFile(filePath, "utf8");
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Could not read your file at ${tutorialData.filePath}`,
        },
      ],
    };
  }

  // Validate the step
  const validation = currentStep.validation;
  let passed = false;
  let feedback = "";

  if (validation.type === "code-contains") {
    // Return student code and requirements for the AI assistant to analyze
    // The AI will determine if code meets requirements semantically
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            validationType: "semantic-analysis-required",
            stepNumber: currentStep.stepNumber,
            stepTitle: currentStep.title,
            task: currentStep.task,
            checks: validation.checks,
            studentCode: studentCode,
            instruction: "Analyze if the student's code accomplishes the task requirements. Ignore exact formatting/spacing. Check if the functionality and concepts are correctly implemented. Then either advance to next step if passed, or explain what's missing. ⚠️ CRITICAL: If the code does NOT pass, you MUST call tutor_validate_response with your planned hint/guidance BEFORE sending it to the student.",
            requireResponseValidation: true,
          }, null, 2)
        }
      ]
    };
  } else if (validation.type === "browser-test" && tutorialData.environment === "react") {
    // Run browser tests and return data for AI semantic validation
    const viteResult = await getOrStartViteServer();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      await page.goto(viteResult.url, { waitUntil: "networkidle", timeout: 10000 });
      
      const tests = validation.checks as any[];
      const testResults: { name: string; selector: string; expected: any; actual: any }[] = [];
      
      // Collect actual outputs for AI semantic validation
      for (const test of tests) {
        try {
          if (test.contains) {
            // Get actual text content
            const element = page.locator(test.selector);
            const actualText = await element.first().textContent();
            testResults.push({
              name: test.name,
              selector: test.selector,
              expected: test.contains,
              actual: actualText || ""
            });
          } else if (test.exists !== undefined) {
            const count = await page.locator(test.selector).count();
            testResults.push({
              name: test.name,
              selector: test.selector,
              expected: `element should ${test.exists ? 'exist' : 'not exist'}`,
              actual: `element ${count > 0 ? 'exists' : 'does not exist'} (count: ${count})`
            });
          }
        } catch (err: any) {
          testResults.push({
            name: test.name,
            selector: test.selector || "unknown",
            expected: "test to run successfully",
            actual: `Error: ${err.message}`
          });
        }
      }
      
      // Return data for AI to semantically validate
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              validationType: "semantic-browser-validation-required",
              stepNumber: currentStep.stepNumber,
              stepTitle: currentStep.title,
              task: currentStep.task,
              testResults: testResults,
              instruction: "Analyze each test result. For 'contains' tests, determine if the actual output semantically accomplishes what was expected, even if the exact wording differs. If all tests pass semantically, advance to the next step. If not, explain what's missing. ⚠️ CRITICAL: If tests do NOT pass, you MUST call tutor_validate_response with your planned hint/guidance BEFORE sending it to the student.",
              requireResponseValidation: true,
            }, null, 2)
          }
        ]
      };
    } finally {
      await browser.close();
    }
  }

  // Build response
  const lines: string[] = [];
  lines.push(`## Step ${currentStep.stepNumber}: ${currentStep.title}`);
  lines.push("");
  lines.push(feedback);
  lines.push("");

  if (passed) {
    // Mark step as complete and advance
    const newCompletedSteps = [...progress.completedSteps, progress.currentStep];
    const nextStep = progress.currentStep + 1;
    
    if (nextStep <= tutorialData.steps.length) {
      await updateTutorialProgress(tutorialId, tutorialData.title, nextStep, newCompletedSteps);
      
      const nextStepData: TutorialStep = tutorialData.steps[nextStep - 1];
      
      // Return request for AI to generate generic example and present next step
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              validationType: "step-complete-present-next",
              previousStepNumber: currentStep.stepNumber,
              previousStepTitle: currentStep.title,
              ...createGenericExampleRequest(
                nextStepData.title,
                nextStepData.explanation,
                nextStepData.task
              ),
              stepNumber: nextStepData.stepNumber,
              task: filterCopyPasteSolutions(nextStepData.task),
              instruction: "The previous step passed! Generate a generic code example for the new concept, then present Step " + nextStepData.stepNumber + " to the student with your generic example."
            }, null, 2)
          }
        ]
      };
    } else {
      lines.push("🎉 **Congratulations!** You've completed the entire tutorial!");
      lines.push("");
      lines.push(`**Summary:** Completed all ${tutorialData.steps.length} steps`);
    }
  } else {
    lines.push("Try again! Use `tutor_tutorial_hint` if you need help.");
  }

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
  };
}

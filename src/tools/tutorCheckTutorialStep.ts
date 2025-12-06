/**
 * Validates the current tutorial step and advances to next step if successful
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { EXERCISES_ROOT, REACT_ENV_ROOT } from "../shared/constants.js";
import { getTutorialProgress, updateTutorialProgress } from "../shared/progress.js";
import { getOrStartViteServer } from "../shared/vite.js";
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
    const checks = validation.checks as string[];
    const missing: string[] = [];
    
    for (const check of checks) {
      if (!studentCode.includes(check)) {
        missing.push(check);
      }
    }
    
    if (missing.length === 0) {
      passed = true;
      feedback = "✅ Perfect! Your code contains all required elements.";
    } else {
      feedback = `❌ Your code is missing the following:\n${missing.map(m => `  - \`${m}\``).join("\n")}`;
    }
  } else if (validation.type === "browser-test" && tutorialData.environment === "react") {
    // Run browser tests similar to exercise validation
    const viteUrl = await getOrStartViteServer();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      await page.goto(viteUrl, { waitUntil: "networkidle", timeout: 10000 });
      
      const tests = validation.checks as any[];
      const results: { name: string; passed: boolean; error?: string }[] = [];
      
      for (const test of tests) {
        try {
          if (test.exists !== undefined) {
            const element = await page.locator(test.selector).first();
            const exists = await element.count() > 0;
            if (exists === test.exists) {
              results.push({ name: test.name, passed: true });
            } else {
              results.push({ 
                name: test.name, 
                passed: false, 
                error: `Expected element to ${test.exists ? 'exist' : 'not exist'}` 
              });
            }
          } else if (test.actions) {
            // Execute actions
            for (const action of test.actions) {
              const locator = page.locator(action.selector);
              if (action.action === "click") {
                await locator.first().click({ timeout: 5000 });
              } else if (action.action === "type") {
                await locator.first().fill(action.value, { timeout: 5000 });
              }
            }
            
            // Check the result
            if (test.then.exists !== undefined) {
              const element = await page.locator(test.then.selector).first();
              const exists = await element.count() > 0;
              if (exists === test.then.exists) {
                results.push({ name: test.name, passed: true });
              } else {
                results.push({ 
                  name: test.name, 
                  passed: false, 
                  error: `Expected element to ${test.then.exists ? 'exist' : 'not exist'}` 
                });
              }
            }
          }
        } catch (err: any) {
          results.push({ name: test.name, passed: false, error: err.message });
        }
      }
      
      passed = results.every(r => r.passed);
      if (passed) {
        feedback = `✅ All ${results.length} tests passed!`;
      } else {
        const failed = results.filter(r => !r.passed);
        feedback = `❌ ${failed.length} of ${results.length} tests failed:\n${failed.map(f => `  - ${f.name}: ${f.error}`).join("\n")}`;
      }
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
      lines.push("---");
      lines.push("");
      lines.push(`## Step ${nextStepData.stepNumber}: ${nextStepData.title}`);
      lines.push("");
      lines.push("### 📖 Explanation");
      lines.push(nextStepData.explanation);
      lines.push("");
      lines.push("### ✏️ Your Task");
      lines.push(nextStepData.task);
      lines.push("");
      lines.push("💡 Use `tutor_check_tutorial_step` again when you're ready to validate this step.");
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

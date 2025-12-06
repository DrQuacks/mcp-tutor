/**
 * Provides guidance on connecting the generic pattern to the student's specific task
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT, REACT_ENV_ROOT } from "../shared/constants.js";
import { getTutorialProgress } from "../shared/progress.js";
import type { ToolResponse, TutorialStep } from "../shared/types.js";

export async function tutorConnectPattern({
  tutorialId,
  studentQuestion,
}: {
  tutorialId: string;
  studentQuestion?: string;
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
          text: `❌ No progress found. Start the tutorial first.`,
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
          text: `❌ Invalid step number.`,
        },
      ],
    };
  }

  // Read what they have so far
  const envRoot = tutorialData.environment === "node" ? 
    path.join(process.cwd(), "environments/node") : 
    REACT_ENV_ROOT;
  const filePath = path.join(envRoot, tutorialData.filePath);
  
  let studentCode = "";
  try {
    studentCode = await fs.readFile(filePath, "utf8");
  } catch (err) {
    studentCode = "(file not found or empty)";
  }

  const lines: string[] = [];
  lines.push(`## 🔗 Connecting the Pattern to Your Task`);
  lines.push("");
  lines.push(`**Step ${currentStep.stepNumber}: ${currentStep.title}**`);
  lines.push("");
  
  if (studentQuestion) {
    lines.push(`You asked: "${studentQuestion}"`);
    lines.push("");
  }
  
  lines.push("**The generic pattern from the tutorial:**");
  if (currentStep.codeExample) {
    lines.push("```tsx");
    lines.push(currentStep.codeExample);
    lines.push("```");
  }
  lines.push("");
  
  lines.push("**To adapt this to YOUR specific task:**");
  lines.push("");
  
  // Provide context-aware guidance based on validation requirements
  if (currentStep.validation.type === "code-contains") {
    const checks = currentStep.validation.checks as string[];
    lines.push("The tutorial is looking for:");
    for (const check of checks) {
      lines.push(`- Code that includes: \`${check}\``);
    }
    lines.push("");
    lines.push("Look at the generic pattern above and the task instructions. What parts do you need to change to match your specific case?");
  }
  
  lines.push("");
  lines.push("Think about:");
  lines.push("- What names have you defined in previous steps that you need to use here?");
  lines.push("- What values make sense for your specific counter application?");
  lines.push("- Where in your code does this need to go?");

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
  };
}

/**
 * Starts or resumes a tutorial, presenting the current step
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT, REACT_ENV_ROOT } from "../shared/constants.js";
import { getTutorialProgress, updateTutorialProgress } from "../shared/progress.js";
import type { ToolResponse, TutorialStep } from "../shared/types.js";

export async function tutorStartTutorial({
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

  // Get or create progress
  let progress = await getTutorialProgress(tutorialId);
  let currentStepNumber = 1;
  let completedSteps: number[] = [];

  if (progress) {
    currentStepNumber = progress.currentStep;
    completedSteps = progress.completedSteps;
  }

  // Create starter file if this is the first step
  if (currentStepNumber === 1) {
    const envRoot = tutorialData.environment === "node" ? 
      path.join(process.cwd(), "environments/node") : 
      REACT_ENV_ROOT;
    const filePath = path.join(envRoot, tutorialData.filePath);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, tutorialData.starterCode || "", "utf8");

    // For React tutorials, update App.tsx
    if (tutorialData.environment === "react") {
      const appPath = path.join(REACT_ENV_ROOT, "src", "App.tsx");
      const componentName = path.basename(tutorialData.filePath, path.extname(tutorialData.filePath));
      const appContent = `import './App.css'
import ${componentName} from './exercises/${componentName}'

function App() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Tutorial: ${tutorialData.title}</h1>
      <${componentName} />
    </div>
  )
}

export default App
`;
      await fs.writeFile(appPath, appContent, "utf8");
    }
  }

  // Update progress
  await updateTutorialProgress(tutorialId, tutorialData.title, currentStepNumber, completedSteps);

  // Get current step
  const currentStep: TutorialStep = tutorialData.steps[currentStepNumber - 1];
  if (!currentStep) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Invalid step number ${currentStepNumber}`,
        },
      ],
    };
  }

  // Format the response
  const lines: string[] = [];
  lines.push(`# 📚 Tutorial: ${tutorialData.title}`);
  lines.push("");
  lines.push(tutorialData.description);
  lines.push("");
  lines.push(`**Progress:** Step ${currentStepNumber} of ${tutorialData.steps.length}`);
  if (completedSteps.length > 0) {
    lines.push(`**Completed steps:** ${completedSteps.join(", ")}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`## Step ${currentStep.stepNumber}: ${currentStep.title}`);
  lines.push("");
  lines.push("### 📖 Explanation");
  lines.push(currentStep.explanation);
  lines.push("");
  lines.push("### ✏️ Your Task");
  lines.push(currentStep.task);
  lines.push("");
  lines.push(`📁 Work in file: \`${tutorialData.filePath}\``);
  lines.push("");
  lines.push("💡 When you're ready, use the `tutor_check_tutorial_step` tool to validate your work.");
  if (currentStep.hints && currentStep.hints.length > 0) {
    lines.push("");
    lines.push("💭 **Hints available:** Use `tutor_tutorial_hint` if you need help.");
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

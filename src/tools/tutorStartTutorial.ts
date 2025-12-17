/**
 * Starts or resumes a tutorial, presenting the current step
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT, REACT_ENV_ROOT } from "../shared/constants.js";
import { getTutorialProgress, updateTutorialProgress } from "../shared/progress.js";
import { filterCopyPasteSolutions } from "../shared/pedagogyFilter.js";
import { createGenericExampleRequest } from "../shared/genericExampleGenerator.js";
import { checkExternalViteServer } from "../shared/vite.js";
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

  // For React tutorials, check if Vite server is running
  let serverMessage = '';
  if (tutorialData.environment === "react") {
    const serverStatus = await checkExternalViteServer();
    serverMessage = serverStatus.message;
    
    // If server not running, include warning in response
    if (!serverStatus.running) {
      serverMessage = `\n\n${serverStatus.message}\n\n⚠️ The tutorial will work, but you won't see live updates in the browser until the server is running.`;
    }
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

  // Return data for AI to generate generic example and present step
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          ...createGenericExampleRequest(
            currentStep.title,
            currentStep.explanation,
            currentStep.task
          ),
          tutorialTitle: tutorialData.title,
          tutorialDescription: tutorialData.description,
          stepNumber: currentStep.stepNumber,
          totalSteps: tutorialData.steps.length,
          completedSteps: completedSteps,
          task: filterCopyPasteSolutions(currentStep.task),
          filePath: tutorialData.filePath,
          serverStatus: serverMessage, // Include server status
        }, null, 2),
      },
    ],
  };
}

/**
 * Shared TypeScript types and interfaces for the MCP tutor server
 */

export interface ExerciseAttempt {
  exerciseId: string;
  title: string;
  environment: string;
  passed: boolean;
  date: string; // ISO date string
  testsPassed: number;
  testsTotal: number;
  hintsUsed: number;
  solutionViewed: boolean;
  // Optional flag when the user explicitly marks an attempt as completed
  // even if tests did not all pass.
  overrideCompleted?: boolean;
}

export interface TutorialStep {
  stepNumber: number;
  title: string;
  explanation: string; // Thorough explanation of the concept - WHY it exists, WHEN to use it
  codeExample?: string; // Optional generic code example showing the syntax/pattern
  task: string; // Specific instructions for what the student should implement
  validation: {
    type: "code-contains" | "code-runs" | "output-contains" | "browser-test";
    checks: string[] | any[]; // For code-contains: array of required strings. For browser-test: test objects
  };
  hints?: string[];
}

export interface TutorialStepResponse {
  stepNumber: number;
  totalSteps: number;
  title: string;
  explanation: string;
  codeExample?: string;
  task: string;
  filePath: string;
  completedSteps?: number[];
}

export interface TutorialProgress {
  tutorialId: string;
  title: string;
  currentStep: number;
  completedSteps: number[];
  startedAt: string;
  lastActivity: string;
}

export interface UserProgress {
  exercises: ExerciseAttempt[];
  tutorials: TutorialProgress[];
}

export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  [key: string]: unknown;
}

// Extend Window type for test progress API
declare global {
  interface Window {
    __TEST_PROGRESS__?: {
      tests: Array<{ name: string; status: string }>;
      currentIndex: number;
      setTests: (names: string[]) => void;
      setCurrentTest: (index: number) => void;
      setTestResult: (index: number, passed: boolean) => void;
      render: () => void;
    };
  }
}

// Required to make this a module
export {};

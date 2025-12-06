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
}

export interface UserProgress {
  exercises: ExerciseAttempt[];
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

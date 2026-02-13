import type { ToolResponse } from "./types.js";
import { recordAttempt, markInterviewExerciseComplete } from "./progress.js";

export type ExerciseTestResult = {
  name: string;
  passed: boolean;
  error?: string;
};

interface FormatExerciseResultsOptions {
  exerciseId: string;
  exerciseTitle: string;
  environment: string;
  testResults: ExerciseTestResult[];
  showSolutionToolName: "tutor_node_show_solution" | "tutor_react_show_solution";
}

export async function formatExerciseResultsAndRecord({
  exerciseId,
  exerciseTitle,
  environment,
  testResults,
  showSolutionToolName,
}: FormatExerciseResultsOptions): Promise<ToolResponse> {
  const allPassed = testResults.every((t) => t.passed);
  const lines: string[] = [];

  if (allPassed) {
    lines.push(
      `✅ Excellent! All ${testResults.length} tests passed for ${exerciseTitle}!`
    );
    lines.push("");
    lines.push("Tests run:");
    for (const test of testResults) {
      lines.push(`  ✅ ${test.name}`);
    }
  } else {
    lines.push(`❌ Some tests failed for ${exerciseTitle}`);
    lines.push("");
    lines.push("Test results:");
    for (const test of testResults) {
      if (test.passed) {
        lines.push(`  ✅ ${test.name}`);
      } else {
        lines.push(`  ❌ ${test.name}`);
        if (test.error) {
          lines.push(`     Error: ${test.error}`);
        }
      }
    }
    lines.push("");
    lines.push(
      "Would you like a hint about what might be wrong? Let me know and I can provide more specific guidance."
    );
    lines.push(
      `Or use \`${showSolutionToolName}\` with exerciseId: "${exerciseId}" to see the full solution.`
    );
  }

  const testsPassed = testResults.filter((t) => t.passed).length;
  const testsTotal = testResults.length;

  await recordAttempt(
    exerciseId,
    exerciseTitle,
    environment,
    allPassed,
    testsPassed,
    testsTotal
  );

  await markInterviewExerciseComplete(exerciseId, testsPassed, testsTotal);

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
  };
}

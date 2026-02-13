/**
 * Tests Node.js solutions against exercise test cases
 */

import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { EXERCISES_ROOT, NODE_ENV_ROOT } from "../shared/constants.js";
import { createCommonJsSandbox } from "../shared/vmSandbox.js";
import { formatExerciseResultsAndRecord, ExerciseTestResult } from "../shared/exerciseResults.js";
import type { ToolResponse } from "../shared/types.js";

export async function tutorNodeCheckSolution({
  exerciseId,
}: {
  exerciseId: string;
}): Promise<ToolResponse> {
  const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);

  let exerciseData: any;
  try {
    const content = await fs.readFile(exercisePath, "utf8");
    exerciseData = JSON.parse(content);
  } catch (err: any) {
    const tutorialPath = path.join(EXERCISES_ROOT, `tutorial-${exerciseId}.json`);
    try {
      await fs.access(tutorialPath);
      return {
        content: [
          {
            type: "text",
            text:
              `❌ '${exerciseId}' is a tutorial, not an exercise. ` +
              `Use tutor_check_tutorial_step with tutorialId '${exerciseId}'.`,
          },
        ],
      };
    } catch {
      // fall through to generic error
    }
    return {
      content: [
        {
          type: "text",
          text: `❌ Exercise '${exerciseId}' not found or invalid.`,
        },
      ],
    };
  }

  // Verify solution file exists
  const solutionPath = path.join(NODE_ENV_ROOT, exerciseData.filePath);

  let solutionCode: string;
  try {
    solutionCode = await fs.readFile(solutionPath, "utf8");
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Solution file not found at ${exerciseData.filePath}. Did you create the file in environments/node/?`,
        },
      ],
    };
  }

  // Compile TypeScript if needed
  let codeToRun = solutionCode;
  if (solutionPath.endsWith('.ts')) {
    try {
      // Simple TypeScript to JavaScript transpilation (strips types)
      const ts = await import('typescript');
      const result = ts.transpileModule(solutionCode, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        }
      });
      codeToRun = result.outputText;
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to compile TypeScript: ${err.message}`,
          },
        ],
      };
    }
  }

  // Run tests using VM sandbox
  const testResults: ExerciseTestResult[] = [];

  for (const test of exerciseData.tests) {
    try {
      const sandbox: any = createCommonJsSandbox();

      vm.createContext(sandbox);
      vm.runInContext(codeToRun, sandbox, { timeout: 1000 });

      // Get the exported function (handle both CommonJS and ES6 exports)
      // First try sandbox.exports (for ES6 transpiled to CommonJS)
      // Then try module.exports (for direct CommonJS)
      let func = sandbox.exports || sandbox.module.exports;
      
      // Handle ES6 export syntax
      if (typeof func === 'object' && func !== null) {
        // Look for the function in exports
        const functionName = exerciseData.filePath.split('/').pop()?.replace(/\.(ts|js)$/, '');
        if (functionName && typeof func[functionName] === 'function') {
          func = func[functionName];
        } else {
          // Try to find any exported function
          const exportedFunc = Object.values(func).find(v => typeof v === 'function');
          if (exportedFunc) {
            func = exportedFunc;
          }
        }
      }
      
      if (typeof func !== "function") {
        throw new Error("No function exported from the file");
      }

      // Run the test
      const result = func(test.input);
      
      // Deep comparison for arrays and objects
      let passed = false;
      if (Array.isArray(test.expected) && Array.isArray(result)) {
        passed = JSON.stringify(result) === JSON.stringify(test.expected);
      } else if (typeof test.expected === 'object' && test.expected !== null && typeof result === 'object' && result !== null) {
        passed = JSON.stringify(result) === JSON.stringify(test.expected);
      } else {
        passed = result === test.expected;
      }
      
      if (!passed) {
        throw new Error(`Expected ${JSON.stringify(test.expected)}, but got ${JSON.stringify(result)}`);
      }

      testResults.push({ name: test.name, passed: true });
    } catch (err: any) {
      testResults.push({
        name: test.name,
        passed: false,
        error: err.message,
      });
    }
  }

  return await formatExerciseResultsAndRecord({
    exerciseId,
    exerciseTitle: exerciseData.title,
    environment: exerciseData.environment,
    testResults,
    showSolutionToolName: "tutor_node_show_solution",
  });
}

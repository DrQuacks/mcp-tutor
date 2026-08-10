/**
 * Tests Node.js solutions against exercise test cases
 */

import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { NODE_ENV_ROOT } from "../shared/constants.js";
import { createCommonJsSandbox } from "../shared/vmSandbox.js";
import { formatExerciseResultsAndRecord, ExerciseTestResult } from "../shared/exerciseResults.js";
import type { ToolResponse } from "../shared/types.js";
import { loadExercise, requireSolutionFile } from "../shared/exerciseLoader.js";

export async function tutorNodeCheckSolution({
  exerciseId,
}: {
  exerciseId: string;
}): Promise<ToolResponse> {
  const loaded = await loadExercise<any>(exerciseId);
  if (loaded.kind === "error") {
    return loaded.response;
  }

  const { exerciseData } = loaded;

  // Verify solution file exists
  const solutionCheck = await requireSolutionFile({
    envRoot: NODE_ENV_ROOT,
    filePath: exerciseData.filePath,
    missingMessage:
      `❌ Solution file not found at ${exerciseData.filePath}. Did you create the file in environments/node/?`,
  });

  if (solutionCheck.kind === "error") {
    return solutionCheck.response;
  }

  const { solutionPath } = solutionCheck;

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

      // Resolve exported function (CommonJS + transpiled ES module interop)
      // Prefer module.exports first to avoid false negatives when exports is a
      // separate empty object in the sandbox.
      const moduleExports = sandbox.module?.exports;
      const namedExports = sandbox.exports;
      let func: any;

      if (typeof moduleExports === "function") {
        func = moduleExports;
      } else if (typeof namedExports === "function") {
        func = namedExports;
      } else {
        const functionName = exerciseData.filePath.split('/').pop()?.replace(/\.(ts|js)$/, '');

        const findExportedFunction = (candidate: any): any => {
          if (!candidate || typeof candidate !== "object") return undefined;

          if (functionName && typeof candidate[functionName] === "function") {
            return candidate[functionName];
          }

          if (typeof candidate.default === "function") {
            return candidate.default;
          }

          return Object.values(candidate).find((value) => typeof value === "function");
        };

        func = findExportedFunction(moduleExports) ?? findExportedFunction(namedExports);
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

import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { EXERCISES_ROOT } from "../shared/constants.js";
import { loadExercise } from "../shared/exerciseLoader.js";
import { createCommonJsSandbox } from "../shared/vmSandbox.js";
import type { ToolResponse } from "../shared/types.js";

type NodeTestCase = {
  name: string;
  input: any;
  expected: any;
};

type ValidationResult = {
  index: number;
  name: string;
  input: any;
  expected: any;
  actual: any;
  passed: boolean;
  error?: string;
};

function deepEqual(a: any, b: any): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  if (
    a !== null &&
    b !== null &&
    typeof a === "object" &&
    typeof b === "object"
  ) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return a === b;
}

function safeString(value: any): string {
  if (typeof value === "string") return `"${value}"`;
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function resolveExportedFunction(sandbox: any, functionName?: string): any {
  const moduleExports = sandbox.module?.exports;
  const namedExports = sandbox.exports;

  if (typeof moduleExports === "function") return moduleExports;
  if (typeof namedExports === "function") return namedExports;

  const findFunction = (candidate: any): any => {
    if (!candidate || typeof candidate !== "object") return undefined;

    if (functionName && typeof candidate[functionName] === "function") {
      return candidate[functionName];
    }

    if (typeof candidate.default === "function") {
      return candidate.default;
    }

    return Object.values(candidate).find((value) => typeof value === "function");
  };

  return findFunction(moduleExports) ?? findFunction(namedExports);
}

export async function tutorValidateNodeExerciseTests({
  exerciseId,
  autoFix = false,
}: {
  exerciseId: string;
  autoFix?: boolean;
}): Promise<ToolResponse> {
  const loaded = await loadExercise<any>(exerciseId);
  if (loaded.kind === "error") {
    return loaded.response;
  }

  const { exerciseData } = loaded;

  if (exerciseData.environment !== "node") {
    return {
      content: [
        {
          type: "text",
          text: `❌ '${exerciseId}' is not a Node exercise. This validator supports only environment \"node\".`,
        },
      ],
    };
  }

  if (!Array.isArray(exerciseData.tests) || exerciseData.tests.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `❌ '${exerciseId}' has no tests array to validate.`,
        },
      ],
    };
  }

  if (typeof exerciseData.solutionCode !== "string" || !exerciseData.solutionCode.trim()) {
    return {
      content: [
        {
          type: "text",
          text: `❌ '${exerciseId}' has no solutionCode to execute for validation.`,
        },
      ],
    };
  }

  let codeToRun = exerciseData.solutionCode;
  const filePath: string = exerciseData.filePath ?? "";

  if (filePath.endsWith(".ts")) {
    try {
      const ts = await import("typescript");
      const transpiled = ts.transpileModule(codeToRun, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      });
      codeToRun = transpiled.outputText;
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to compile TypeScript solutionCode: ${err.message}`,
          },
        ],
      };
    }
  }

  const sandbox = createCommonJsSandbox();
  vm.createContext(sandbox);

  try {
    vm.runInContext(codeToRun, sandbox, { timeout: 1000 });
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Could not execute solutionCode for '${exerciseId}': ${err.message}`,
        },
      ],
    };
  }

  const functionName = filePath.split("/").pop()?.replace(/\.(ts|js)$/, "");
  const fn = resolveExportedFunction(sandbox, functionName);

  if (typeof fn !== "function") {
    return {
      content: [
        {
          type: "text",
          text:
            `❌ Could not resolve a callable export from solutionCode for '${exerciseId}'.\n` +
            `Ensure solutionCode exports a function (CommonJS or transpiled equivalent).`,
        },
      ],
    };
  }

  const tests: NodeTestCase[] = exerciseData.tests;
  const results: ValidationResult[] = tests.map((test, index) => {
    try {
      const actual = fn(test.input);
      return {
        index,
        name: test.name,
        input: test.input,
        expected: test.expected,
        actual,
        passed: deepEqual(test.expected, actual),
      };
    } catch (err: any) {
      return {
        index,
        name: test.name,
        input: test.input,
        expected: test.expected,
        actual: undefined,
        passed: false,
        error: err.message,
      };
    }
  });

  const mismatches = results.filter((r) => !r.passed);
  const fixable = mismatches.filter((r) => !r.error);

  let autoFixCount = 0;
  if (autoFix && fixable.length > 0) {
    for (const mismatch of fixable) {
      tests[mismatch.index].expected = mismatch.actual;
      autoFixCount += 1;
    }

    const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);
    await fs.writeFile(exercisePath, JSON.stringify(exerciseData, null, 2), "utf8");
  }

  const lines: string[] = [];
  lines.push(`# Node Test Case Validator: ${exerciseId}`);
  lines.push("");
  lines.push(`- Total tests: ${tests.length}`);
  lines.push(`- Matching solutionCode: ${tests.length - mismatches.length}`);
  lines.push(`- Mismatches: ${mismatches.length}`);
  lines.push(`- Auto-fix: ${autoFix ? "enabled" : "disabled"}`);

  if (mismatches.length === 0) {
    lines.push("");
    lines.push("✅ All test expected values match solutionCode output.");
  } else {
    lines.push("");
    lines.push("## Mismatches");
    for (const mismatch of mismatches) {
      lines.push(`- ${mismatch.name}`);
      lines.push(`  - Input: ${safeString(mismatch.input)}`);
      if (mismatch.error) {
        lines.push(`  - Error: ${mismatch.error}`);
      } else {
        lines.push(`  - Expected: ${safeString(mismatch.expected)}`);
        lines.push(`  - Solution output: ${safeString(mismatch.actual)}`);
      }
    }
  }

  if (autoFix && autoFixCount > 0) {
    lines.push("");
    lines.push(`✅ Auto-fix applied: updated ${autoFixCount} expected value(s) in ${exerciseId}.json`);
  } else if (!autoFix && fixable.length > 0) {
    lines.push("");
    lines.push("Tip: run again with autoFix=true to sync non-error mismatches from solutionCode.");
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

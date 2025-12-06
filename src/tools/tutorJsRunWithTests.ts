/**
 * Runs arbitrary JS solution code + test code together in a sandbox
 */

import vm from "node:vm";
import type { ToolResponse } from "../shared/types.js";

export async function tutorJsRunWithTests({
  solutionCode,
  testCode,
}: {
  solutionCode: string;
  testCode: string;
}): Promise<ToolResponse> {
  const logs: string[] = [];

  const sandbox: any = {
    module: { exports: {} },
    exports: {},
    console: {
      log: (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(" "));
      },
    },
  };

  vm.createContext(sandbox);

  let error: unknown = null;
  try {
    // Run the student's code first
    vm.runInContext(solutionCode, sandbox, { timeout: 1000 });
    // Then run the tests that reference the student's functions
    vm.runInContext(testCode, sandbox, { timeout: 1000 });
  } catch (err) {
    error = err;
  }

  const passed = !error;

  const lines: string[] = [];
  lines.push(passed ? "✅ All tests passed." : "❌ Tests failed.");

  if (logs.length > 0) {
    lines.push("", "Console output:");
    for (const line of logs) {
      lines.push("  " + line);
    }
  }

  if (error) {
    lines.push("", "Error:", String(error));
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

/**
 * Checks user's hello world function using VM sandbox
 */

import vm from "node:vm";
import type { ToolResponse } from "../shared/types.js";
import { createCommonJsSandbox } from "../shared/vmSandbox.js";

export async function tutorJsHelloCheck({ code }: { code: string }): Promise<ToolResponse> {
  // Prepare a sandboxed context
  const sandbox: any = createCommonJsSandbox();

  vm.createContext(sandbox);

  let runError: unknown = null;
  try {
    vm.runInContext(code, sandbox, { timeout: 1000 });
  } catch (err) {
    runError = err;
  }

  if (runError) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Your code threw an error when evaluated:\n\n${String(
            runError
          )}`,
        },
      ],
    };
  }

  // Try to find a callable function
  const candidateFns: Array<{ name: string; fn: unknown }> = [
    { name: "helloWorld", fn: sandbox.helloWorld },
    { name: "module.exports", fn: sandbox.module?.exports },
    { name: "exports.default", fn: sandbox.exports?.default },
  ];

  const found = candidateFns.find(
    (c) => typeof c.fn === "function"
  );

  if (!found) {
    return {
      content: [
        {
          type: "text",
          text:
            "❌ I couldn't find a callable function. I looked for `helloWorld`, `module.exports`, or `exports.default`.\n" +
            "Make sure you either:\n" +
            "  - define `function helloWorld() { ... }`, or\n" +
            "  - export a function via `module.exports = function() { ... }`, or\n" +
            "  - use `exports.default = function() { ... }`.\n",
        },
      ],
    };
  }

  let result: unknown;
  let callError: unknown = null;
  try {
    result = (found.fn as () => unknown)();
  } catch (err) {
    callError = err;
  }

  if (callError) {
    return {
      content: [
        {
          type: "text",
          text: `❌ I found your function (${found.name}), but calling it threw an error:\n\n${String(
            callError
          )}`,
        },
      ],
    };
  }

  if (typeof result !== "string") {
    return {
      content: [
        {
          type: "text",
          text:
            `❌ Your function (${found.name}) returned a non-string value: ${JSON.stringify(
              result
            )}\n` +
            "It should return a string containing the words 'hello' and 'world'.",
        },
      ],
    };
  }

  const normalized = result.toLowerCase();
  const hasHello = normalized.includes("hello");
  const hasWorld = normalized.includes("world");

  if (hasHello && hasWorld) {
    return {
      content: [
        {
          type: "text",
          text:
            `✅ Nice! Your function (${found.name}) returned:\n\n` +
            `    ${JSON.stringify(result)}\n\n` +
            "It contains both 'hello' and 'world' (case-insensitive), so this passes the exercise.",
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text:
          `⚠️ Your function (${found.name}) ran without errors and returned:\n\n` +
          `    ${JSON.stringify(result)}\n\n` +
          "However, I didn't see both 'hello' and 'world' in the string.\n" +
          "Try returning something like `\"Hello, world!\"`.",
      },
    ],
  };
}

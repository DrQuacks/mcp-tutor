import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import vm from "node:vm";

async function main() {
  const server = new McpServer({
    name: "mcp-tutor",
    version: "0.0.1",
  });

  server.registerTool(
    "tutor_echo",
    {
      description:
        "Echo back a message from the user (for testing the MCP server connection).",
      inputSchema: z.object({
        message: z
          .string()
          .describe(
            "Any message you want the tutor server to echo back."
          ),
      }),
    },
    async ({ message }) => ({
      content: [
        {
          type: "text",
          text: `Tutor server received: "${message}". This proves the MCP plumbing works.`,
        },
      ],
    })
  );

    // Tool #2: prompt the user to write a JS hello world function
  server.registerTool(
    "tutor_js_hello_prompt",
    {
      description:
        "Gives the user an exercise: write a JavaScript helloWorld() function.",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [
        {
          type: "text",
          text: [
            "Exercise: Write a JavaScript function named helloWorld.",
            "",
            "Requirements:",
            "1. It should be a function called `helloWorld` (or a default export that is a function).",
            "2. It should take no arguments.",
            '3. When called, it should return a string that contains the words "hello" and "world" (case-insensitive).',
            "",
            "Example shapes that are acceptable:",
            "  function helloWorld() {",
            '    return "Hello, world!";',
            "  }",
            "",
            "or:",
            "  module.exports = function helloWorld() {",
            '    return "hello world";',
            "  };",
            "",
            "Once you’ve written your function, call the `tutor_js_hello_check` tool with your code as a string.",
          ].join("\n"),
        },
      ],
    })
  );

    // Tool #3: check the user's hello world function
  server.registerTool(
    "tutor_js_hello_check",
    {
      description:
        "Checks a JavaScript hello world function the user has written.",
      inputSchema: z.object({
        code: z
          .string()
          .describe(
            "The JavaScript code defining your hello world function. For example, a function helloWorld() or a default-exported function."
          ),
      }),
    },
    async ({ code }) => {
      // Prepare a sandboxed context
      const sandbox: any = {
        module: { exports: {} },
        exports: {},
        console, // allow console.log in their code
      };

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
  );

    // Tool: run arbitrary JS solution code + test code together in a sandbox
  server.registerTool(
    "tutor_js_run_with_tests",
    {
      description:
        "Runs JavaScript solution code together with test code in a sandbox and reports whether tests passed.",
      inputSchema: z.object({
        solutionCode: z
          .string()
          .describe(
            "The student's JavaScript solution code. This is evaluated first in a sandbox."
          ),
        testCode: z
          .string()
          .describe(
            "JavaScript test code that assumes the solution has been loaded, and throws errors if tests fail."
          ),
      }),
    },
    async ({ solutionCode, testCode }) => {
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
  );

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("[mcp-tutor] MCP server started on stdio");
}

main().catch((err) => {
  console.error("[mcp-tutor] Fatal error:", err);
  process.exit(1);
});
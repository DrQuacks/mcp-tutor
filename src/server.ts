import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import vm from "node:vm";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, Browser } from "playwright";
import type { ViteDevServer } from "vite";

const ENV_ROOT = path.join(process.cwd(), "environments");
const NODE_ENV_ROOT = path.join(ENV_ROOT, "node");
const REACT_ENV_ROOT = path.join(ENV_ROOT, "react", "template");
const EXERCISES_ROOT = path.join(process.cwd(), "exercises");

// Singleton Vite server management
let viteServer: ViteDevServer | null = null;
let viteServerPort = 5173;

async function getOrStartViteServer(): Promise<{ server: ViteDevServer; url: string }> {
  if (viteServer) {
    return { server: viteServer, url: `http://localhost:${viteServerPort}` };
  }

  // Dynamically import vite to avoid issues if not installed
  const { createServer } = await import("vite");
  
  viteServer = await createServer({
    root: REACT_ENV_ROOT,
    server: {
      port: viteServerPort,
      strictPort: false, // Allow using different port if 5173 is taken
    },
    logLevel: "error", // Reduce noise in logs
  });

  await viteServer.listen();
  viteServerPort = viteServer.config.server.port!;
  
  const url = `http://localhost:${viteServerPort}`;
  console.error(`[mcp-tutor] Vite dev server started at ${url}`);
  
  return { server: viteServer, url };
}

async function stopViteServer(): Promise<void> {
  if (viteServer) {
    await viteServer.close();
    viteServer = null;
    console.error("[mcp-tutor] Vite dev server stopped");
  }
}

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



  // Tool: React exercise prompt - shows requirements and creates starter file
  server.registerTool(
    "tutor_react_exercise_prompt",
    {
      description:
        "Gives the user a React exercise by showing requirements and creating a starter file. Does NOT reveal the solution.",
      inputSchema: z.object({
        exerciseId: z
          .string()
          .describe(
            "The ID of the exercise to load, e.g. 'react-counter'."
          ),
      }),
    },
    async ({ exerciseId }) => {
      const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);

      let exerciseData: any;
      try {
        const content = await fs.readFile(exercisePath, "utf8");
        exerciseData = JSON.parse(content);
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Exercise '${exerciseId}' not found or invalid.`,
            },
          ],
        };
      }

      // Create the starter file
      const envRoot = exerciseData.environment === "node" ? NODE_ENV_ROOT : REACT_ENV_ROOT;
      const filePath = path.join(envRoot, exerciseData.filePath);

      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, exerciseData.starterCode, "utf8");
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to create starter file: ${err?.message ?? String(err)}`,
            },
          ],
        };
      }

      // Build the response (NO solution code)
      const lines: string[] = [];
      lines.push(`# ${exerciseData.title}`);
      lines.push("");
      lines.push(exerciseData.description);
      lines.push("");
      lines.push("## Requirements:");
      for (const req of exerciseData.requirements) {
        lines.push(`- ${req}`);
      }
      lines.push("");
      lines.push(`📁 Starter file created at: \`${exerciseData.filePath}\``);
      lines.push("");
      lines.push("💡 **Hints:**");
      for (const hint of exerciseData.hints) {
        lines.push(`- ${hint}`);
      }
      lines.push("");
      lines.push(`When you're ready, use the \`tutor_react_check_solution\` tool with exerciseId: "${exerciseId}" to test your solution.`);

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

  // Tool: React check solution - tests student's code with browser
  server.registerTool(
    "tutor_react_check_solution",
    {
      description:
        "Tests the student's React solution against the exercise test cases using a real browser.",
      inputSchema: z.object({
        exerciseId: z
          .string()
          .describe(
            "The ID of the exercise to test, e.g. 'react-counter'."
          ),
        headless: z
          .boolean()
          .optional()
          .describe(
            "Whether to run browser in headless mode. Set to false to watch tests run visually. Default: true"
          ),
      }),
    },
    async ({ exerciseId, headless = true }) => {
      const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);

      let exerciseData: any;
      try {
        const content = await fs.readFile(exercisePath, "utf8");
        exerciseData = JSON.parse(content);
      } catch (err: any) {
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
      const envRoot = exerciseData.environment === "node" ? NODE_ENV_ROOT : REACT_ENV_ROOT;
      const solutionPath = path.join(envRoot, exerciseData.filePath);

      try {
        await fs.access(solutionPath);
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Solution file not found at ${exerciseData.filePath}. Did you create the file?`,
            },
          ],
        };
      }

      let browser: Browser | undefined;
      
      try {
        // Start Vite server (reuses existing if already running)
        const { url } = await getOrStartViteServer();
        
        // Launch browser
        browser = await chromium.launch({ 
          headless,
          slowMo: headless ? 0 : 100, // Slow down actions in headed mode for visibility
        });
        
        const context = await browser.newContext();
        const page = await context.newPage();

        // Navigate to test harness with exercise component
        // Extract component name: 'react-counter' -> 'Counter'
        const componentName = exerciseId
          .replace('react-', '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
        
        const testUrl = `${url}/test-harness.html?exercise=${componentName}`;
        await page.goto(testUrl, { waitUntil: 'networkidle' });

        // Wait for component to render
        await page.waitForTimeout(500);

        // Check for error message in test harness
        const errorDiv = await page.locator('#error.show');
        if (await errorDiv.count() > 0) {
          const errorText = await errorDiv.textContent();
          return {
            content: [
              {
                type: "text",
                text: `❌ Failed to load component:\n${errorText}`,
              },
            ],
          };
        }

        // Run browser tests
        const testResults: Array<{ name: string; passed: boolean; error?: string }> = [];
        
        for (const test of exerciseData.browserTests) {
          try {
            // Reload page before each test for isolation
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(300);

            // Handle different test formats
            if (test.actions) {
              // Multiple actions test
              for (const action of test.actions) {
                if (action.action === 'click') {
                  await page.locator(action.selector).click();
                  await page.waitForTimeout(100);
                }
              }
            } else if (test.action === 'click') {
              // Single click action
              await page.locator(test.selector).click();
              await page.waitForTimeout(100);
            }

            // Check assertion
            if (test.then) {
              const element = page.locator(test.then.selector).first();
              const text = await element.textContent();
              
              if (test.then.contains) {
                if (!text?.includes(test.then.contains)) {
                  throw new Error(`Expected text to contain "${test.then.contains}", but got "${text}"`);
                }
              } else if (test.then.expected) {
                if (text?.trim() !== test.then.expected) {
                  throw new Error(`Expected "${test.then.expected}", but got "${text}"`);
                }
              }
            } else if (test.expected) {
              // Direct assertion without action
              const element = page.locator(test.selector).first();
              const text = await element.textContent();
              
              if (!text?.includes(test.expected)) {
                throw new Error(`Expected text to contain "${test.expected}", but got "${text}"`);
              }
            }

            testResults.push({ name: test.name, passed: true });
          } catch (err: any) {
            testResults.push({ 
              name: test.name, 
              passed: false, 
              error: err.message 
            });
          }
        }

        await browser.close();

        // Format results
        const allPassed = testResults.every(t => t.passed);
        const lines: string[] = [];

        if (allPassed) {
          lines.push(`✅ Excellent! All ${testResults.length} tests passed for ${exerciseData.title}!`);
          lines.push("");
          lines.push("Tests run:");
          for (const test of testResults) {
            lines.push(`  ✅ ${test.name}`);
          }
        } else {
          lines.push(`❌ Some tests failed for ${exerciseData.title}`);
          lines.push("");
          lines.push("Test results:");
          for (const test of testResults) {
            if (test.passed) {
              lines.push(`  ✅ ${test.name}`);
            } else {
              lines.push(`  ❌ ${test.name}`);
              if (test.error) {
                lines.push(`     ${test.error}`);
              }
            }
          }
          lines.push("");
          lines.push(`💡 Need help? Use \`tutor_react_show_solution\` with exerciseId: "${exerciseId}" to see a working solution.`);
        }

        return {
          content: [
            {
              type: "text",
              text: lines.join("\n"),
            },
          ],
        };

      } catch (err: any) {
        if (browser) {
          await browser.close();
        }
        
        return {
          content: [
            {
              type: "text",
              text: `❌ Error running tests: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: React show solution - reveals complete solution when explicitly requested
  server.registerTool(
    "tutor_react_show_solution",
    {
      description:
        "Shows the complete solution code for a React exercise. Only use this when the student explicitly asks for the solution.",
      inputSchema: z.object({
        exerciseId: z
          .string()
          .describe(
            "The ID of the exercise to show solution for, e.g. 'react-counter'."
          ),
      }),
    },
    async ({ exerciseId }) => {
      const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);

      let exerciseData: any;
      try {
        const content = await fs.readFile(exercisePath, "utf8");
        exerciseData = JSON.parse(content);
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Exercise '${exerciseId}' not found or invalid.`,
            },
          ],
        };
      }

      const lines: string[] = [];
      lines.push(`# Solution for ${exerciseData.title}`);
      lines.push("");
      lines.push("Here's a working solution:");
      lines.push("");
      lines.push("```jsx");
      lines.push(exerciseData.solutionCode);
      lines.push("```");
      lines.push("");
      lines.push("You can copy this into your file or study it to understand the approach.");

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
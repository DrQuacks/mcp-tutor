import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import vm from "node:vm";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, Browser } from "playwright";
import type { ViteDevServer } from "vite";

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

const ENV_ROOT = path.join(process.cwd(), "environments");
const NODE_ENV_ROOT = path.join(ENV_ROOT, "node");
const REACT_ENV_ROOT = path.join(ENV_ROOT, "react", "template");
const EXERCISES_ROOT = path.join(process.cwd(), "exercises");
const PROGRESS_FILE = path.join(process.cwd(), "user_progress.json");

// Progress tracking types
interface ExerciseAttempt {
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

interface UserProgress {
  exercises: ExerciseAttempt[];
}

// Progress tracking functions
async function loadProgress(): Promise<UserProgress> {
  try {
    const content = await fs.readFile(PROGRESS_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    // File doesn't exist yet, return empty progress
    return { exercises: [] };
  }
}

async function saveProgress(progress: UserProgress): Promise<void> {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf8");
}

async function recordAttempt(
  exerciseId: string,
  title: string,
  environment: string,
  passed: boolean,
  testsPassed: number,
  testsTotal: number,
  hintsUsed: number = 0,
  solutionViewed: boolean = false
): Promise<void> {
  const progress = await loadProgress();
  progress.exercises.push({
    exerciseId,
    title,
    environment,
    passed,
    date: new Date().toISOString(),
    testsPassed,
    testsTotal,
    hintsUsed,
    solutionViewed,
  });
  await saveProgress(progress);
}

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
        "Gives the user a React exercise by showing requirements and creating a starter file (TypeScript .tsx by default). Does NOT reveal the solution.",
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

      // Create the starter file with embedded requirements
      const envRoot = exerciseData.environment === "node" ? NODE_ENV_ROOT : REACT_ENV_ROOT;
      const filePath = path.join(envRoot, exerciseData.filePath);

      // Build starter code with JSDoc-style header
      let starterCodeWithHeader = `/**\n * ${exerciseData.title}\n * \n`;
      
      // Add brief description (first line or two)
      const descLines = exerciseData.description.split('\n');
      const briefDesc = descLines[0];
      starterCodeWithHeader += ` * ${briefDesc}\n * \n`;
      
      // Add requirements
      starterCodeWithHeader += ` * Requirements:\n`;
      for (const req of exerciseData.requirements) {
        starterCodeWithHeader += ` * - ${req}\n`;
      }
      starterCodeWithHeader += ` */\n\n`;
      
      // Append the actual starter code
      starterCodeWithHeader += exerciseData.starterCode;

      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, starterCodeWithHeader, "utf8");
        
        // For React exercises, update App.tsx to import this component
        if (exerciseData.environment === "react") {
          const appPath = path.join(REACT_ENV_ROOT, "src", "App.tsx");
          const componentName = path.basename(exerciseData.filePath, path.extname(exerciseData.filePath));
          const appContent = `import './App.css'
import ${componentName} from './exercises/${componentName}'

function App() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>React Exercise: ${exerciseData.title}</h1>
      <${componentName} />
    </div>
  )
}

export default App
`;
          await fs.writeFile(appPath, appContent, "utf8");
        }
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
      
      // Recommend appropriate test tool based on environment
      const checkTool = exerciseData.environment === "node" 
        ? "tutor_node_check_solution" 
        : "tutor_react_check_solution";
      lines.push(`When you're ready, use the \`${checkTool}\` tool with exerciseId: "${exerciseId}" to test your solution.`);

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

  // Tool: Node.js check solution - tests student's Node.js code
  server.registerTool(
    "tutor_node_check_solution",
    {
      description:
        "Tests the student's Node.js solution against the exercise test cases. ⚠️ CRITICAL: NEVER edit the student's exercise solution files. Only report test results. If tests fail, provide hints or show the solution, but DO NOT modify student code.",
      inputSchema: z.object({
        exerciseId: z
          .string()
          .describe(
            "The ID of the exercise to test, e.g. 'node-sum-array'."
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
      const testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

      for (const test of exerciseData.tests) {
        try {
          const sandbox: any = {
            module: { exports: {} },
            exports: {},
            console,
          };

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
              lines.push(`     Error: ${test.error}`);
            }
          }
        }
        lines.push("");
        lines.push(`Would you like a hint about what might be wrong? Let me know and I can provide more specific guidance.`);
        lines.push(`Or use \`tutor_node_show_solution\` with exerciseId: "${exerciseId}" to see the full solution.`);
      }

      // Record attempt for progress tracking
      await recordAttempt(
        exerciseId,
        exerciseData.title,
        exerciseData.environment,
        allPassed,
        testResults.filter(t => t.passed).length,
        testResults.length
      );

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

  // Tool: Node.js show solution
  server.registerTool(
    "tutor_node_show_solution",
    {
      description:
        "Shows the complete solution code for a Node.js exercise. Only use this when the student explicitly asks for the solution.",
      inputSchema: z.object({
        exerciseId: z
          .string()
          .describe(
            "The ID of the exercise to show solution for, e.g. 'node-sum-array'."
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
      lines.push("```javascript");
      lines.push(exerciseData.solutionCode);
      lines.push("```");
      lines.push("");
      lines.push("You can copy this into your file or study it to understand the approach.");
      lines.push("");
      lines.push("💡 Note: Viewing the solution will be recorded in your progress.");

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
        "Tests the student's React solution against the exercise test cases using a real browser. IMPORTANT: The page reloads before each test for isolation, so each test starts with a fresh component state. When creating browserTests in exercise JSON files, ensure each test is self-contained and does not rely on state from previous tests.\n\nSupported test formats:\n1. Element existence: { name: string, selector: string, exists: boolean }\n2. Text content check: { name: string, selector: string, expected: string } - checks if text contains expected\n3. Click action: { name: string, selector: string, action: 'click', then: { selector: string, expected?: string, contains?: string, exists?: boolean } }\n4. Type action: { name: string, selector: string, action: 'type', value: string, then: { selector: string, expected?: string, contains?: string, exists?: boolean } }\n5. Multiple actions: { name: string, actions: Array<{selector: string, action: 'click'|'type', value?: string}>, then: { selector: string, expected?: string, contains?: string, exists?: boolean } }\n\nDo NOT use: count, fill, getStyle, or any other action types - they are not supported.\n\n⚠️ CRITICAL: NEVER edit the student's exercise solution files. Only report test results. If tests fail, provide hints or show the solution, but DO NOT modify student code.",
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
    async ({ exerciseId, headless = false }) => {
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
        
        // Create two separate contexts so they open as separate windows
        const progressContext = await browser.newContext({
          viewport: { width: 400, height: 600 }
        });
        const testContext = await browser.newContext({
          viewport: { width: 1200, height: 800 }
        });
        
        // Create progress window - a separate window for test progress UI
        const progressPage = await progressContext.newPage();
        
        const testNames = exerciseData.browserTests.map((t: any) => t.name);
        
        // Initialize progress window with HTML
        await progressPage.setContent(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Test Progress</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: system-ui, -apple-system, sans-serif;
                background: #f5f5f5;
              }
              h1 {
                margin: 0 0 20px 0;
                font-size: 20px;
                color: #333;
              }
              .test-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              .test-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                background: white;
                border: 2px solid transparent;
                transition: all 0.2s;
              }
              .test-item.running {
                background: #fff3cd;
                border-color: #ffc107;
                font-weight: 600;
              }
              .test-icon {
                font-size: 24px;
                min-width: 30px;
                text-align: center;
              }
              .test-name {
                flex: 1;
                font-size: 14px;
                color: #666;
              }
              .test-name.passed {
                color: #22c55e;
                text-decoration: line-through;
              }
              .test-name.failed {
                color: #ef4444;
                text-decoration: line-through;
              }
              .test-status {
                font-size: 12px;
                color: #f59e0b;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <h1>Test Progress</h1>
            <div class="test-list" id="test-list"></div>
            <script>
              window.updateProgress = function(currentIndex, results) {
                const testList = document.getElementById('test-list');
                const tests = ${JSON.stringify(testNames)};
                
                testList.innerHTML = tests.map((name, i) => {
                  const isRunning = i === currentIndex;
                  const isPending = i > currentIndex;
                  const result = results[i];
                  const isPassed = result?.passed === true;
                  const isFailed = result?.passed === false;
                  
                  let icon = '⏸️';
                  let statusClass = '';
                  if (isPassed) {
                    icon = '✅';
                    statusClass = 'passed';
                  } else if (isFailed) {
                    icon = '❌';
                    statusClass = 'failed';
                  }
                  
                  return \`
                    <div class="test-item \${isRunning ? 'running' : ''}">
                      <div class="test-icon">\${icon}</div>
                      <div class="test-name \${statusClass}">\${name}</div>
                      \${isRunning ? '<div class="test-status">▶ Running</div>' : ''}
                    </div>
                  \`;
                }).join('');
              };
              
              // Initialize with all pending
              window.updateProgress(-1, []);
            </script>
          </body>
          </html>
        `);
        
        const updateProgress = async (currentIndex: number, results: Array<{passed: boolean}>) => {
          await progressPage.evaluate(
            ({ index, testResults }) => {
              (window as any).updateProgress(index, testResults);
            },
            { index: currentIndex, testResults: results }
          );
        };
        
        // Create test execution page in separate window
        const page = await testContext.newPage();

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
        
        for (let i = 0; i < exerciseData.browserTests.length; i++) {
          const test = exerciseData.browserTests[i];
          
          try {
            // Update progress window before starting test
            await updateProgress(i, testResults);
            
            // Reload page before each test for isolation
            // CRITICAL: Each test runs with a fresh component - no state persists between tests
            // When writing browserTests in exercise JSON, each test must be self-contained
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(300);

            // Handle different test formats
            if (test.actions) {
              // Multiple actions test
              for (const action of test.actions) {
                if (action.action === 'click') {
                  await page.locator(action.selector).click();
                  await page.waitForTimeout(100);
                } else if (action.action === 'type') {
                  await page.locator(action.selector).type(action.value);
                  await page.waitForTimeout(100);
                }
              }
            } else if (test.action === 'click') {
              // Single click action
              await page.locator(test.selector).click();
              await page.waitForTimeout(100);
            } else if (test.action === 'type') {
              // Single type action
              await page.locator(test.selector).type(test.value);
              await page.waitForTimeout(100);
            }

            // Check assertion
            if (test.then) {
              const element = page.locator(test.then.selector).first();
              
              // Check if we're testing for element existence/non-existence
              if (test.then.exists !== undefined) {
                const count = await page.locator(test.then.selector).count();
                const exists = count > 0;
                if (exists !== test.then.exists) {
                  throw new Error(`Expected element to ${test.then.exists ? 'exist' : 'not exist'}, but it ${exists ? 'exists' : 'does not exist'}`);
                }
              } else {
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
              }
            } else if (test.expected) {
              // Direct assertion without action
              const element = page.locator(test.selector).first();
              const text = await element.textContent();
              
              if (!text?.includes(test.expected)) {
                throw new Error(`Expected text to contain "${test.expected}", but got "${text}"`);
              }
            } else if (test.exists !== undefined) {
              // Check if element exists or not (for conditionally rendered elements)
              const count = await page.locator(test.selector).count();
              const exists = count > 0;
              if (exists !== test.exists) {
                throw new Error(`Expected element to ${test.exists ? 'exist' : 'not exist'}, but it ${exists ? 'exists' : 'does not exist'}`);
              }
            }

            testResults.push({ name: test.name, passed: true });
            
            // Update progress window with success
            await updateProgress(i, testResults);
            
            // Pause to see the result
            await page.waitForTimeout(headless ? 0 : 800);
            
          } catch (err: any) {
            testResults.push({ 
              name: test.name, 
              passed: false, 
              error: err.message 
            });
            
            // Update progress window with failure
            await updateProgress(i, testResults);
            
            // Pause to see the error
            await page.waitForTimeout(headless ? 0 : 800);
          }
        }

        // Final update to show all tests complete
        await updateProgress(testResults.length - 1, testResults);
        
        // Keep browser open briefly to see final results
        if (!headless) {
          await page.waitForTimeout(2000);
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
                lines.push(`     Error: ${test.error}`);
              }
            }
          }
          lines.push("");
          lines.push(`Would you like a hint about what might be wrong? Let me know and I can provide more specific guidance.`);
          lines.push(`Or use \`tutor_react_show_solution\` with exerciseId: "${exerciseId}" to see the full solution.`);
        }

        // Record attempt for progress tracking
        await recordAttempt(
          exerciseId,
          exerciseData.title,
          exerciseData.environment,
          allPassed,
          testResults.filter(t => t.passed).length,
          testResults.length
        );

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

  // Tool: Get hint - provides progressive hints
  server.registerTool(
    "tutor_get_hint",
    {
      description: "Provides progressive, targeted hints for the current exercise without revealing the solution. Reads the student's code to give specific guidance. Use this when the student asks for help or is stuck. ⚠️ CRITICAL: This tool only provides hints - it does NOT and MUST NOT edit the student's exercise files.",
      inputSchema: z.object({
        exerciseId: z.string().describe("The ID of the exercise the student is working on"),
        hintLevel: z.enum(["gentle", "specific", "detailed"]).optional().describe("gentle: nudge in right direction, specific: point out exact issue, detailed: explain concept. Default: gentle"),
      }),
    },
    async ({ exerciseId, hintLevel = "gentle" }) => {
      const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);
      
      let exerciseData: any;
      try {
        const content = await fs.readFile(exercisePath, "utf8");
        exerciseData = JSON.parse(content);
      } catch (err: any) {
        return {
          content: [{
            type: "text",
            text: `❌ Exercise '${exerciseId}' not found.`,
          }],
        };
      }

      // Read student's current code
      const envRoot = exerciseData.environment === "node" ? NODE_ENV_ROOT : REACT_ENV_ROOT;
      const filePath = path.join(envRoot, exerciseData.filePath);
      
      let studentCode = "";
      try {
        studentCode = await fs.readFile(filePath, "utf8");
      } catch (err: any) {
        return {
          content: [{
            type: "text",
            text: `📝 I don't see your code file yet. Make sure you've created the file at: ${exerciseData.filePath}`,
          }],
        };
      }

      // Analyze the code and provide hints based on level
      const lines: string[] = [];
      lines.push(`💡 **Hint for ${exerciseData.title}** (${hintLevel} level)`);
      lines.push("");
      
      if (hintLevel === "gentle") {
        lines.push("Let me guide you with some questions to think about:");
        lines.push("");
        lines.push("1. Look at the requirements - which ones have you completed?");
        lines.push("2. Are all the necessary elements present in your JSX?");
        lines.push("3. Check the hints section in the exercise description for technical details");
        lines.push("");
        lines.push("💬 Ask for a 'specific' hint if you need me to point out exact issues.");
      } else if (hintLevel === "specific") {
        lines.push("Let me point out some specific things to check:");
        lines.push("");
        
        // Check for common issues based on exercise type
        if (exerciseData.environment === "react") {
          if (!studentCode.includes("useState")) {
            lines.push("❗ I don't see `useState` in your code. You need it for state management.");
          }
          if (studentCode.match(/<input[^>]*>[^<]*<\/input>/)) {
            lines.push("❗ Your input element should be self-closing: `<input />` not `<input></input>`");
          }
          if (exerciseId.includes("input") || exerciseId.includes("text")) {
            if (!studentCode.includes("value=")) {
              lines.push("❗ For a controlled input, you need a `value` prop connected to state");
            }
            if (!studentCode.includes("onChange")) {
              lines.push("❗ You need an `onChange` handler to update state when the user types");
            }
          }
        }
        
        lines.push("");
        lines.push("💬 Ask for a 'detailed' hint if you need concept explanations.");
      } else if (hintLevel === "detailed") {
        lines.push("Let me explain the key concepts:");
        lines.push("");
        
        // Provide relevant hints from the exercise
        if (exerciseData.hints && exerciseData.hints.length > 0) {
          lines.push("**Key concepts:**");
          for (let i = 0; i < Math.min(2, exerciseData.hints.length); i++) {
            lines.push(`- ${exerciseData.hints[i]}`);
          }
        }
        
        lines.push("");
        lines.push("**What to focus on:**");
        // Show first 2-3 requirements
        for (let i = 0; i < Math.min(3, exerciseData.requirements.length); i++) {
          lines.push(`${i + 1}. ${exerciseData.requirements[i]}`);
        }
        
        lines.push("");
        lines.push("💬 If you're still stuck, you can ask to see the solution with `tutor_show_solution`.");
      }

      return {
        content: [{
          type: "text",
          text: lines.join("\n"),
        }],
      };
    }
  );

  server.registerTool(
    "tutor_view_progress",
    {
      description: "Shows your exercise progress history and statistics.",
      inputSchema: z.object({}),
    },
    async () => {
      const progress = await loadProgress();
      
      if (progress.exercises.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No exercises attempted yet. Try an exercise to start tracking your progress!"
          }]
        };
      }
      
      const lines: string[] = [];
      lines.push("# Your Progress");
      lines.push("");
      
      // Group by exercise
      const byExercise = new Map<string, ExerciseAttempt[]>();
      for (const attempt of progress.exercises) {
        if (!byExercise.has(attempt.exerciseId)) {
          byExercise.set(attempt.exerciseId, []);
        }
        byExercise.get(attempt.exerciseId)!.push(attempt);
      }
      
      // Summary stats
      const totalAttempts = progress.exercises.length;
      const passed = progress.exercises.filter(a => a.passed).length;
      const uniqueExercises = byExercise.size;
      
      lines.push(`📊 **Summary:**`);
      lines.push(`- Total attempts: ${totalAttempts}`);
      lines.push(`- Passed: ${passed} (${Math.round(passed/totalAttempts*100)}%)`);
      lines.push(`- Unique exercises: ${uniqueExercises}`);
      lines.push("");
      
      // Recent attempts
      lines.push("## Recent Attempts:");
      const recent = progress.exercises.slice(-10).reverse();
      for (const attempt of recent) {
        const date = new Date(attempt.date).toLocaleDateString();
        const emoji = attempt.passed ? "✅" : "❌";
        lines.push(`${emoji} ${attempt.title} (${attempt.environment}) - ${date}`);
        lines.push(`   ${attempt.testsPassed}/${attempt.testsTotal} tests passed`);
        
        // Show help usage if any
        const helpInfo: string[] = [];
        if (attempt.hintsUsed > 0) {
          helpInfo.push(`${attempt.hintsUsed} hint${attempt.hintsUsed > 1 ? 's' : ''}`);
        }
        if (attempt.solutionViewed) {
          helpInfo.push('solution viewed');
        }
        if (helpInfo.length > 0) {
          lines.push(`   (${helpInfo.join(', ')})`);
        }
      }
      
      return {
        content: [{
          type: "text",
          text: lines.join("\n")
        }]
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
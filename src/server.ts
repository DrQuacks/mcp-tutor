import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Tool handlers
import { tutorEcho } from "./tools/tutorEcho.js";
import { tutorJsHelloPrompt } from "./tools/tutorJsHelloPrompt.js";
import { tutorJsHelloCheck } from "./tools/tutorJsHelloCheck.js";
import { tutorJsRunWithTests } from "./tools/tutorJsRunWithTests.js";
import { tutorReactExercisePrompt } from "./tools/tutorReactExercisePrompt.js";
import { tutorNodeCheckSolution } from "./tools/tutorNodeCheckSolution.js";
import { tutorNodeShowSolution } from "./tools/tutorNodeShowSolution.js";
import { tutorReactCheckSolution } from "./tools/tutorReactCheckSolution.js";
import { tutorReactShowSolution } from "./tools/tutorReactShowSolution.js";
import { tutorGetHint } from "./tools/tutorGetHint.js";
import { tutorViewProgress } from "./tools/tutorViewProgress.js";

/**
 * EXERCISE CREATION GUIDELINES
 * 
 * When creating exercise JSON files in the exercises/ folder, follow these critical rules:
 * 
 * 1. TEST ISOLATION:
 *    - The page RELOADS before EACH test for complete isolation
 *    - Tests do NOT share state - each test starts with a fresh component
 *    - If a test needs multiple items/interactions, include ALL actions in that ONE test
 *    - WRONG: Test 1 adds "A", Test 2 expects "A" and "B" 
 *    - RIGHT: Test 1 adds "A", Test 2 adds both "A" and "B" then checks for both
 * 
 * 2. TEST COVERAGE:
 *    - Test ALL interactive features, not just presence of elements
 *    - For stateful interactions, test BOTH directions (on/off, add/remove, etc.)
 *    - Example: If clicking toggles something, test clicking once AND clicking twice
 *    - Cover edge cases: empty states, multiple items, state changes
 * 
 * 3. SUPPORTED TEST ACTIONS:
 *    - Only use: 'click' and 'type' actions
 *    - Do NOT use: count, fill, getStyle, or other unsupported actions
 *    - Assertions: exists (boolean), expected (exact match), contains (partial match)
 * 
 * 4. TEST STRUCTURE EXAMPLES:
 *    Single element check:
 *      { "name": "Button exists", "selector": "button", "exists": true }
 *    
 *    Simple interaction:
 *      { "name": "Shows text", "selector": "input", "action": "type", "value": "Hello",
 *        "then": { "selector": "p", "contains": "Hello" } }
 *    
 *    Multiple actions (all in ONE test for isolation):
 *      { "name": "Toggle works", "actions": [
 *          { "selector": "button", "action": "click" },
 *          { "selector": "button", "action": "click" }
 *        ], "then": { "selector": "p", "expected": "Off" } }
 */

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
    async (params) => tutorEcho(params)
  );

  server.registerTool(
    "tutor_js_hello_prompt",
    {
      description:
        "Gives the user an exercise: write a JavaScript helloWorld() function.",
      inputSchema: z.object({}),
    },
    async () => tutorJsHelloPrompt()
  );

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
    async (params) => tutorJsHelloCheck(params)
  );

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
    async (params) => tutorJsRunWithTests(params)
  );

  server.registerTool(
    "tutor_react_exercise_prompt",
    {
      description:
        "Loads a React exercise and creates starter file for the student (TypeScript .tsx by default). Does NOT reveal the solution. By default, creates files in normal difficulty (no TODO comments). Use mode='easy' to include helpful TODO comments in the code.\n\n⚠️ PREREQUISITE: You must first create the exercise JSON file in exercises/ folder before calling this tool.\n\n📋 CRITICAL RULES for creating browserTests in the JSON file:\n\n1. TEST ISOLATION - Most common mistake!\n   • Page reloads before EVERY test (tests are completely isolated)\n   • Each test starts with fresh/empty component state\n   • Never assume state from previous tests exists\n   • Example mistake: Test 1 adds 'ItemA', Test 2 adds 'ItemB' expecting both to exist\n   • Correct approach: Test 2 must add BOTH 'ItemA' AND 'ItemB' if it needs both\n\n2. COMPREHENSIVE COVERAGE - Don't skip important behaviors!\n   • Test ALL interactive features, not just element presence\n   • For toggleable features, test BOTH states (on AND off)\n   • Example: If clicking adds strikethrough, test: click once (strikethrough on), click twice (strikethrough off)\n   • Test with multiple items if feature involves lists/collections\n\n3. SUPPORTED TEST ACTIONS - Use only these:\n   • Actions: 'click' and 'type' ONLY (no fill, count, getStyle, etc.)\n   • Assertions: 'exists' (boolean), 'expected' (exact text match), 'contains' (partial text match)\n   • Multi-action format: 'actions' array with multiple steps in ONE test",
      inputSchema: z.object({
        exerciseId: z
          .string()
          .describe(
            "The ID of the exercise to load, e.g. 'react-counter'."
          ),
        mode: z
          .enum(["normal", "easy"])
          .optional()
          .describe(
            "Difficulty mode. 'normal' (default): minimal starter code without TODO comments. 'easy': includes helpful TODO comments as hints in the code."
          ),
      }),
    },
    async (params) => tutorReactExercisePrompt(params)
  );

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
    async (params) => tutorNodeCheckSolution(params)
  );

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
    async (params) => tutorNodeShowSolution(params)
  );

  server.registerTool(
    "tutor_react_check_solution",
    {
      description:
        "Tests the student's React solution against the exercise test cases using a real browser. IMPORTANT: The page reloads before each test for isolation, so each test starts with a fresh component state. When creating browserTests in exercise JSON files, ensure each test is self-contained and does not rely on state from previous tests.\n\nSupported test formats:\n1. Element existence: { name: string, selector: string, exists: boolean }\n2. Text content check: { name: string, selector: string, expected: string } - checks if text contains expected\n3. Click action: { name: string, selector: string, action: 'click', then: { selector: string, expected?: string, contains?: string, exists?: boolean } }\n4. Type action: { name: string, selector: string, action: 'type', value: string, then: { selector: string, expected?: string, contains?: string, exists?: boolean } }\n5. Multiple actions: { name: string, actions: Array<{selector: string, action: 'click'|'type', value?: string}>, then: { selector: string, expected?: string, contains?: boolean } }\n\nDo NOT use: count, fill, getStyle, or any other action types - they are not supported.\n\n⚠️ CRITICAL RULES:\n1. NEVER edit the student's exercise solution files. Only report test results.\n2. When tests fail, explain WHAT behavior failed (e.g., 'the error message appears when it shouldn't') but DO NOT provide explicit code fixes.\n3. Point to the REQUIREMENT that wasn't met, not the specific line to change.\n4. Only provide explicit code if the student asks for a hint or solution using the hint/solution tools.\n5. Be pedagogical - guide the student to discover the fix themselves.",
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
    async (params) => tutorReactCheckSolution(params)
  );

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
    async (params) => tutorReactShowSolution(params)
  );

  server.registerTool(
    "tutor_get_hint",
    {
      description: "Provides progressive, targeted hints for the current exercise without revealing the solution. Reads the student's code to give specific guidance. Use this when the student asks for help or is stuck. ⚠️ CRITICAL: This tool only provides hints - it does NOT and MUST NOT edit the student's exercise files.",
      inputSchema: z.object({
        exerciseId: z.string().describe("The ID of the exercise the student is working on"),
        hintLevel: z.enum(["gentle", "specific", "detailed"]).optional().describe("gentle: nudge in right direction, specific: point out exact issue, detailed: explain concept. Default: gentle"),
      }),
    },
    async (params) => tutorGetHint(params)
  );

  server.registerTool(
    "tutor_view_progress",
    {
      description: "Shows your exercise progress history and statistics.",
      inputSchema: z.object({}),
    },
    async () => tutorViewProgress()
  );

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("[mcp-tutor] MCP server started on stdio");
}

main().catch((err) => {
  console.error("[mcp-tutor] Fatal error:", err);
  process.exit(1);
});

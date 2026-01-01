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
import { tutorStartTutorial } from "./tools/tutorStartTutorial.js";
import { tutorCheckTutorialStep } from "./tools/tutorCheckTutorialStep.js";
import { tutorAdvanceStep } from "./tools/tutorAdvanceStep.js";
import { tutorTutorialHint } from "./tools/tutorTutorialHint.js";
import { tutorExplainConcept } from "./tools/tutorExplainConcept.js";
import { tutorConnectPattern } from "./tools/tutorConnectPattern.js";
import { tutorValidateResponse } from "./tools/tutorValidateResponse.js";
import { tutorValidateTutorialJSON } from "./tools/tutorValidateTutorialJSON.js";
import { tutorRespondToStudent } from "./tools/tutorRespondToStudent.js";
import { tutorGenerateSessionState } from "./tools/tutorGenerateSessionState.js";
import { tutorValidateExerciseRequirements } from "./tools/tutorValidateExerciseRequirements.js";
import { tutorListReactTutorialStatuses } from "./tools/tutorListReactTutorialStatuses.js";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * EXERCISE CREATION GUIDELINES
 * ═══════════════════════════════════════════════════════════════════════
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
 * 
 * ═══════════════════════════════════════════════════════════════════════
 * TUTORIAL CREATION GUIDELINES
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * PHILOSOPHY: Tutorials teach concepts step-by-step with explanations and examples.
 * Unlike exercises (which test knowledge), tutorials BUILD knowledge incrementally.
 * 
 * KEY PRINCIPLES:
 * 
 * 1. CONCEPT BEFORE CODE
 *    - Always explain WHAT the concept is and WHY it exists before HOW to use it
 *    - Compare to alternatives ("unlike useState, useReducer is better when...")
 *    - Use plain language and analogies, not just technical jargon
 * 
 * 2. SHOW BEFORE ASK
 *    - Provide a COMPLETE generic example before asking student to implement
 *    - Example: Show a full reducer function before asking them to write one
 *    - Use the "codeExample" field to show syntax patterns
 * 
 * 3. TINY INCREMENTAL STEPS
 *    - Break concepts into the SMALLEST possible steps
 *    - Early steps should be trivial (import, define empty function, etc.)
 *    - Each step teaches ONE new thing and builds on previous steps
 *    - Don't combine multiple concepts in one step
 * 
 * 4. STEP PROGRESSION PATTERN
 *    Example for useReducer:
 *    Step 1: Explain concept + show generic syntax → import useReducer
 *    Step 2: Explain reducer function + show complete example → define empty reducer
 *    Step 3: Explain action types + show examples → implement actions in reducer
 *    Step 4: Explain useReducer call + show syntax → call useReducer in component
 *    Step 5: Explain dispatch + show usage → display state and add buttons
 *    Step 6: Practice: add new action type (building on learned concepts)
 * 
 * 5. EXPLANATION STRUCTURE (in each step's "explanation" field)
 *    - Paragraph 1: What is this concept? (definition)
 *    - Paragraph 2: Why does it exist? When should you use it?
 *    - Paragraph 3: How does it work? (high-level, no code yet)
 *    - Then: Show generic code example in "codeExample" field
 *    - Finally: Specific task in "task" field
 * 
 * 6. CODE EXAMPLE GUIDELINES
 *    - Use "codeExample" field to show GENERIC syntax patterns
 *    - Example should be complete and runnable (conceptually)
 *    - Add comments explaining each part
 *    - Don't show the exact solution - show the pattern they'll implement
 * 
 * 7. TASK CLARITY
 *    - Be explicit about WHERE to add code ("above your component", "inside the function")
 *    - Show the EXACT pattern expected when needed
 *    - Break complex tasks into numbered sub-tasks
 *    - Example: "1. Call useReducer with your counterReducer function\n2. Destructure to get count and dispatch"
 * 
 * 8. VALIDATION
 *    - Use "code-contains" for structural checks (checking for key patterns)
 *    - Be flexible - check for core concepts, not exact syntax
 *    - Example: Check for "import { useReducer }" not the exact quote style
 *    - Use "browser-test" for React interactivity validation
 * 
 * TUTORIAL JSON STRUCTURE:
 * {
 *   "title": "Tutorial Name",
 *   "description": "What the student will learn",
 *   "environment": "react" | "node",
 *   "filePath": "src/exercises/ComponentName.tsx",
 *   "starterCode": "Minimal starting code (empty component)",
 *   "steps": [
 *     {
 *       "stepNumber": 1,
 *       "title": "Step title (e.g., 'Import useReducer')",
 *       "explanation": "Thorough explanation of concept (3-4 paragraphs)",
 *       "codeExample": "// Generic example\nconst [state, dispatch] = useReducer(reducer, initialState)",
 *       "task": "Specific instructions for what to implement",
 *       "validation": { "type": "code-contains", "checks": ["pattern1", "pattern2"] },
 *       "hints": ["Progressive hints if student gets stuck"]
 *     }
 *   ]
 * }
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
        "Loads a React exercise and creates starter file for the student (TypeScript .tsx by default). Does NOT reveal the solution. By default, creates files in normal difficulty (no TODO comments). Use mode='easy' to include helpful TODO comments in the code.\n\n⚠️ PREREQUISITE: You must first create the exercise JSON file in exercises/ folder before calling this tool.\n\n📋 CRITICAL RULES for creating browserTests in the JSON file:\n\n1. TESTABLE REQUIREMENTS - Make Playwright selection deterministic!\n   • Include specific testable attributes in requirements (e.g., placeholder text, button text, labels)\n   • Example GOOD requirement: 'Display an input with placeholder \"Enter URL\" for the image URL'\n   • Example GOOD requirement: 'Include a button with text \"Add Image\" that adds the image'\n   • Example BAD requirement: 'Display an input for the image URL' (too vague - how to select it?)\n   • This allows using reliable selectors like input[placeholder='Enter URL'] or button:has-text('Add Image')\n   • Makes tests robust against different DOM structures while still allowing implementation freedom\n\n2. TEST ISOLATION - Most common mistake!\n   • Page reloads before EVERY test (tests are completely isolated)\n   • Each test starts with fresh/empty component state\n   • Never assume state from previous tests exists\n   • Example mistake: Test 1 adds 'ItemA', Test 2 adds 'ItemB' expecting both to exist\n   • Correct approach: Test 2 must add BOTH 'ItemA' AND 'ItemB' if it needs both\n\n3. COMPREHENSIVE COVERAGE - Don't skip important behaviors!\n   • Test ALL interactive features, not just element presence\n   • For toggleable features, test BOTH states (on AND off)\n   • Example: If clicking adds strikethrough, test: click once (strikethrough on), click twice (strikethrough off)\n   • Test with multiple items if feature involves lists/collections\n\n4. SUPPORTED TEST ACTIONS - Use only these:\n   • Actions: 'click' and 'type' ONLY (no fill, count, getStyle, etc.)\n   • Assertions: 'exists' (boolean), 'expected' (exact text match), 'contains' (partial text match), 'count' (number of elements)\n   • Multi-action format: 'actions' array with multiple steps in ONE test\n   • Playwright selectors: Use >> nth=N for indexed selection, text=MyText for text matching, or standard CSS selectors",
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
        "Tests the student's Node.js solution against the exercise test cases.\n\n🚫 ABSOLUTE PROHIBITION: NEVER edit the student's exercise files under ANY circumstances. NEVER show copy-paste solutions in your messages. Only report test results and guide their thinking. If student says 'continue' or 'next', only run tests - do NOT write code for them.\n\n⚠️ CRITICAL SAFEGUARD: After running tests, if ANY tests fail, you MUST call tutor_validate_response with your planned response BEFORE sending guidance to the student. This ensures you don't accidentally provide copy-paste solutions.",
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
        "Tests the student's React solution against the exercise test cases using a real browser. IMPORTANT: The page reloads before each test for isolation, so each test starts with a fresh component state. When creating browserTests in exercise JSON files, ensure each test is self-contained and does not rely on state from previous tests.\n\nSupported test formats:\n1. Element existence: { name: string, selector: string, exists: boolean }\n2. Text content check: { name: string, selector: string, expected: string } - checks if text contains expected\n3. Click action: { name: string, selector: string, action: 'click', then: { selector: string, expected?: string, contains?: string, exists?: boolean } }\n4. Type action: { name: string, selector: string, action: 'type', value: string, then: { selector: string, expected?: string, contains?: boolean } }\n5. Multiple actions: { name: string, actions: Array<{selector: string, action: 'click'|'type', value?: string}>, then: { selector: string, expected?: string, contains?: boolean } }\n\nDo NOT use: count, fill, getStyle, or any other action types - they are not supported.\n\n🚫 ABSOLUTE PROHIBITION - NEVER EDIT STUDENT FILES:\n1. NEVER edit the student's exercise solution files under ANY circumstances\n2. NEVER show copy-paste code solutions in your messages to the student\n3. When tests fail, explain WHAT behavior failed (e.g., 'the error message appears when it shouldn't')\n4. Point to the REQUIREMENT that wasn't met, not the specific line to change\n5. Only provide explicit code if student explicitly asks for hint/solution using those tools\n6. Be pedagogical - guide the student to discover the fix themselves\n7. If student says 'continue' or 'next', only run tests - do NOT implement code\n\n⚠️ CRITICAL SAFEGUARD: After running tests, if ANY tests fail, you MUST call tutor_validate_response with your planned response BEFORE sending guidance to the student. This ensures you don't accidentally provide copy-paste solutions.",
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

  server.registerTool(
    "tutor_generate_session_state",
    {
      description: "Generates a session state snapshot for easy context restoration in new chats. Analyzes current progress and creates a session_state.json file with current activity, next steps, and recent work. Use this before ending a session or when context window is getting large.",
      inputSchema: z.object({}),
    },
    async () => tutorGenerateSessionState()
  );

  server.registerTool(
    "tutor_start_tutorial",
    {
      description: "Starts or resumes a step-by-step tutorial. Returns JSON with tutorial content that you MUST present clearly to the user.\n\n⚠️ CRITICAL: After calling this tool, you MUST present the tutorial content in your response like this:\n\n---\n# 📚 Tutorial: [tutorialTitle]\n[tutorialDescription]\n\n**Progress:** Step [stepNumber] of [totalSteps]\n[If completedSteps exists: **Completed:** steps X, Y, Z]\n\n## Step [stepNumber]: [stepTitle]\n\n### 📖 What You'll Learn\n[explanation]\n\n[If codeExample exists:]\n### 💻 Generic Pattern\n```tsx\n[codeExample]\n```\n\n### ✏️ Your Task\n[task]\n\n📁 File: `[filePath]`\n---\n\nDO NOT just say 'the tutorial started' - present the actual content so it's visible!",
      inputSchema: z.object({
        tutorialId: z.string().describe("The ID of the tutorial to start, e.g., 'react-usereducer'"),
      }),
    },
    async (params) => tutorStartTutorial(params)
  );

  server.registerTool(
    "tutor_check_tutorial_step",
    {
      description: "Validates the current step of an active tutorial. ONLY checks if code meets requirements - does NOT provide explanations or guidance. Returns pass/fail with list of what's missing. If successful, automatically presents the next step. If unsuccessful, use OTHER tools (tutor_explain_concept, tutor_connect_pattern) to help the student.\n\n🚫 ABSOLUTE PROHIBITION: You must NEVER edit student exercise/tutorial files under ANY circumstances. This includes:\n- NEVER use replace_string_in_file, multi_replace_string_in_file, or create_file on student files\n- NEVER show copy-paste solutions in your messages\n- NEVER implement code changes when student says 'continue' or 'next step'\n- The ONLY time to edit is if student explicitly says 'write the code for me' or 'give me the solution'\n\nYour role is to VALIDATE (this tool), EXPLAIN (tutor_explain_concept), GUIDE (tutor_connect_pattern), and HINT (tutor_tutorial_hint). Let the student write the code.",
      inputSchema: z.object({
        tutorialId: z.string().describe("The ID of the tutorial being worked on"),
      }),
    },
    async (params) => tutorCheckTutorialStep(params)
  );

  server.registerTool(
    "tutor_advance_step",
    {
      description: "⚠️ INTERNAL USE ONLY - Called by the AI after validating student code to advance to the next tutorial step. DO NOT call this directly - it's automatically invoked after tutor_check_tutorial_step when validation passes.",
      inputSchema: z.object({
        tutorialId: z.string().describe("The ID of the tutorial being worked on"),
      }),
    },
    async (params) => tutorAdvanceStep(params)
  );

  server.registerTool(
    "tutor_explain_concept",
    {
      description: "Re-explains the concept of the current tutorial step. Shows the explanation, generic code example, and task from the tutorial. Use this when the student asks 'what is this step about?' or seems confused about the concept. This tool presents the tutorial content clearly without giving away the specific answer.\n\n🚫 NEVER edit student files or provide copy-paste solutions. Only explain concepts and show generic examples.",
      inputSchema: z.object({
        tutorialId: z.string().describe("The ID of the tutorial"),
      }),
    },
    async (params) => tutorExplainConcept(params)
  );

  server.registerTool(
    "tutor_connect_pattern",
    {
      description: "Helps the student connect the generic pattern to their specific task WITHOUT giving the answer. Shows what the tutorial is looking for and guides thinking about how to adapt the pattern. Use this when the student understands the concept but needs help applying it to their specific code. Does NOT provide copy-paste solutions.",
      inputSchema: z.object({
        tutorialId: z.string().describe("The ID of the tutorial"),
        studentQuestion: z.string().optional().describe("Optional: specific question the student asked"),
      }),
    },
    async (params) => tutorConnectPattern(params)
  );

  server.registerTool(
    "tutor_tutorial_hint",
    {
      description: "Provides progressive hints for the current tutorial step. Use this when the student is stuck after trying. Gives increasingly specific guidance without revealing the full solution.",
      inputSchema: z.object({
        tutorialId: z.string().describe("The ID of the tutorial"),
      }),
    },
    async (params) => tutorTutorialHint(params)
  );

  server.registerTool(
    "tutor_validate_response",
    {
      description: "🔴 MANDATORY: Validates your response before sending ANY tutorial/exercise-related guidance to students. You MUST call this tool BEFORE responding when:\n- Student asks a question about tutorial code\n- Student asks for clarification on requirements\n- You're explaining what the task means\n- You're discussing the current tutorial/exercise step\n- Responding to confusion or providing hints\n\nONLY exceptions:\n- User explicitly says 'give me the solution' or 'show me the answer'\n- Using the show solution tool\n\nThis validates that your response follows pedagogical rules (no copy-paste solutions, no exact answers). Pass in your planned response text, the tutorial/exercise ID, and current step number if applicable. The tool returns 'approved' or 'rejected' with specific feedback on violations.",
      inputSchema: z.object({
        responseText: z.string().describe("Your planned response text to validate before sending to the student"),
        tutorialOrExerciseId: z.string().describe("The tutorial or exercise ID (e.g., 'react-usereducer', 'react-counter')"),
        stepNumber: z.number().optional().describe("Current step number if in a multi-step tutorial"),
      }),
    },
    async (params) => tutorValidateResponse(params)
  );

  server.registerTool(
    "tutor_validate_tutorial_json",
    {
      description: "Validates a tutorial JSON file for copy-paste code violations in task descriptions. Can optionally auto-fix by removing violating code. Use this to clean tutorial files before using them with students.",
      inputSchema: z.object({
        tutorialId: z.string().describe("The tutorial ID (without 'tutorial-' prefix, e.g., 'react-usecallback')"),
        autoFix: z.boolean().optional().describe("If true, automatically removes copy-paste code and saves the cleaned tutorial. Default: false"),
      }),
    },
    async (params) => tutorValidateTutorialJSON(params)
  );

  server.registerTool(
    "tutor_respond_to_student",
    {
      description: "🔴 MANDATORY GATEWAY: Use this tool to respond to students during tutorials/exercises. This is the ONLY way to send responses when discussing tutorial code. Pass your draft response and it will automatically validate it before allowing you to send it. If you read tutorial JSON, student code, or receive task details from another tool, you MUST use this tool to respond. DO NOT respond directly - always use this gateway.",
      inputSchema: z.object({
        draftResponse: z.string().describe("Your complete draft response to the student"),
        tutorialOrExerciseId: z.string().describe("The tutorial or exercise ID (e.g., 'react-usecallback', 'react-counter')"),
        stepNumber: z.number().optional().describe("Current step number if in a multi-step tutorial"),
      }),
    },
    async (params) => tutorRespondToStudent(params)
  );

  server.registerTool(
    "tutor_validate_exercise_requirements",
    {
      description: tutorValidateExerciseRequirements.description,
      inputSchema: tutorValidateExerciseRequirements.inputSchema,
    },
    async (params) => tutorValidateExerciseRequirements.execute(params)
  );

  server.registerTool(
    "tutor_list_react_tutorial_statuses",
    {
      description: "Lists all React tutorial statuses for the user (not-started, in-progress, completed)",
      inputSchema: z.object({}),
    },
    async () => tutorListReactTutorialStatuses()
  );

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("[mcp-tutor] MCP server started on stdio");
}

main().catch((err) => {
  console.error("[mcp-tutor] Fatal error:", err);
  process.exit(1);
});

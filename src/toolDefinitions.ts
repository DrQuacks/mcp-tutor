import { z } from "zod";

// Tool handlers
import { tutorEcho } from "./tools/tutorEcho.js";
import { tutorJsHelloPrompt } from "./tools/tutorJsHelloPrompt.js";
import { tutorJsHelloCheck } from "./tools/tutorJsHelloCheck.js";
import { tutorReactExercisePrompt } from "./tools/tutorReactExercisePrompt.js";
import { tutorNodeCheckSolution } from "./tools/tutorNodeCheckSolution.js";
import { tutorNodeShowSolution } from "./tools/tutorNodeShowSolution.js";
import { tutorReactCheckSolution } from "./tools/tutorReactCheckSolution.js";
import { tutorReactShowSolution } from "./tools/tutorReactShowSolution.js";
import { tutorGetHint } from "./tools/tutorGetHint.js";
import { tutorViewProgress } from "./tools/tutorViewProgress.js";
import { tutorOverrideExerciseCompletion } from "./tools/tutorOverrideExerciseCompletion.js";
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
import { seniorDev_start_mode } from "./tools/seniorDev_start_mode.js";
import { seniorDev_analyze_skills } from "./tools/seniorDev_analyze_skills.js";
import { seniorDev_select_skills } from "./tools/seniorDev_select_skills.js";
import { seniorDev_generate_tutorial } from "./tools/seniorDev_generate_tutorial.js";
import { seniorDev_present_step } from "./tools/seniorDev_present_step.js";
import { seniorDev_check_step } from "./tools/seniorDev_check_step.js";
import { seniorDev_finalize_tutorial } from "./tools/seniorDev_finalize_tutorial.js";
import { seniorDev_abort_session } from "./tools/seniorDev_abort_session.js";
import { startViteDevServer } from "./tools/startViteDevServer.js";
import { startDummyBackend } from "./tools/startDummyBackend.js";

export type ToolDefinition = {
  name: string;
  role: ToolRole;
  description: string;
  inputSchema: z.ZodTypeAny;
  // Handlers always return a MCP content array wrapped in a Promise
  // but we keep this loose here to avoid over-coupling.
  handler: (params: any) => Promise<any> | any;
};

export type ToolRole =
  | "student"
  | "author"
  | "internal"
  | "infra"
  | "senior-dev";

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // --- Demo / sandbox tools ---
  {
    name: "tutor_echo",
    role: "infra",
    description: `
  Echo back a message from the user (for testing the MCP server connection).
  `.trim(),
    inputSchema: z.object({
      message: z
        .string()
        .describe("Any message you want the tutor server to echo back."),
    }),
    handler: async (params) => tutorEcho(params),
  },
  // --- JavaScript hello-world exercise tools ---
  {
    name: "tutor_js_hello_prompt",
    role: "student",
    description: `
  Gives the user an exercise: write a JavaScript helloWorld() function.
  `.trim(),
    inputSchema: z.object({}),
    handler: async () => tutorJsHelloPrompt(),
  },
  {
    name: "tutor_js_hello_check",
    role: "student",
    description: `
  Checks a JavaScript hello world function the user has written.
  `.trim(),
    inputSchema: z.object({
      code: z
        .string()
        .describe(
          "The JavaScript code defining your hello world function. For example, a function helloWorld() or a default-exported function."
        ),
    }),
    handler: async (params) => tutorJsHelloCheck(params),
  },
  // --- Exercise tools (React & Node) ---
  {
    name: "tutor_react_exercise_prompt",
    role: "student",
    description: `
  Loads a React exercise and creates starter file for the student (TypeScript .tsx by default). Does NOT reveal the solution.

  By default, creates files in normal difficulty (no TODO comments). Use mode='easy' to include helpful TODO comments in the code.

  ⚠️ PREREQUISITE: You must first create the exercise JSON file in exercises/ folder before calling this tool.

  📋 CRITICAL RULES for creating browserTests in the JSON file:

  1. TESTABLE REQUIREMENTS - Make Playwright selection deterministic!
    • Include specific testable attributes in requirements (e.g., placeholder text, button text, labels)
    • Example GOOD requirement: 'Display an input with placeholder "Enter URL" for the image URL'
    • Example GOOD requirement: 'Include a button with text "Add Image" that adds the image'
    • Example BAD requirement: 'Display an input for the image URL' (too vague - how to select it?)
    • This allows using reliable selectors like input[placeholder='Enter URL'] or button:has-text('Add Image')
    • Makes tests robust against different DOM structures while still allowing implementation freedom

  2. TEST ISOLATION - Most common mistake!
    • Page reloads before EVERY test (tests are completely isolated)
    • Each test starts with fresh/empty component state
    • Never assume state from previous tests exists
    • Example mistake: Test 1 adds 'ItemA', Test 2 adds 'ItemB' expecting both to exist
    • Correct approach: Test 2 must add BOTH 'ItemA' AND 'ItemB' if it needs both

  3. COMPREHENSIVE COVERAGE - Don't skip important behaviors!
    • Test ALL interactive features, not just element presence
    • For toggleable features, test BOTH states (on AND off)
    • Example: If clicking adds strikethrough, test: click once (strikethrough on), click twice (strikethrough off)
    • Test with multiple items if feature involves lists/collections

  4. SUPPORTED TEST ACTIONS - Use only these:
    • Actions: 'click' and 'type' ONLY (no fill, count, getStyle, etc.)
    • Assertions: 'exists' (boolean), 'expected' (exact text match), 'contains' (partial text match), 'count' (number of elements)
    • Multi-action format: 'actions' array with multiple steps in ONE test
    • Playwright selectors: Use >> nth=N for indexed selection, text=MyText for text matching, or standard CSS selectors
  `.trim(),
    inputSchema: z.object({
      exerciseId: z
        .string()
        .describe("The ID of the exercise to load, e.g. 'react-counter'."),
      mode: z
        .enum(["normal", "easy"])
        .optional()
        .describe(
          "Difficulty mode. 'normal' (default): minimal starter code without TODO comments. 'easy': includes helpful TODO comments as hints in the code."
        ),
      archiveExisting: z
        .boolean()
        .optional()
        .describe(
          "Whether to archive existing exercise files before writing the fresh starter file. Defaults to true."
        ),
    }),
    handler: async (params) => tutorReactExercisePrompt(params),
  },
  {
    name: "tutor_node_check_solution",
    role: "student",
    description: `
  Tests the student's Node.js solution against the exercise test cases.

  🚫 ABSOLUTE PROHIBITION: NEVER edit the student's exercise files under ANY circumstances. NEVER show copy-paste solutions in your messages. Only report test results and guide their thinking. If student says 'continue' or 'next', only run tests - do NOT write code for them.

  ⚠️ CRITICAL SAFEGUARD: After running tests, if ANY tests fail, you MUST call tutor_validate_response with your planned response BEFORE sending guidance to the student. This ensures you don't accidentally provide copy-paste solutions.
  `.trim(),
    inputSchema: z.object({
      exerciseId: z
        .string()
        .describe(
          "The ID of the exercise to test, e.g. 'node-sum-array'."
        ),
    }),
    handler: async (params) => tutorNodeCheckSolution(params),
  },
  {
    name: "tutor_node_show_solution",
    role: "student",
    description: `
  Shows the complete solution code for a Node.js exercise. Only use this when the student explicitly asks for the solution.
  `.trim(),
    inputSchema: z.object({
      exerciseId: z
        .string()
        .describe(
          "The ID of the exercise to show solution for, e.g. 'node-sum-array'."
        ),
    }),
    handler: async (params) => tutorNodeShowSolution(params),
  },
  {
    name: "tutor_react_check_solution",
    role: "student",
    description: `
  Tests the student's React solution against the exercise test cases using a real browser.

  IMPORTANT: The page reloads before each test for isolation, so each test starts with a fresh component state. When creating browserTests in exercise JSON files, ensure each test is self-contained and does not rely on state from previous tests.

  Supported test formats:
  1. Element existence: { name: string, selector: string, exists: boolean }
  2. Text content check: { name: string, selector: string, expected: string } - checks if text contains expected
  3. Click action: { name: string, selector: string, action: 'click', then: { selector: string, expected?: string, contains?: string, exists?: boolean } }
  4. Type action: { name: string, selector: string, action: 'type', value: string, then: { selector: string, expected?: string, contains?: boolean } }
  5. Multiple actions: { name: string, actions: Array<{selector: string, action: 'click'|'type', value?: string}>, then: { selector: string, expected?: string, contains?: boolean } }

  Do NOT use: count, fill, getStyle, or any other action types - they are not supported.

  🚫 ABSOLUTE PROHIBITION - NEVER EDIT STUDENT FILES:
  1. NEVER edit the student's exercise solution files under ANY circumstances
  2. NEVER show copy-paste code solutions in your messages to the student
  3. When tests fail, explain WHAT behavior failed (e.g., 'the error message appears when it shouldn't')
  4. Point to the REQUIREMENT that wasn't met, not the specific line to change
  5. Only provide explicit code if student explicitly asks for hint/solution using those tools
  6. Be pedagogical - guide the student to discover the fix themselves
  7. If student says 'continue' or 'next', only run tests - do NOT implement code

  ⚠️ CRITICAL SAFEGUARD: After running tests, if ANY tests fail, you MUST call tutor_validate_response with your planned response BEFORE sending guidance to the student. This ensures you don't accidentally provide copy-paste solutions.
  `.trim(),
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
    handler: async (params) => tutorReactCheckSolution(params),
  },
  {
    name: "tutor_react_show_solution",
    role: "student",
    description: `
  Shows the complete solution code for a React exercise. Only use this when the student explicitly asks for the solution.
  `.trim(),
    inputSchema: z.object({
      exerciseId: z
        .string()
        .describe(
          "The ID of the exercise to show solution for, e.g. 'react-counter'."
        ),
    }),
    handler: async (params) => tutorReactShowSolution(params),
  },
  {
    name: "tutor_get_hint",
    role: "student",
    description: `
  Provides progressive, targeted hints for the current exercise without revealing the solution. Reads the student's code to give specific guidance. Use this when the student asks for help or is stuck.

  ⚠️ CRITICAL: This tool only provides hints - it does NOT and MUST NOT edit the student's exercise files.
  `.trim(),
    inputSchema: z.object({
      exerciseId: z
        .string()
        .describe("The ID of the exercise the student is working on"),
      hintLevel: z
        .enum(["gentle", "specific", "detailed"])
        .optional()
        .describe(
          "gentle: nudge in right direction, specific: point out exact issue, detailed: explain concept. Default: gentle"
        ),
    }),
    handler: async (params) => tutorGetHint(params),
  },
  {
    name: "tutor_view_progress",
    role: "student",
    description: `
  Shows your exercise progress history and statistics.
  `.trim(),
    inputSchema: z.object({}),
    handler: async () => tutorViewProgress(),
  },
  {
    name: "tutor_override_exercise_completion",
    role: "student",
    description: `
  Marks the most recent attempt for a given exerciseId as completed (user override).

  Use this when you're satisfied with your solution even if not all automated
  tests have passed. This does NOT change historical test results, but adds an
  override flag to the latest attempt so progress views can reflect that status.
  `.trim(),
    inputSchema: z.object({
      exerciseId: z
        .string()
        .describe("The ID of the exercise to mark as completed (user override)."),
    }),
    handler: async (params) => tutorOverrideExerciseCompletion(params),
  },
  {
    name: "tutor_generate_session_state",
    role: "infra",
    description: `
  Generates a session state snapshot for easy context restoration in new chats.

  Analyzes current progress and creates a session_state.json file with current activity, next steps, and recent work. Use this before ending a session or when context window is getting large.
  `.trim(),
    inputSchema: z.object({}),
    handler: async () => tutorGenerateSessionState(),
  },
  // --- Tutorial flow tools ---
  {
    name: "tutor_start_tutorial",
    role: "student",
    description: `
  Starts or resumes a step-by-step tutorial. Returns JSON with the CURRENT step content that you MUST present clearly to the user in a **pedagogical**, teacher-like way (explain what and why, not just what to type).

  Use this to begin a tutorial or to re-load the student's current step at the start of a session.

  ⚠️ Do NOT use this to move from step N to step N+1 after validation. To advance, you MUST use the combination of tutor_check_tutorial_step (to inspect/validate the student's work) and tutor_advance_step (to actually mark the step complete and load the next one).

  ⚠️ CRITICAL: After calling this tool, you MUST present the tutorial content in your response like this:

  ---
  # 📚 Tutorial: [tutorialTitle]
  [tutorialDescription]

  **Progress:** Step [stepNumber] of [totalSteps]
  [If completedSteps exists: **Completed:** steps X, Y, Z]

  ## Step [stepNumber]: [stepTitle]

  ### 📖 What You'll Learn
  [explanation]

  [If codeExample exists:]
  ### 💻 Generic Pattern (TSX)
  [codeExample]

  ### ✏️ Your Task
  [task]

  📁 File: [filePath]
  ---

  DO NOT just say 'the tutorial started' - present the actual content so it's visible!
  `.trim(),
    inputSchema: z.object({
      tutorialId: z
        .string()
        .describe("The ID of the tutorial to start, e.g., 'react-usereducer'"),
    }),
    handler: async (params) => tutorStartTutorial(params),
  },
  {
    name: "tutor_check_tutorial_step",
    role: "student",
    description: `
  Validates the current step of an active tutorial. ONLY checks if code meets requirements - does NOT provide explanations or guidance.

  For code-based and browser-based validations, this tool returns a JSON payload (for example, with studentCode or testResults and a validationType field) that the AI must interpret. It does NOT itself update tutorial progress or move to the next step.

  The expected flow is:
  1. Call tutor_check_tutorial_step(tutorialId) to get the current step's validation data.
  2. As the AI, decide whether the student's work semantically passes.
  3. If it FAILS: craft guidance and route it through tutor_validate_response and tutor_respond_to_student.
  4. If it PASSES: call tutor_advance_step(tutorialId) to mark the step complete and load the next step.

  🚫 ABSOLUTE PROHIBITION: You must NEVER edit student exercise/tutorial files under ANY circumstances. This includes:
  - NEVER use replace_string_in_file, multi_replace_string_in_file, or create_file on student files
  - NEVER show copy-paste solutions in your messages
  - NEVER implement code changes when student says 'continue' or 'next step'
  - The ONLY time to edit is if student explicitly says 'write the code for me' or 'give me the solution'

  Your role is to VALIDATE (this tool), EXPLAIN (tutor_explain_concept), GUIDE (tutor_connect_pattern), and HINT (tutor_tutorial_hint). Let the student write the code.
  `.trim(),
    inputSchema: z.object({
      tutorialId: z
        .string()
        .describe("The ID of the tutorial being worked on"),
    }),
    handler: async (params) => tutorCheckTutorialStep(params),
  },
  {
    name: "tutor_advance_step",
    role: "internal",
    description: `
  ⚠️ INTERNAL USE ONLY - Advances the tutorial to the next step AFTER the AI has validated that the current step passes.

  This tool:
  - Marks the current step as completed in the user's tutorial progress
  - Updates currentStep to point at the next step
  - Returns the next step's content (or a completion summary if there are no more steps)

  It is NOT called automatically. The AI must explicitly call tutor_advance_step(tutorialId) once it has decided, based on tutor_check_tutorial_step's output, that the student's code satisfies the current step's requirements.
  `.trim(),
    inputSchema: z.object({
      tutorialId: z
        .string()
        .describe("The ID of the tutorial being worked on"),
    }),
    handler: async (params) => tutorAdvanceStep(params),
  },
  {
    name: "tutor_explain_concept",
    role: "student",
    description: `
  Re-explains the concept of the current tutorial step in a **teacherly, pedagogical tone**. Shows the explanation, generic code example, and task from the tutorial, focusing on mental models and reasoning.

  Use this when the student asks 'what is this step about?' or seems confused about the concept. This tool should help them understand the *why* behind the step, not just repeat instructions, and must present the tutorial content clearly without giving away the specific answer.

  🚫 NEVER edit student files or provide copy-paste solutions. Only explain concepts and show generic examples.
  `.trim(),
    inputSchema: z.object({
      tutorialId: z.string().describe("The ID of the tutorial"),
    }),
    handler: async (params) => tutorExplainConcept(params),
  },
  {
    name: "tutor_connect_pattern",
    role: "student",
    description: `
  Helps the student connect the generic pattern to their specific task WITHOUT giving the answer, using a **guided, coaching style**.

  Shows what the tutorial is looking for and guides thinking about how to adapt the pattern (ask questions, highlight tradeoffs, explain reasoning). Use this when the student understands the concept but needs help applying it to their specific code.

  Does NOT provide copy-paste solutions.
  `.trim(),
    inputSchema: z.object({
      tutorialId: z.string().describe("The ID of the tutorial"),
      studentQuestion: z
        .string()
        .optional()
        .describe("Optional: specific question the student asked"),
    }),
    handler: async (params) => tutorConnectPattern(params),
  },
  {
    name: "tutor_tutorial_hint",
    role: "student",
    description: `
  Provides progressive hints for the current tutorial step in a **pedagogical, hint-first style** (nudge → explanation → more concrete guidance).

  Use this when the student is stuck after trying. Gives increasingly specific guidance without revealing the full solution, and should explain the underlying ideas rather than just describing the next line of code.
  `.trim(),
    inputSchema: z.object({
      tutorialId: z.string().describe("The ID of the tutorial"),
    }),
    handler: async (params) => tutorTutorialHint(params),
  },
  // --- Pedagogy and validation tools ---
  {
    name: "tutor_validate_response",
    role: "internal",
    description: `
  🔴 MANDATORY: Validates your response before sending ANY tutorial/exercise-related guidance to students.

  You MUST call this tool BEFORE responding when:
  - Student asks a question about tutorial code
  - Student asks for clarification on requirements
  - You're explaining what the task means
  - You're discussing the current tutorial/exercise step
  - Responding to confusion or providing hints

  ONLY exceptions:
  - User explicitly says 'give me the solution' or 'show me the answer'
  - Using the show solution tool

  This validates that your response follows pedagogical rules (no copy-paste solutions, no exact answers) **and** reminds you of the full, authoritative task description so you don't accidentally omit required behaviors. Pass in your planned response text, the tutorial/exercise ID, and current step number if applicable. The tool returns 'approved' or 'rejected' with specific feedback on violations, plus the step's task text so you can ensure your directions fully cover the requirements.
  `.trim(),
    inputSchema: z.object({
      responseText: z
        .string()
        .describe(
          "Your planned response text to validate before sending to the student"
        ),
      tutorialOrExerciseId: z
        .string()
        .describe(
          "The tutorial or exercise ID (e.g., 'react-usereducer', 'react-counter')"
        ),
      stepNumber: z
        .number()
        .optional()
        .describe("Current step number if in a multi-step tutorial"),
    }),
    handler: async (params) => tutorValidateResponse(params),
  },
  {
    name: "tutor_validate_tutorial_json",
    role: "author",
    description: `
  Validates a tutorial JSON file for copy-paste code violations in task descriptions.

  Can optionally auto-fix by removing violating code. Use this to clean tutorial files before using them with students.
  `.trim(),
    inputSchema: z.object({
      tutorialId: z
        .string()
        .describe(
          "The tutorial ID (without 'tutorial-' prefix, e.g., 'react-usecallback')"
        ),
      autoFix: z
        .boolean()
        .optional()
        .describe(
          "If true, automatically removes copy-paste code and saves the cleaned tutorial. Default: false"
        ),
    }),
    handler: async (params) => tutorValidateTutorialJSON(params),
  },
  {
    name: "tutor_respond_to_student",
    role: "internal",
    description: `
  🔴 MANDATORY GATEWAY: Use this tool to respond to students during tutorials/exercises.

  This is the ONLY way to send responses when discussing tutorial code. Pass your draft response and it will automatically validate it before allowing you to send it.

  If you read tutorial JSON, student code, or receive task details from another tool, you MUST use this tool to respond. DO NOT respond directly - always use this gateway. Responses routed through this tool should sound like a **supportive teacher**: explain concepts, reasoning, and tradeoffs, not just what to type.
  `.trim(),
    inputSchema: z.object({
      draftResponse: z
        .string()
        .describe("Your complete draft response to the student"),
      tutorialOrExerciseId: z
        .string()
        .describe(
          "The tutorial or exercise ID (e.g., 'react-usecallback', 'react-counter')"
        ),
      stepNumber: z
        .number()
        .optional()
        .describe("Current step number if in a multi-step tutorial"),
    }),
    handler: async (params) => tutorRespondToStudent(params),
  },
  {
    name: "tutor_validate_exercise_requirements",
    role: "author",
    description: tutorValidateExerciseRequirements.description,
    inputSchema: tutorValidateExerciseRequirements.inputSchema,
    handler: async (params) => tutorValidateExerciseRequirements.execute(params),
  },
  // --- Progress and environment tools ---
  {
    name: "tutor_list_react_tutorial_statuses",
    role: "student",
    description: `
  Lists all React tutorial statuses for the user (not-started, in-progress, completed).
  `.trim(),
    inputSchema: z.object({}),
    handler: async () => tutorListReactTutorialStatuses(),
  },
  {
    name: "start_vite_dev_server",
    role: "infra",
    description: `
  Starts (or confirms) the Vite dev server for React exercises.

  This is the REQUIRED path for Vite startup in this workspace.
  `.trim(),
    inputSchema: z.object({
      port: z
        .number()
        .optional()
        .describe(
          "Optional port for the Vite dev server (defaults to 5174)."
        ),
    }),
    handler: async (params) => startViteDevServer(params.port),
  },
  {
    name: "start_dummy_backend",
    role: "infra",
    description: `
  Starts (or confirms) the dummy Express backend server used by frontend exercises.

  Behaves similarly to the Vite dev server tool:
  - Uses the same JSON state file as the Vite server to track port and PID
  - Reuses an already-running backend if it finds one on the saved port
  - By default, uses port 4000 unless a different port is explicitly requested

  You can think of this as the tool to call when the user says things like "start the dummy backend" or "start the dummy server".
  `.trim(),
    inputSchema: z.object({
      port: z
        .number()
        .optional()
        .describe(
          "Optional port for the dummy backend server (defaults to 4000)."
        ),
    }),
    handler: async (params) => startDummyBackend(params.port),
  },
  // --- Senior Dev Mode tools ---
  {
    name: "seniorDev_start_mode",
    role: "senior-dev",
    description: `
  Initialize a Senior Dev Mode session by capturing the code change context.
  `.trim(),
    inputSchema: z.object({
      files: z.array(z.string()).optional(),
      fromCommit: z.string().optional(),
      toCommit: z.string().optional(),
      mode: z.enum(["diff", "file"]).optional(),
    }),
    handler: seniorDev_start_mode,
  },
  {
    name: "seniorDev_analyze_skills",
    role: "senior-dev",
    description: `
  Analyze the code changes and extract a list of relevant skills, concepts, and patterns.
  `.trim(),
    inputSchema: z.object({
      sessionId: z.string(),
    }),
    handler: seniorDev_analyze_skills,
  },
  {
    name: "seniorDev_select_skills",
    role: "senior-dev",
    description: `
  Allow the user to select which skills/concepts to focus on in the tutorial.
  `.trim(),
    inputSchema: z.object({
      sessionId: z.string(),
      selectedSkills: z.array(z.string()),
    }),
    handler: seniorDev_select_skills,
  },
  {
    name: "seniorDev_generate_tutorial",
    role: "senior-dev",
    description: `
  Break down the code changes into a step-by-step tutorial, grouped by the selected skills.
  `.trim(),
    inputSchema: z.object({
      sessionId: z.string(),
      selectedSkills: z.array(z.string()).optional(),
    }),
    handler: seniorDev_generate_tutorial,
  },
  {
    name: "seniorDev_present_step",
    role: "senior-dev",
    description: `
  Present the current tutorial step to the user, including context and instructions.
  `.trim(),
    inputSchema: z.object({
      sessionId: z.string(),
      stepNumber: z.number(),
    }),
    handler: seniorDev_present_step,
  },
  {
    name: "seniorDev_check_step",
    role: "senior-dev",
    description: `
  Validate the user's code for the current step.
  `.trim(),
    inputSchema: z.object({
      sessionId: z.string(),
      stepNumber: z.number(),
      files: z.array(z.string()).optional(),
    }),
    handler: seniorDev_check_step,
  },
  {
    name: "seniorDev_finalize_tutorial",
    role: "senior-dev",
    description: `
  Summarize the session, review all changes, and reinforce the skills learned.
  `.trim(),
    inputSchema: z.object({
      sessionId: z.string(),
    }),
    handler: seniorDev_finalize_tutorial,
  },
  {
    name: "seniorDev_abort_session",
    role: "senior-dev",
    description: `
  Allow the user to abort or reset the session.
  `.trim(),
    inputSchema: z.object({
      sessionId: z.string(),
    }),
    handler: seniorDev_abort_session,
  },
];

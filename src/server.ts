import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { TOOL_DEFINITIONS } from "./toolDefinitions.js";

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

  for (const tool of TOOL_DEFINITIONS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      (params) => tool.handler(params)
    );
  }

  console.error(
    "[mcp-tutor] Tools registered: " +
      TOOL_DEFINITIONS.map((t) => t.name).join(", ")
  );

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("[mcp-tutor] MCP server started on stdio");
}

main().catch((err) => {
  console.error("[mcp-tutor] Fatal error:", err);
  process.exit(1);
});

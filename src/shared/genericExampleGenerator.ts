/**
 * Generates generic code examples for tutorial concepts using LLM
 * These examples teach the pattern WITHOUT giving away the specific solution
 */

/**
 * Creates a prompt for the LLM to generate a generic code example
 * that teaches a concept without revealing the specific exercise solution
 */
export function createGenericExamplePrompt(
  stepTitle: string,
  explanation: string,
  task: string
): string {
  return `You are a coding tutor. Generate a GENERIC code example that teaches a concept WITHOUT solving the student's specific exercise.

**Concept being taught:** ${stepTitle}

**Explanation:** ${explanation}

**Student's specific task (DO NOT solve this):** ${task}

**Your job:**
1. Extract the KEY PROGRAMMING CONCEPT being taught (e.g., "using dispatch with useReducer", "array destructuring", "onClick handlers")
2. Create a GENERIC example that demonstrates this concept with DIFFERENT variable names, DIFFERENT action types, and a DIFFERENT use case than the student's task
3. Use placeholder/generic names like 'myAction', 'handleAction', 'someValue', etc.
4. Keep it SHORT (5-10 lines max)
5. Include a brief comment explaining what the code does

**Critical:** Your example must be generic enough that it TEACHES the pattern but does NOT give away the specific solution to the student's task.

Return ONLY the code example with brief comments, nothing else.`;
}

/**
 * Request structure for generating a generic example
 * The MCP tool will return this to signal that the AI assistant should
 * generate a generic example and present it to the student
 */
export interface GenericExampleRequest {
  requestType: "generate-generic-example";
  stepTitle: string;
  explanation: string;
  task: string;
  instruction: string;
}

/**
 * Creates a request for the AI to generate and present a generic example
 */
export function createGenericExampleRequest(
  stepTitle: string,
  explanation: string,
  task: string
): GenericExampleRequest {
  return {
    requestType: "generate-generic-example",
    stepTitle,
    explanation,
    task,
    instruction: `Generate a generic code example that teaches the concept of "${stepTitle}" without solving the student's specific task. Use different variable names, different action types, and a different scenario. Then present the tutorial step with your generic example included.`
  };
}

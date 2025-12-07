/**
 * Validates AI assistant responses to ensure they don't contain copy-paste solutions
 * This is a prompt that the AI should use to self-check before responding
 */

/**
 * Creates a validation prompt for the AI to check its own response
 * The AI should use this internally before sending hints/guidance to students
 */
export function createResponseValidationPrompt(
  aiResponse: string,
  exerciseTask: string,
  currentStudentCode: string
): string {
  return `You are a pedagogy validator. Analyze if this AI response violates teaching principles by giving away the solution.

**The Student's Task:**
${exerciseTask}

**The Student's Current Code:**
\`\`\`
${currentStudentCode}
\`\`\`

**The AI's Response to the Student:**
${aiResponse}

**Validation Criteria:**

🚫 VIOLATIONS (response should be REJECTED):
1. Contains exact code that solves the student's specific task
2. Shows the exact function/variable names the student needs to use
3. Provides copy-paste code blocks that implement the solution
4. Uses the specific action types, method names, or values from the task

✅ ACCEPTABLE (response is pedagogical):
1. Explains concepts in words without specific code
2. Points to what's wrong (e.g., "you're passing a string instead of an object")
3. Asks guiding questions
4. References documentation or general patterns
5. Shows generic examples with DIFFERENT names/values than the task
6. Explains error messages or test failures

**Your Analysis:**
Does this response give away the solution? Return JSON:
{
  "containsSolution": boolean,
  "violations": ["list of specific violations, if any"],
  "suggestion": "How to rephrase this response to be more pedagogical (if violations exist)"
}

Return ONLY the JSON, nothing else.`;
}

/**
 * Checks if a response likely contains a solution
 * This is a simpler heuristic check that can be done without LLM
 */
export function quickCheckForSolution(
  response: string,
  taskKeywords: string[]
): { likelySolution: boolean; matches: string[] } {
  const matches: string[] = [];
  const lowerResponse = response.toLowerCase();
  
  // Check for code blocks with exact task keywords
  const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
  
  for (const block of codeBlocks) {
    const lowerBlock = block.toLowerCase();
    for (const keyword of taskKeywords) {
      if (lowerBlock.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    }
  }
  
  // Check for inline code with task keywords
  const inlineCode = response.match(/`[^`]+`/g) || [];
  for (const code of inlineCode) {
    const lowerCode = code.toLowerCase();
    for (const keyword of taskKeywords) {
      if (lowerCode.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    }
  }
  
  return {
    likelySolution: matches.length > 0,
    matches: [...new Set(matches)]
  };
}

/**
 * Extracts keywords from a task that would indicate a solution
 */
export function extractTaskKeywords(task: string): string[] {
  const keywords: string[] = [];
  
  // Extract words in backticks (like `increment`, `dispatch`, etc.)
  const backtickMatches = task.match(/`([^`]+)`/g);
  if (backtickMatches) {
    keywords.push(...backtickMatches.map(m => m.replace(/`/g, '')));
  }
  
  // Extract quoted strings
  const quoteMatches = task.match(/"([^"]+)"|'([^']+)'/g);
  if (quoteMatches) {
    keywords.push(...quoteMatches.map(m => m.replace(/['"]/g, '')));
  }
  
  return keywords;
}

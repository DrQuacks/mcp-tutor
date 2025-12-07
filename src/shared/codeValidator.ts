/**
 * Semantic code validation using LLM analysis
 * Instead of pattern matching, we analyze if the code meets the requirements
 */

/**
 * Analyzes student code to determine if it meets tutorial step requirements
 * Returns a structured prompt for the LLM to evaluate
 */
export function generateValidationPrompt(
  studentCode: string,
  stepExplanation: string,
  stepTask: string,
  checks: string[]
): string {
  return `You are validating a student's code for a tutorial step. Analyze if their code correctly implements the requirements.

**Step Requirements:**
${stepTask}

**What we're checking for (these are hints, not exact matches required):**
${checks.map(c => `- ${c}`).join('\n')}

**Student's Code:**
\`\`\`tsx
${studentCode}
\`\`\`

**Instructions:**
1. Analyze if the student's code accomplishes the task described in the requirements
2. Don't require exact formatting or variable naming (unless specified in requirements)
3. Check for semantic correctness, not syntax matching
4. Return ONLY a JSON object with this structure:
{
  "passed": true/false,
  "feedback": "Brief explanation of what's correct or what's missing"
}

Return ONLY the JSON, nothing else.`;
}

/**
 * Parses LLM validation response
 */
export function parseValidationResponse(response: string): {
  passed: boolean;
  feedback: string;
} {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        passed: result.passed === true,
        feedback: result.feedback || ''
      };
    }
  } catch (e) {
    // Fallback if parsing fails
  }
  
  // Fallback: simple heuristic
  return {
    passed: false,
    feedback: "Unable to validate code automatically. Please use tutor_tutorial_hint for help."
  };
}

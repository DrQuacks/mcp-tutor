/**
 * Cleans tutorial task descriptions to remove copy-paste code solutions
 */

import { extractTaskKeywords, quickCheckForSolution } from "./responseValidator.js";

/**
 * Analyzes a task description and removes any copy-paste code that gives away the solution
 */
export function cleanTaskDescription(task: string, stepTitle: string): {
  cleanedTask: string;
  hadViolations: boolean;
  violations: string[];
} {
  const lines = task.split('\n');
  const cleanedLines: string[] = [];
  const violations: string[] = [];
  let hadViolations = false;
  
  // Extract keywords from the task to check against
  const keywords = extractTaskKeywords(task);
  
  for (const line of lines) {
    // Check if this line contains code blocks with specific solution code
    if (line.includes('`<') || line.includes('`{')) {
      // Line contains inline code that might be a solution
      const check = quickCheckForSolution(line, keywords);
      if (check.likelySolution) {
        hadViolations = true;
        violations.push(`Removed copy-paste code: ${line.trim()}`);
        continue; // Skip this line
      }
    }
    
    // Check for code blocks (```)
    if (line.trim().startsWith('```')) {
      hadViolations = true;
      violations.push(`Removed code block starting at: ${line.trim()}`);
      // Skip until end of code block
      continue;
    }
    
    // Keep the line if it passed checks
    cleanedLines.push(line);
  }
  
  return {
    cleanedTask: cleanedLines.join('\n').trim(),
    hadViolations,
    violations,
  };
}

/**
 * Validates an entire tutorial JSON and reports all violations
 */
export function validateTutorialJSON(tutorialData: any): {
  isValid: boolean;
  violations: Array<{
    stepNumber: number;
    stepTitle: string;
    issues: string[];
  }>;
} {
  const violations: Array<{ stepNumber: number; stepTitle: string; issues: string[] }> = [];
  
  if (!tutorialData.steps || !Array.isArray(tutorialData.steps)) {
    return { isValid: true, violations: [] };
  }
  
  for (const step of tutorialData.steps) {
    const result = cleanTaskDescription(step.task, step.title);
    if (result.hadViolations) {
      violations.push({
        stepNumber: step.stepNumber,
        stepTitle: step.title,
        issues: result.violations,
      });
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations,
  };
}

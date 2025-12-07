/**
 * Filters out copy-paste solutions from tutorial content to maintain pedagogy
 */

/**
 * Removes explicit solution code from task descriptions
 * Looks for patterns like:
 * - "It should look like: `code`"
 * - "Add: `code`"
 * - Similar copy-paste hints
 */
export function filterCopyPasteSolutions(text: string): string {
  // Remove entire sentences/paragraphs containing "It should look like: `code`"
  text = text.replace(/\n\n.*?It should look like:\s*`[^`]+`.*/gi, "");
  text = text.replace(/^.*?It should look like:\s*`[^`]+`.*/gim, "");
  
  // Remove lines with "Add: `specific code`" when it's exact solution
  text = text.replace(/\n.*?Add:\s*`[^`]+`.*/g, "");
  text = text.replace(/^.*?Add:\s*`[^`]+`.*/gm, "");
  
  // Clean up extra whitespace left behind
  text = text.replace(/\n\n\n+/g, "\n\n");
  text = text.trim();
  
  return text;
}

/**
 * Determines if a message contains copy-paste solution code
 * Used for validation/warnings
 */
export function containsCopyPasteSolution(text: string): boolean {
  // Check for "It should look like" with code
  if (/It should look like:\s*`[^`]+`/i.test(text)) {
    return true;
  }
  
  // Check for "Add: `exact code`" patterns
  if (/Add:\s*`[^`]+\([^)]*\)/i.test(text)) {
    return true;
  }
  
  return false;
}

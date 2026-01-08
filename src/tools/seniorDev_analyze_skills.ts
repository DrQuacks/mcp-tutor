import { seniorDevSessions } from "./seniorDev_start_mode.js";

/**
 * Analyze code diffs and extract relevant skills for Senior Dev Mode.
 * This tool takes a sessionId, retrieves the diff, and returns a list of inferred skills.
 *
 * Input: { sessionId: string }
 * Output: { content: [...], skills: string[], summary: string }
 */
export async function seniorDev_analyze_skills({ sessionId }: { sessionId: string }) {
  const session = seniorDevSessions[sessionId];
  if (!session) {
    return {
      content: [
        { type: "text" as const, text: `❌ No session found for ID: ${sessionId}` },
      ],
      skills: [],
      summary: "No session found."
    };
  }
  if (session.phase !== "awaiting-skill-analysis") {
    return {
      content: [
        { type: "text" as const, text: `❌ Invalid phase: ${session.phase}. Skill analysis can only run after session start.` },
      ],
      skills: [],
      summary: `Invalid phase: ${session.phase}`
    };
  }

  // LLM-based skill extraction: analyze the diff and session context directly
  const diffs = Object.values(session.diffs).join("\n");

  // --- LLM-based reasoning section ---
  // Analyze the diff and session context to extract relevant, descriptive, and domain-specific skills
  // and generate a thoughtful summary.

  // Example reasoning (replace with actual LLM analysis):
  // 1. Look for patterns such as tool registration, protocol handling, session state management, etc.
  // 2. Identify any new architectural patterns, abstractions, or domain-specific logic.
  // 3. Summarize the main changes and their implications for developer skill growth.

  // For demonstration, here is a template for LLM-based analysis:
  let skills: string[] = [];
  let summary = "";

  // Example: If the diff includes changes to tool registration, protocol handling, or session state
  if (/register|protocol|session|state|mcp|tool/i.test(diffs)) {
    if (/register/i.test(diffs)) skills.push("Tool Registration");
    if (/protocol/i.test(diffs)) skills.push("Protocol Design & Handling");
    if (/session/i.test(diffs) || /state/i.test(diffs)) skills.push("Session State Management");
    if (/mcp/i.test(diffs)) skills.push("MCP Server Patterns");
    if (/diff/i.test(diffs)) skills.push("Code Diff Analysis");
  }
  // Add more domain-specific reasoning as needed
  if (/extract|analyz/i.test(diffs)) skills.push("Skill Extraction Logic");
  if (/commit/i.test(diffs)) skills.push("Git Commit Analysis");
  if (/summary/i.test(diffs)) skills.push("Automated Summarization");
  if (/async|await|promise/i.test(diffs)) skills.push("Async Programming");
  if (/typescript|interface|type/i.test(diffs)) skills.push("TypeScript Type Safety");

  // Fallback if nothing found
  if (skills.length === 0) skills = ["Code Change Analysis"];

  summary = `Skills inferred from code changes: ${skills.join(", ")}`;

  session.phase = "skills-analyzed";
  return {
    content: [
      { type: "text" as const, text: summary },
    ],
    skills,
    summary,
  };
}

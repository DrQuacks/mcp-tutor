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

  // Naive skill extraction: look for keywords in diffs (to be replaced with LLM or better logic)
  const skillKeywords = [
    "refactor", "test", "async", "promise", "hook", "state", "effect", "reducer", "typescript", "interface", "class", "function", "error", "validation", "performance", "optimization", "pattern", "component", "render", "api", "fetch", "query", "mutation", "context", "memo", "callback", "side effect", "cleanup", "dependency", "event", "handler", "props", "state management", "unit test", "integration test", "mock", "spy", "coverage", "lint", "format", "build", "deploy"
  ];
  const diffs = Object.values(session.diffs).join("\n").toLowerCase();
  const foundSkills = skillKeywords.filter((kw) => diffs.includes(kw));

  // Fallback: if no skills found, just say "code change"
  const skills = foundSkills.length ? foundSkills : ["code change"];
  const summary = `Skills inferred from code changes: ${skills.join(", ")}`;

  return {
    content: [
      { type: "text" as const, text: summary },
    ],
    skills,
    summary,
  };
}

import { seniorDevSessions } from "./seniorDev_start_mode.js";

/**
 * Break down the code changes into a step-by-step tutorial, grouped by the selected skills.
 * This tool takes a sessionId and (optionally) selectedSkills, generates a tutorial plan, and stores it in the session.
 *
 * Input: { sessionId: string, selectedSkills?: string[] }
 * Output: { content: [...], tutorialPlan: any }
 */
export async function seniorDev_generate_tutorial({ sessionId, selectedSkills }: { sessionId: string; selectedSkills?: string[] }) {
  const session = seniorDevSessions[sessionId];
  if (!session) {
    return {
      content: [
        { type: "text" as const, text: `❌ No session found for ID: ${sessionId}` },
      ],
      tutorialPlan: null,
    };
  }
  // Use selectedSkills from input or session
  const skills = selectedSkills && selectedSkills.length ? selectedSkills : session.selectedSkills || [];
  // Naive breakdown: one step per skill, with a diff chunk for each
  const steps = (skills as string[]).map((skill: string, i: number) => ({
    stepNumber: i + 1,
    skill,
    instructions: `Focus on the code changes related to: ${skill}`,
    diff: Object.entries(session.diffs)
      .filter(([file, diff]: [string, unknown]) => typeof diff === "string" && diff.toLowerCase().includes(skill.toLowerCase()))
      .map(([file, diff]: [string, unknown]) => ({ file, diff })),
  }));
  // Fallback: if no skills, just one step for all changes
  if (!steps.length) {
    steps.push({
      stepNumber: 1,
      skill: "code change",
      instructions: "Review all code changes.",
      diff: Object.entries(session.diffs).map(([file, diff]) => ({ file, diff })),
    });
  }
  const tutorialPlan = {
    sessionId,
    skills,
    steps,
    createdAt: new Date().toISOString(),
  };
  session.tutorialPlan = tutorialPlan;
  return {
    content: [
      { type: "text" as const, text: `Tutorial plan generated with ${steps.length} step(s).` },
    ],
    tutorialPlan,
  };
}

import { seniorDevSessions } from "./seniorDev_start_mode.js";
import { buildTutorialStep } from "../shared/tutorialStepBuilder.js";
import fs from "node:fs/promises";
import path from "node:path";

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
  if (session.phase !== "skills-selected") {
    return {
      content: [
        { type: "text" as const, text: `❌ Invalid phase: ${session.phase}. Tutorial can only be generated after skills are selected.` },
      ],
      tutorialPlan: null,
    };
  }
  // Use selectedSkills from input or session
  const skills = selectedSkills && selectedSkills.length ? selectedSkills : session.selectedSkills || [];
  // Build each step as a TutorialStep for code reuse
  const steps = (skills as string[]).map((skill: string, i: number) => {
    const relatedDiffs = Object.entries(session.diffs)
      .filter(([file, diff]: [string, unknown]) => typeof diff === "string" && diff.toLowerCase().includes(skill.toLowerCase()))
      .map(([file, diff]: [string, unknown]) => ({ file, diff }));
    return buildTutorialStep({
      stepNumber: i + 1,
      title: `Skill: ${skill}`,
      explanation: `This step focuses on the code changes related to \"${skill}\". Review how this skill is applied in the codebase and understand its impact.`,
      codeExample: undefined,
      task: `Refactor or implement the code to demonstrate your understanding of \"${skill}\". Ensure the code is clean, idiomatic, and leverages best practices for this concept.`,
      validation: {
        type: "code-contains",
        checks: [skill],
      },
      diff: relatedDiffs,
    });
  });
  // Fallback: if no skills, just one step for all changes
  if (!steps.length) {
    steps.push(buildTutorialStep({
      stepNumber: 1,
      title: "Skill: code change",
      explanation: "This step focuses on reviewing all code changes.",
      codeExample: undefined,
      task: "Review and refactor the code changes as needed.",
      validation: {
        type: "code-contains",
        checks: ["code change"],
      },
      diff: Object.entries(session.diffs).map(([file, diff]) => ({ file, diff })),
    }));
  }
  // Build the full tutorial plan in the same format as regular tutorials
  const tutorialPlan = {
    title: `Senior Dev Tutorial (${sessionId})`,
    description: `A step-by-step tutorial generated from code changes in Senior Dev Mode. Skills: ${skills.join(", ")}`,
    environment: "node", // or infer from session/files if needed
    filePath: session.files && session.files.length ? session.files[0] : "src/server.ts",
    starterCode: session.before && session.files && session.files.length ? session.before[session.files[0]] : "",
    steps,
    sessionId,
    skills,
    createdAt: new Date().toISOString(),
  };

  // Write the tutorial plan to senior-dev-tutorials/tutorial-senior-dev-{sessionId}.json
  const tutorialFileName = `tutorial-senior-dev-${sessionId}.json`;
  const tutorialFilePath = path.join(process.cwd(), "senior-dev-tutorials", tutorialFileName);
  await fs.writeFile(tutorialFilePath, JSON.stringify(tutorialPlan, null, 2), "utf8");

  // Store reference in session (not the full plan)
  session.tutorialFilePath = tutorialFilePath;
  session.phase = "tutorial-generated";
  // After updating session, persist minimal session state
  const { saveSessionsToDisk } = await import("./seniorDev_start_mode.js");
  await saveSessionsToDisk();

  return {
    content: [
      { type: "text" as const, text: `Tutorial plan generated with ${steps.length} step(s). File: senior-dev-tutorials/${tutorialFileName}` },
    ],
    tutorialFilePath,
  };
}

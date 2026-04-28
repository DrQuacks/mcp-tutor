import { getAllTutorialStatuses } from "../shared/tutorialStatus.js";
import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT } from "../shared/constants.js";
import type { ToolResponse } from "../shared/types.js";

/**
 * Tool endpoint: Lists all React tutorial statuses for the user (not-started, in-progress, completed)
 */
export async function tutorListReactTutorialStatuses(): Promise<ToolResponse> {
  // Find all tutorial-react-*.json files
  const files = await fs.readdir(EXERCISES_ROOT);
  const reactTutorialFiles = files.filter(f => f.startsWith("tutorial-react-") && f.endsWith(".json"));
  const allTutorials: Array<{ tutorialId: string; title: string; totalSteps: number }> = [];
  for (const file of reactTutorialFiles) {
    const filePath = path.join(EXERCISES_ROOT, file);
    const content = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(content);
    allTutorials.push({
      tutorialId: data.id || file.replace(".json", "").replace("tutorial-", ""),
      title: data.title,
      totalSteps: Array.isArray(data.steps) ? data.steps.length : 0,
    });
  }
  const statuses = await getAllTutorialStatuses(allTutorials);
  const lines: string[] = ["# React Tutorial Statuses\n"];
  for (const tut of statuses) {
    lines.push(`- ${tut.title} [${tut.status}]`);
  }
  return {
    content: [{ type: "text", text: lines.join("\n") }],
    statuses,
  };
}

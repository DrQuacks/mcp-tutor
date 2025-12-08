/**
 * Tool to validate and clean tutorial JSON files
 */

import fs from "fs/promises";
import path from "path";
import { validateTutorialJSON, cleanTaskDescription } from "../shared/tutorialTaskCleaner.js";
import type { ToolResponse } from "../shared/types.js";

export async function tutorValidateTutorialJSON({
  tutorialId,
  autoFix = false,
}: {
  tutorialId: string;
  autoFix?: boolean;
}): Promise<ToolResponse> {
  const tutorialPath = path.join(
    process.cwd(),
    "exercises",
    `tutorial-${tutorialId}.json`
  );

  let tutorialData: any;
  try {
    const content = await fs.readFile(tutorialPath, "utf-8");
    tutorialData = JSON.parse(content);
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Could not load tutorial: ${tutorialId}\nError: ${err.message}`,
        },
      ],
    };
  }

  const validation = validateTutorialJSON(tutorialData);

  if (validation.isValid) {
    return {
      content: [
        {
          type: "text",
          text: `✅ Tutorial '${tutorialId}' is clean - no copy-paste code violations found!`,
        },
      ],
    };
  }

  // Build violation report
  const lines: string[] = [];
  lines.push(`⚠️ **Tutorial '${tutorialId}' has ${validation.violations.length} steps with copy-paste code violations:**`);
  lines.push("");

  for (const violation of validation.violations) {
    lines.push(`**Step ${violation.stepNumber}: ${violation.stepTitle}**`);
    for (const issue of violation.issues) {
      lines.push(`  - ${issue}`);
    }
    lines.push("");
  }

  if (autoFix) {
    // Clean all task descriptions
    for (const step of tutorialData.steps) {
      const result = cleanTaskDescription(step.task, step.title);
      step.task = result.cleanedTask;
    }

    // Write back to file
    await fs.writeFile(
      tutorialPath,
      JSON.stringify(tutorialData, null, 2),
      "utf-8"
    );

    lines.push("");
    lines.push("✅ **Auto-fix applied!** Tutorial JSON has been cleaned and saved.");
  } else {
    lines.push("");
    lines.push("💡 Run with `autoFix: true` to automatically clean the tutorial JSON.");
  }

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
  };
}

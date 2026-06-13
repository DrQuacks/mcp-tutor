/**
 * Loads React exercise and creates starter file for the student
 */

import fs from "node:fs/promises";
import path from "node:path";
import { EXERCISES_ROOT, NODE_ENV_ROOT, REACT_ENV_ROOT } from "../shared/constants.js";
import type { ToolResponse } from "../shared/types.js";

export async function tutorReactExercisePrompt({
  exerciseId,
  mode = "normal",
  archiveExisting = true,
}: {
  exerciseId: string;
  mode?: "normal" | "easy";
  archiveExisting?: boolean;
}): Promise<ToolResponse> {
  const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);

  let exerciseData: any;
  try {
    const content = await fs.readFile(exercisePath, "utf8");
    exerciseData = JSON.parse(content);
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Exercise '${exerciseId}' not found or invalid.`,
        },
      ],
    };
  }

  // Validate browserTests for common mistakes
  const warnings: string[] = [];
  if (exerciseData.browserTests && Array.isArray(exerciseData.browserTests)) {
    for (let i = 0; i < exerciseData.browserTests.length; i++) {
      const test = exerciseData.browserTests[i];
      
      // Check for unsupported actions
      const checkAction = (action: any) => {
        if (action.action && !['click', 'type'].includes(action.action)) {
          warnings.push(`⚠️ Test "${test.name}": Uses unsupported action "${action.action}". Only 'click' and 'type' are supported.`);
        }
      };
      
      if (test.action) checkAction(test);
      if (test.actions) test.actions.forEach(checkAction);
      
      // Warn about potential isolation issues - tests that only add one item when previous test added items
      if (i > 0 && test.actions && test.then) {
        const hasTypeAction = test.actions.some((a: any) => a.action === 'type');
        const checksNthChild = test.then.selector && /nth-of-type\((\d+)\)/.test(test.then.selector);
        if (hasTypeAction && checksNthChild) {
          const match = test.then.selector.match(/nth-of-type\((\d+)\)/);
          const nthIndex = match ? parseInt(match[1]) : 0;
          const typeActionsCount = test.actions.filter((a: any) => a.action === 'type').length;
          if (nthIndex > typeActionsCount) {
            warnings.push(`⚠️ Test "${test.name}": Checks for nth-of-type(${nthIndex}) but only types ${typeActionsCount} item(s). Remember: page reloads between tests (no state from previous tests).`);
          }
        }
      }
    }
  }

  // Create the starter file with embedded requirements
  const envRoot = exerciseData.environment === "node" ? NODE_ENV_ROOT : REACT_ENV_ROOT;
  const filePath = path.join(envRoot, exerciseData.filePath);

  // Build starter code with JSDoc-style header containing requirements
  let starterCodeWithHeader = `/**\n * ${exerciseData.title}\n * \n`;
  
  // Add brief description (first line or two)
  const descLines = exerciseData.description.split('\n');
  const briefDesc = descLines[0];
  starterCodeWithHeader += ` * ${briefDesc}\n * \n`;
  
  // Add requirements as instructions
  starterCodeWithHeader += ` * Requirements:\n`;
  for (const req of exerciseData.requirements) {
    starterCodeWithHeader += ` * - ${req}\n`;
  }
  starterCodeWithHeader += ` */\n\n`;
  
  // Append the actual starter code (should be minimal - just component shell)
  // The starterCode in JSON should NOT include:
  // - Interface definitions (student should create these)
  // - Function scaffolding (student should design the functions)
  // - TODO comments inside the code (requirements are in JSDoc above)
  // 
  // The starterCode SHOULD include:
  // - Basic component structure with return statement
  // - A heading or minimal layout as starting point
  // - Export statement
  let starterCode = exerciseData.starterCode;
  
  // In easy mode, TODO comments can be included in starterCode for hints
  // In normal mode (default), strip out any TODO comments for interview simulation
  if (mode === "normal") {
    starterCode = starterCode
      .split('\n')
      .filter((line: string) => {
        // Remove any line that contains a TODO comment (in any format)
        return !line.includes('TODO:');
      })
      .join('\n');
  }
  
  starterCodeWithHeader += starterCode;

  const archiveEntries: Array<{ sourcePath: string; label: string }> = [];
  if (archiveExisting) {
    const currentFiles = [
      { sourcePath: filePath, label: path.basename(filePath) },
    ];

    if (exerciseData.environment === "react") {
      const appPath = path.join(REACT_ENV_ROOT, "src", "App.tsx");
      currentFiles.push({ sourcePath: appPath, label: "App.tsx" });
    }

    const archiveStamp = new Date().toISOString().replace(/[:.]/g, "-");
    const archiveDir = path.join(process.cwd(), "attempts", exerciseId, archiveStamp);

    for (const entry of currentFiles) {
      try {
        const existingContent = await fs.readFile(entry.sourcePath, "utf8");
        const nextContent = entry.sourcePath === filePath
          ? starterCodeWithHeader
          : exerciseData.environment === "react"
            ? `import './App.css'\nimport ${path.basename(exerciseData.filePath, path.extname(exerciseData.filePath))} from './exercises/${path.basename(exerciseData.filePath, path.extname(exerciseData.filePath))}'\n\nfunction App() {\n  return (\n    <div style={{ padding: '2rem', textAlign: 'center' }}>\n      <h1>React Exercise: ${exerciseData.title}</h1>\n      <${path.basename(exerciseData.filePath, path.extname(exerciseData.filePath))} />\n    </div>\n  )\n}\n\nexport default App\n`
            : "";

        if (existingContent !== nextContent) {
          const archiveFilePath = path.join(archiveDir, entry.label);
          await fs.mkdir(path.dirname(archiveFilePath), { recursive: true });
          await fs.copyFile(entry.sourcePath, archiveFilePath);
          archiveEntries.push({ sourcePath: entry.sourcePath, label: archiveFilePath });
        }
      } catch {
        // No existing file to archive; skip.
      }
    }
  }

  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, starterCodeWithHeader, "utf8");
    
    // For React exercises, update App.tsx to import this component
    if (exerciseData.environment === "react") {
      const appPath = path.join(REACT_ENV_ROOT, "src", "App.tsx");
      const componentName = path.basename(exerciseData.filePath, path.extname(exerciseData.filePath));
      const appContent = `import './App.css'
import ${componentName} from './exercises/${componentName}'

function App() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>React Exercise: ${exerciseData.title}</h1>
      <${componentName} />
    </div>
  )
}

export default App
`;
      await fs.writeFile(appPath, appContent, "utf8");
    }
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to create starter file: ${err?.message ?? String(err)}`,
        },
      ],
    };
  }

  // Build the response (NO solution code)
  const lines: string[] = [];
  
  // Show warnings first if any
  if (warnings.length > 0) {
    lines.push("## ⚠️ Test Validation Warnings");
    lines.push("");
    lines.push("The following potential issues were detected in the exercise tests:");
    lines.push("");
    for (const warning of warnings) {
      lines.push(warning);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  
  lines.push(`# ${exerciseData.title}`);
  lines.push("");
  lines.push(exerciseData.description);
  lines.push("");
  lines.push("## Requirements:");
  for (const req of exerciseData.requirements) {
    lines.push(`- ${req}`);
  }
  lines.push("");
  lines.push(`📁 Starter file created at: \`${exerciseData.filePath}\``);
  if (mode === "easy") {
    lines.push("");
    lines.push("✨ **Easy mode**: Starter code includes helpful TODO comments to guide you.");
  }
  if (archiveEntries.length > 0) {
    lines.push("");
    lines.push("## 🗄️ Archived Previous Work");
    lines.push("");
    lines.push("I preserved your previous attempt in:");
    lines.push("");
    for (const entry of archiveEntries) {
      lines.push("- `" + entry.label + "`");
    }
    lines.push("");
  }
  lines.push("");
  
  // Recommend appropriate test tool based on environment
  const checkTool = exerciseData.environment === "node" 
    ? "tutor_node_check_solution" 
    : "tutor_react_check_solution";
  const hintTool = "tutor_get_hint";
  lines.push(`When you're ready, use the \`${checkTool}\` tool with exerciseId: "${exerciseId}" to test your solution.`);
  lines.push(`If you need help, use the \`${hintTool}\` tool to get progressive hints.`);

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
  };
}

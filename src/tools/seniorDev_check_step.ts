
import { seniorDevSessions } from "./seniorDev_start_mode.js";
import fs from "node:fs/promises";
import path from "node:path";
import { generateValidationPrompt, parseValidationResponse } from "../shared/codeValidator.js";

/**
 * Validate the user’s code for the current step.
 * This tool takes a sessionId, stepNumber, and optional files, and returns a validation result.
 *
 * Input: { sessionId: string, stepNumber: number, files?: string[] }
 * Output: { content: [...], valid: boolean, details: string }
 */

export async function seniorDev_check_step({ sessionId, stepNumber, files }: { sessionId: string; stepNumber: number; files?: string[] }) {
  const session = seniorDevSessions[sessionId];
  if (!session || !session.tutorialPlan) {
    return {
      content: [
        { type: "text" as const, text: `❌ No tutorial plan found for session: ${sessionId}` },
      ],
      valid: false,
      details: "No tutorial plan found."
    };
  }
  if (session.phase !== "tutorial-generated") {
    return {
      content: [
        { type: "text" as const, text: `❌ Invalid phase: ${session.phase}. Steps can only be checked after tutorial is generated.` },
      ],
      valid: false,
      details: `Invalid phase: ${session.phase}`
    };
  }
  const step = session.tutorialPlan.steps.find((s: any) => s.stepNumber === stepNumber);
  if (!step) {
    return {
      content: [
        { type: "text" as const, text: `❌ Step ${stepNumber} not found in tutorial plan.` },
      ],
      valid: false,
      details: "Step not found."
    };
  }

  // Use the files specified, or all files in the diff for this step
  const checkFiles = files && files.length ? files : step.diff.map((d: any) => d.file);
  let allPassed = true;
  let feedbacks: string[] = [];

  for (const { file } of step.diff) {
    if (!checkFiles.includes(file)) continue;
    // Try to read the current file contents from disk
    let studentCode = "";
    try {
      studentCode = await fs.readFile(path.join(process.cwd(), file), "utf8");
    } catch (err) {
      feedbacks.push(`❌ Could not read file: ${file}`);
      allPassed = false;
      continue;
    }
    // Use the robust validation logic for 'code-contains' steps
    if (step.validation && step.validation.type === "code-contains") {
      const prompt = generateValidationPrompt(
        studentCode,
        step.instructions || step.skill || "",
        step.instructions || step.skill || "",
        step.validation.checks || []
      );
      // In a real system, this would call the LLM. For now, do a simple check for the keyword(s)
      // (Replace this with LLM call if available)
      let passed = true;
      let missing: string[] = [];
      for (const check of step.validation.checks || []) {
        if (!studentCode.toLowerCase().includes(check.toLowerCase())) {
          passed = false;
          missing.push(check);
        }
      }
      if (passed) {
        feedbacks.push(`✅ File '${file}' appears to implement the skill(s): ${step.validation.checks.join(", ")}`);
      } else {
        feedbacks.push(`❌ File '${file}' is missing: ${missing.join(", ")}`);
        allPassed = false;
      }
      // If LLM integration is available, use:
      // const llmResponse = await callLLM(prompt);
      // const { passed, feedback } = parseValidationResponse(llmResponse);
      // feedbacks.push(feedback);
      // if (!passed) allPassed = false;
    } else {
      feedbacks.push(`⚠️ Unsupported validation type for file: ${file}`);
      allPassed = false;
    }
  }

  return {
    content: [
      { type: "text" as const, text: feedbacks.join("\n") },
    ],
    valid: allPassed,
    details: feedbacks.join("\n"),
  };
}

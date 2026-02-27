/**
 * Gateway tool for responding to students - enforces validation
 */

import { tutorValidateResponse } from "./tutorValidateResponse.js";
import type { ToolResponse } from "../shared/types.js";

export async function tutorRespondToStudent({
  draftResponse,
  tutorialOrExerciseId,
  stepNumber,
}: {
  draftResponse: string;
  tutorialOrExerciseId: string;
  stepNumber?: number;
}): Promise<ToolResponse> {
  // Automatically validate the response
  const validationResult = await tutorValidateResponse({
    responseText: draftResponse,
    tutorialOrExerciseId,
    stepNumber,
  });

  // Parse the validation result
  const resultText = validationResult.content[0].text;
  let parsedResult: any;
  
  try {
    parsedResult = JSON.parse(resultText);
  } catch (err) {
    return {
      content: [{
        type: "text",
        text: "⚠️ Error parsing validation result",
      }],
    };
  }

  if (parsedResult.approved) {
    // Response approved - return it for the AI to send to student
    const taskDescription = parsedResult.taskDescription as string | undefined;
    const requirementsNote = taskDescription
      ? `\n\n**Reminder for the AI tutor:**\nThese are the authoritative requirements for the current step:\n\n${taskDescription}\n\nBefore you send this to the student, double-check that your instructions explicitly cover every required behavior (including things like clearing inputs, handling errors, and loading states).`
      : "";

    return {
      content: [
        {
          type: "text",
          text: `✅ **Response Validated and Approved**

You may now send this response to the student:

---

${draftResponse}

---

This response has been checked and does not contain copy-paste solutions.${requirementsNote}`,
        },
      ],
    };
  } else {
    // Response rejected - return feedback
    return {
      content: [
        {
          type: "text",
          text: `❌ **Response REJECTED - Pedagogical Violation**

${parsedResult.feedback}

**Your draft response:**
${draftResponse}

**Action required:** Revise your response to guide without giving away the solution, then call this tool again.`,
        },
      ],
    };
  }
}

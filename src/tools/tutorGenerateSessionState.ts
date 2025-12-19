/**
 * Tool to generate session state for easy context restoration in new chats
 */

import fs from "node:fs/promises";
import path from "node:path";
import { loadProgress } from "../shared/progress.js";
import type { ToolResponse } from "../shared/types.js";

const SESSION_STATE_FILE = path.join(process.cwd(), "session_state.json");
const INTERVIEW_PROGRESS_FILE = path.join(process.cwd(), "interview_progress.json");

export async function tutorGenerateSessionState(): Promise<ToolResponse> {
  try {
    // Load current progress
    const userProgress = await loadProgress();

    // Find the most recent activity by timestamp
    let mostRecentActivity: any = null;
    let mostRecentTimestamp = 0;

    // Check most recent tutorial
    if (userProgress.tutorials.length > 0) {
      const sortedTutorials = [...userProgress.tutorials].sort(
        (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
      const latestTutorial = sortedTutorials[0];
      const tutorialTime = new Date(latestTutorial.lastActivity).getTime();
      if (tutorialTime > mostRecentTimestamp) {
        mostRecentTimestamp = tutorialTime;
        mostRecentActivity = {
          type: "tutorial",
          data: latestTutorial
        };
      }
    }

    // Check most recent exercise
    if (userProgress.exercises.length > 0) {
      const latestExercise = userProgress.exercises[userProgress.exercises.length - 1];
      const exerciseTime = new Date(latestExercise.date).getTime();
      if (exerciseTime > mostRecentTimestamp) {
        mostRecentTimestamp = exerciseTime;
        mostRecentActivity = {
          type: "exercise",
          data: latestExercise
        };
      }
    }

    // Build current activity description
    let description = "Ready to start new work";
    let activityType = "general";
    let phase = "planning";
    const nextSteps: string[] = [];

    if (mostRecentActivity) {
      if (mostRecentActivity.type === "tutorial") {
        const tutorial = mostRecentActivity.data;
        const isInProgress = tutorial.completedSteps.length < tutorial.currentStep;
        
        if (isInProgress) {
          activityType = "tutorial";
          phase = "in-progress";
          description = `Working on ${tutorial.title} - Step ${tutorial.currentStep}`;
          nextSteps.push(`Resume ${tutorial.tutorialId} at step ${tutorial.currentStep}`);
          nextSteps.push(`File: environments/react/template/src/exercises/`);
        } else {
          description = `Last completed: ${tutorial.title}`;
        }
      } else if (mostRecentActivity.type === "exercise") {
        const exercise = mostRecentActivity.data;
        
        if (!exercise.passed) {
          activityType = "exercise";
          phase = "in-progress";
          description = `Working on ${exercise.title} - ${exercise.testsPassed}/${exercise.testsTotal} tests passing`;
          nextSteps.push(`Resume ${exercise.exerciseId}`);
        } else {
          description = `Last completed: ${exercise.title}`;
        }
      }
    }

    // Build session state
    const sessionState = {
      lastUpdated: new Date().toISOString(),
      currentActivity: {
        type: activityType,
        phase: phase,
        description: description,
        nextSteps: nextSteps.length > 0 ? nextSteps : ["Check user_progress.json for recent activity"],
        mostRecentTimestamp: mostRecentTimestamp > 0 ? new Date(mostRecentTimestamp).toISOString() : null
      },
      mostRecentActivity: mostRecentActivity
    };

    // Save session state
    await fs.writeFile(SESSION_STATE_FILE, JSON.stringify(sessionState, null, 2), "utf8");

    // Format output
    const lines: string[] = [];
    lines.push("# Session State Generated");
    lines.push("");
    lines.push("## Current Status");
    lines.push(`**Activity:** ${sessionState.currentActivity.type}`);
    lines.push(`**Phase:** ${sessionState.currentActivity.phase}`);
    lines.push(`**Description:** ${sessionState.currentActivity.description}`);
    if (sessionState.currentActivity.mostRecentTimestamp) {
      lines.push(`**Last Activity:** ${sessionState.currentActivity.mostRecentTimestamp}`);
    }
    lines.push("");
    lines.push("## Next Steps");
    sessionState.currentActivity.nextSteps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
    lines.push("");
    lines.push("📝 **Session state saved to `session_state.json`**");
    lines.push("");
    lines.push("When starting a new chat, simply say:");
    lines.push("`Check session_state.json to see where we left off`");

    return {
      content: [{
        type: "text",
        text: lines.join("\n")
      }]
    };
  } catch (err: any) {
    return {
      content: [{
        type: "text",
        text: `❌ Error generating session state: ${err.message}`
      }]
    };
  }
}

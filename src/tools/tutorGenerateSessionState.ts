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
    
    // Load interview progress if exists
    let interviewProgress: any = null;
    try {
      const content = await fs.readFile(INTERVIEW_PROGRESS_FILE, "utf8");
      interviewProgress = JSON.parse(content);
    } catch {
      // Interview progress not available
    }

    // Determine current activity
    const inProgressTutorials = userProgress.tutorials.filter(
      t => t.completedSteps.length > 0 && t.completedSteps.length < t.currentStep
    );
    
    const recentExercises = userProgress.exercises.slice(-5);
    const lastExercise = recentExercises[recentExercises.length - 1];
    
    // Get recent completed tutorials
    const completedTutorials = userProgress.tutorials
      .filter(t => {
        // Tutorial is complete if currentStep > total steps
        return t.currentStep > t.completedSteps.length + 1;
      })
      .slice(-3)
      .map(t => `${t.tutorialId} (${t.title})`);

    // Get in-progress exercises
    const inProgressExercises = recentExercises
      .filter(e => !e.passed && e.testsPassed > 0)
      .map(e => `${e.exerciseId} (${e.testsPassed}/${e.testsTotal} tests passing)`);

    // Get completed exercises
    const completedExercises = userProgress.exercises
      .filter(e => e.passed)
      .reduce((acc, e) => {
        if (!acc.includes(e.exerciseId)) {
          acc.push(`${e.exerciseId} (${e.title})`);
        }
        return acc;
      }, [] as string[]);

    // Determine phase and next steps
    let phase = "planning";
    let activityType = "general";
    let description = "Ready to start new work";
    const nextSteps: string[] = [];

    if (interviewProgress?.interviewPrep) {
      activityType = "interview-prep";
      const stats = interviewProgress.stats;
      
      if (stats.tutorialsCompleted === stats.tutorialsTotal && stats.exercisesCompleted === 0) {
        phase = "tutorials-completed";
        description = "All interview prep tutorials completed. Ready to start exercises.";
        interviewProgress.interviewPrep.topics.forEach((topic: any) => {
          if (!topic.exercise.completed) {
            nextSteps.push(
              `Start ${topic.exercise.id} exercise (${topic.exercise.title} - ${topic.exercise.testsTotal} tests)`
            );
          }
        });
      } else if (stats.exercisesCompleted === stats.exercisesTotal) {
        phase = "completed";
        description = "All interview prep tutorials and exercises completed!";
        nextSteps.push("Review completed exercises");
        nextSteps.push("Practice weak areas");
      } else {
        phase = "in-progress";
        description = `Interview prep in progress: ${stats.tutorialsCompleted}/${stats.tutorialsTotal} tutorials, ${stats.exercisesCompleted}/${stats.exercisesTotal} exercises completed.`;
      }
    } else if (inProgressTutorials.length > 0) {
      activityType = "tutorial";
      phase = "in-progress";
      const tutorial = inProgressTutorials[0];
      description = `Working on ${tutorial.title} (step ${tutorial.currentStep})`;
      nextSteps.push(`Continue tutorial: ${tutorial.tutorialId}`);
    } else if (lastExercise && !lastExercise.passed) {
      activityType = "exercise";
      phase = "in-progress";
      description = `Working on ${lastExercise.title} (${lastExercise.testsPassed}/${lastExercise.testsTotal} tests passing)`;
      nextSteps.push(`Fix failing tests in ${lastExercise.exerciseId}`);
    }

    // Get last tutorial info
    const lastTutorial = userProgress.tutorials[userProgress.tutorials.length - 1];
    let lastTutorialInfo = null;
    if (lastTutorial) {
      lastTutorialInfo = {
        id: lastTutorial.tutorialId,
        title: lastTutorial.title,
        completedStep: lastTutorial.completedSteps[lastTutorial.completedSteps.length - 1] || 0,
        totalSteps: lastTutorial.completedSteps.length,
        status: lastTutorial.currentStep > lastTutorial.completedSteps.length + 1 ? "completed" : "in-progress"
      };
    }

    // Build session state
    const sessionState = {
      lastUpdated: new Date().toISOString(),
      currentActivity: {
        type: activityType,
        phase: phase,
        description: description,
        nextSteps: nextSteps.length > 0 ? nextSteps : ["Check user_progress.json for next steps"]
      },
      recentWork: {
        completedTutorials: completedTutorials,
        inProgressExercises: inProgressExercises,
        completedExercises: completedExercises,
        lastTutorial: lastTutorialInfo
      },
      context: {
        projectType: "mcp-tutor",
        description: "AI Code Tutor - MCP server for teaching coding with tutorials and exercises",
        recentChanges: [
          "Session state tracking system implemented",
          "Interview progress tracking synchronized with user_progress.json"
        ],
        workingDirectory: process.cwd(),
        activeFiles: [
          "session_state.json",
          "user_progress.json",
          "interview_progress.json"
        ]
      },
      notes: [
        "Use 'Check session_state.json' at start of new chat for instant context",
        `Total exercise attempts: ${userProgress.exercises.length}`,
        `Tutorials in progress: ${inProgressTutorials.length}`,
        `Completed exercises: ${completedExercises.length}`
      ]
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
    lines.push("");
    lines.push("## Next Steps");
    sessionState.currentActivity.nextSteps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
    lines.push("");
    lines.push("## Recent Work");
    if (completedTutorials.length > 0) {
      lines.push("**Completed Tutorials:**");
      completedTutorials.forEach(t => lines.push(`- ${t}`));
    }
    if (completedExercises.length > 0) {
      lines.push("**Completed Exercises:**");
      completedExercises.forEach(e => lines.push(`- ${e}`));
    }
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

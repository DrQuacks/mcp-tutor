/**
 * Displays user's exercise progress and statistics
 */

import { loadProgress } from "../shared/progress.js";
import type { ExerciseAttempt, ToolResponse } from "../shared/types.js";

export async function tutorViewProgress(): Promise<ToolResponse> {
  const progress = await loadProgress();
  
  if (progress.exercises.length === 0) {
    return {
      content: [{
        type: "text",
        text: "No exercises attempted yet. Try an exercise to start tracking your progress!"
      }]
    };
  }
  
  const lines: string[] = [];
  lines.push("# Your Progress");
  lines.push("");
  
  // Group by exercise
  const byExercise = new Map<string, ExerciseAttempt[]>();
  for (const attempt of progress.exercises) {
    if (!byExercise.has(attempt.exerciseId)) {
      byExercise.set(attempt.exerciseId, []);
    }
    byExercise.get(attempt.exerciseId)!.push(attempt);
  }
  
  // Summary stats
  const totalAttempts = progress.exercises.length;
  const passed = progress.exercises.filter(a => a.passed).length;
  const uniqueExercises = byExercise.size;
  
  lines.push(`📊 **Summary:**`);
  lines.push(`- Total attempts: ${totalAttempts}`);
  lines.push(`- Passed: ${passed} (${Math.round(passed/totalAttempts*100)}%)`);
  lines.push(`- Unique exercises: ${uniqueExercises}`);
  lines.push("");
  
  // Recent attempts
  lines.push("## Recent Attempts:");
  const recent = progress.exercises.slice(-10).reverse();
  for (const attempt of recent) {
    const date = new Date(attempt.date).toLocaleDateString();
    const emoji = attempt.passed ? "✅" : "❌";
    lines.push(`${emoji} ${attempt.title} (${attempt.environment}) - ${date}`);
    lines.push(`   ${attempt.testsPassed}/${attempt.testsTotal} tests passed`);
    
    // Show help usage if any
    const helpInfo: string[] = [];
    if (attempt.hintsUsed > 0) {
      helpInfo.push(`${attempt.hintsUsed} hint${attempt.hintsUsed > 1 ? 's' : ''}`);
    }
    if (attempt.solutionViewed) {
      helpInfo.push('solution viewed');
    }
    if (helpInfo.length > 0) {
      lines.push(`   (${helpInfo.join(', ')})`);
    }
  }
  
  return {
    content: [{
      type: "text",
      text: lines.join("\n")
    }]
  };
}

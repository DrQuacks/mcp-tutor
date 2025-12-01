# Progress Tracking System Design

## Overview
Track user's exercise attempts to recommend appropriate exercises based on their history and performance.

## File Structure

### Create `user_progress.json`
```json
{
  "exercises": []
}
```

## Implementation Steps

### 1. Add Constants and Types to server.ts

Add after existing constants:
```typescript
const PROGRESS_FILE = path.join(process.cwd(), "user_progress.json");

interface ExerciseAttempt {
  exerciseId: string;
  title: string;
  environment: string; // "node" or "react"
  passed: boolean;
  date: string; // ISO date
  testsPassed: number;
  testsTotal: number;
}

interface UserProgress {
  exercises: ExerciseAttempt[];
}
```

### 2. Add Progress Helper Functions

```typescript
async function loadProgress(): Promise<UserProgress> {
  try {
    const content = await fs.readFile(PROGRESS_FILE, "utf8");
    return JSON.parse(content);
  } catch {
    return { exercises: [] };
  }
}

async function saveProgress(progress: UserProgress): Promise<void> {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf8");
}

async function recordAttempt(
  exerciseId: string,
  title: string,
  environment: string,
  passed: boolean,
  testsPassed: number,
  testsTotal: number
): Promise<void> {
  const progress = await loadProgress();
  progress.exercises.push({
    exerciseId,
    title,
    environment,
    passed,
    date: new Date().toISOString(),
    testsPassed,
    testsTotal,
  });
  await saveProgress(progress);
}
```

### 3. Update Existing Check Solution Tools

In both `tutor_node_check_solution` and `tutor_react_check_solution`, add before the final return statement:

```typescript
// Record attempt for progress tracking
await recordAttempt(
  exerciseId,
  exerciseData.title,
  exerciseData.environment,
  allPassed,
  testResults.filter(t => t.passed).length,
  testResults.length
);
```

### 4. Add Progress Viewing Tool

```typescript
server.registerTool(
  "tutor_view_progress",
  {
    description: "Shows your exercise progress history and statistics.",
    inputSchema: z.object({}),
  },
  async () => {
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
    }
    
    return {
      content: [{
        type: "text",
        text: lines.join("\n")
      }]
    };
  }
);
```

## Error Reporting Improvements

When tests fail, provide minimal feedback first:
1. Show which test failed
2. Show the error message
3. Show the line number (if available)
4. Ask if user wants a hint

Only provide detailed hints if requested. Track:
- `hintsUsed: number` - How many hints were requested
- `solutionViewed: boolean` - Whether they viewed the full solution

## Benefits

- **Track History**: Every attempt is recorded with timestamp
- **Partial Credit**: Records tests passed/total, not just pass/fail
- **Track Help Usage**: Records hints used and solution views
- **Identify Patterns**: See which concepts need more practice
- **Avoid Repetition**: AI can check if exercise was recently completed
- **Smart Recommendations**: AI can suggest exercises based on:
  - What you haven't tried yet
  - What you struggled with
  - What you haven't practiced in a while
  - Concepts that build on what you know
  - How much help you needed (independent vs. needed hints)

## Future Enhancements

- Add difficulty ratings to exercises
- Track time spent on each attempt
- Add streaks and achievements
- Export progress reports
- Skill tree visualization

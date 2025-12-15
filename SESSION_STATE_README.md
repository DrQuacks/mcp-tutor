# Session State Management

## Purpose
When you need to start a new chat due to context window limits, use `session_state.json` to help me quickly understand where you left off.

## How to Use

### When Starting a New Chat
Simply say:
```
"Check session_state.json to see where we left off"
```

I'll read the file and immediately understand:
- What you were working on
- What's been completed
- What's next
- Recent changes made
- Important context

### When Ending a Session
Before starting a new chat, update `session_state.json` with:
1. **currentActivity** - What you're currently doing
2. **nextSteps** - What should happen next
3. **recentWork** - What was just completed
4. **context** - Important project details
5. **notes** - Any important reminders

## File Structure

```json
{
  "lastUpdated": "ISO timestamp",
  "currentActivity": {
    "type": "tutorial | exercise | interview-prep | development",
    "phase": "in-progress | completed | planning",
    "description": "Brief description of current work",
    "nextSteps": ["Array of next actions to take"]
  },
  "recentWork": {
    "completedTutorials": ["List of recently completed tutorials"],
    "inProgressExercises": ["List of exercises being worked on"],
    "completedExercises": ["List of completed exercises"],
    "lastTutorial": {
      "id": "tutorial-id",
      "title": "Tutorial title",
      "completedStep": 5,
      "totalSteps": 6,
      "status": "in-progress | completed"
    }
  },
  "context": {
    "projectType": "Type of project",
    "description": "Brief project description",
    "recentChanges": ["List of recent changes/fixes"],
    "workingDirectory": "Current directory path",
    "activeFiles": ["Files currently being worked on"]
  },
  "notes": ["Important reminders and context"]
}
```

## Benefits

✅ **Instant Context** - I understand your situation immediately
✅ **No Repetition** - Don't need to re-explain what you're doing
✅ **Continuity** - Pick up exactly where you left off
✅ **Progress Tracking** - Clear record of what's been accomplished
✅ **Smart Suggestions** - I can recommend next steps based on state

## Example Usage

**End of Session:**
```json
{
  "currentActivity": {
    "type": "exercise",
    "phase": "in-progress",
    "description": "Working on react-counter exercise, 3 out of 4 tests passing",
    "nextSteps": [
      "Fix the decrement button test",
      "Run tutor_react_check_solution to verify all tests pass"
    ]
  }
}
```

**Start of New Session:**
You: "Check session_state.json to see where we left off"

Me: "I see you were working on the react-counter exercise with 3/4 tests passing. 
The decrement button test was failing. Ready to continue?"

## Automation (Optional)

You can create a helper script to auto-update session state:

```bash
# update-session.sh
#!/bin/bash
# Updates session state with latest progress from user_progress.json
node scripts/sync-session-state.js
```

This could automatically sync:
- Latest tutorial progress
- Recent exercise attempts
- Completion status
- Timestamps

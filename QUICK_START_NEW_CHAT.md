# 🚀 Quick Start Guide for New Chat Sessions

## When Starting a New Chat (Context Window Reset)

### Step 1: Load Session State
Say to the AI:
```
Check session_state.json to see where we left off
```

The AI will immediately understand:
- ✅ Current activity and phase
- ✅ What's been completed
- ✅ What's in progress
- ✅ What to do next
- ✅ Recent changes made

### Step 2: (Optional) View Detailed Progress
```
Use tutor_view_progress to show my exercise history
```

## Before Ending a Session

### Update Session State
Ask the AI:
```
Generate session state before I start a new chat
```

This will:
- ✅ Analyze your current progress
- ✅ Identify next steps
- ✅ Save everything to `session_state.json`
- ✅ Create a clean snapshot for context restoration

## Files That Track Your Progress

### `session_state.json`
- **Purpose:** Quick context restoration for new chats
- **Contains:** Current activity, next steps, recent work
- **Updated:** Manually or via `tutor_generate_session_state` tool

### `user_progress.json`
- **Purpose:** Detailed history of all attempts
- **Contains:** Every tutorial step and exercise attempt
- **Updated:** Automatically on every tutorial/exercise action

### `interview_progress.json`
- **Purpose:** Tracks interview prep specific goals
- **Contains:** Tutorial/exercise completion for interview topics
- **Updated:** Automatically when tutorials/exercises complete

## Common Scenarios

### Scenario 1: Mid-Tutorial Context Reset
**Before ending chat:**
```
Generate session state - I'm on step 4 of the filterable-list tutorial
```

**Starting new chat:**
```
Check session_state.json - I was working on a tutorial
```

### Scenario 2: Mid-Exercise Context Reset
**Before ending chat:**
```
Generate session state - I'm working on react-counter exercise with 3/4 tests passing
```

**Starting new chat:**
```
Check session_state.json - I was debugging an exercise
```

### Scenario 3: Planning Next Work
**Starting new chat:**
```
Check session_state.json and recommend what I should work on next
```

## Pro Tips

💡 **Update frequently:** Generate session state when you complete major milestones

💡 **Add custom notes:** You can manually edit `session_state.json` to add specific reminders

💡 **Interview prep:** Session state automatically tracks which interview topics are done

💡 **No loss of work:** Even without session state, `user_progress.json` has full history

## Example Session State

```json
{
  "currentActivity": {
    "type": "interview-prep",
    "phase": "tutorials-completed",
    "description": "All 3 interview tutorials completed, ready for exercises",
    "nextSteps": [
      "Start react-ticket-filter (7 tests)",
      "Start react-sortable-table (6 tests)"
    ]
  },
  "recentWork": {
    "completedTutorials": ["react-filterable-list", "react-sort-pagination"],
    "lastTutorial": {
      "id": "react-form-validation",
      "status": "completed"
    }
  }
}
```

## Workflow Summary

```
┌─────────────────────────────────────┐
│  Working on Tutorial/Exercise       │
│  Context window getting large...    │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  "Generate session state"           │
│  → session_state.json created       │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Start New Chat                     │
│  "Check session_state.json"         │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  AI: "I see you were working on...  │
│  Ready to continue!"                │
└─────────────────────────────────────┘
```

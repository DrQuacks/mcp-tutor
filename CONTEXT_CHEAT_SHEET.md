# 📋 Context Restoration Cheat Sheet

## 🎯 Starting a New Chat After Context Window Limit

### The Magic Phrase:
```
Check session_state.json to see where we left off
```

That's it! The AI will instantly know:
- What you were working on
- What's completed
- What's next
- Recent changes

---

## 🔄 Before Ending Current Chat

### Save Your Progress:
```
Generate session state
```

Or be more specific:
```
Generate session state - I'm on step 4 of react-filterable-list tutorial
```

---

## 📂 Key Files

| File | Purpose | When Updated |
|------|---------|--------------|
| `session_state.json` | Quick context snapshot | Manually or via tool |
| `user_progress.json` | Full attempt history | Auto (every action) |
| `interview_progress.json` | Interview prep tracking | Auto (on completion) |

---

## 🚨 Emergency Recovery

If you didn't save session state:
```
Check user_progress.json and tell me what I was working on last
```

The AI can reconstruct your context from the detailed history.

---

## 💡 Pro Tips

1. **Update at milestones** - Generate state when finishing tutorials or major steps
2. **Custom notes** - Edit `session_state.json` manually to add reminders
3. **Interview tracking** - Session state auto-syncs with interview progress
4. **No data loss** - Even without session state, full history is preserved

---

## 📝 Example Workflow

**End of session:**
```
Me: Generate session state
AI: ✅ Session state saved. When starting new chat, say "Check session_state.json"
```

**Start of new session:**
```
Me: Check session_state.json
AI: I see you completed the filterable-list tutorial and are ready to start
    the react-ticket-filter exercise (7 tests). Ready to begin?
```

---

## 🎓 Tutorial/Exercise Commands

- `tutor_start_tutorial` - Start/resume a tutorial
- `tutor_react_exercise_prompt` - Load an exercise
- `tutor_react_check_solution` - Test your solution
- `tutor_view_progress` - View full history
- `tutor_generate_session_state` - Save current state

---

## 🆘 Help

Read detailed docs:
- `QUICK_START_NEW_CHAT.md` - Full guide
- `SESSION_STATE_README.md` - System documentation

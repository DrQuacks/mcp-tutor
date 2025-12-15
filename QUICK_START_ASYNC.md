# Quick Start: New Async Interview Exercises

## What's New
Added 2 new exercises focused on async data fetching patterns (key for Worktrace interview).

## Ready to Use

### Exercise 1: Task Dashboard (Intermediate)
**Start with**: "Start the react-task-dashboard exercise"

**What it covers**:
- Basic fetch with loading/error states
- useEffect for data fetching on mount
- Error handling with retry button
- Refresh functionality
- Client-side filtering

**Time**: ~30 minutes
**Tests**: 10 automated browser tests

**Key Pattern**:
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await api.fetch();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Exercise 2: Async Todo (Advanced)
**Start with**: "Start the react-todo-async exercise"

**What it covers**:
- Optimistic UI updates
- Rollback on error
- Async mutations (add/delete)
- Multiple loading states
- Error recovery with UX polish

**Time**: ~35 minutes
**Tests**: 8 automated browser tests

**Key Pattern** (Optimistic Update):
```tsx
const handleAdd = async () => {
  // 1. Update UI immediately (optimistic)
  const tempId = Date.now();
  setItems(prev => [...prev, { id: tempId, ...newItem }]);
  
  try {
    // 2. Sync with server
    const saved = await api.add(newItem);
    // 3. Replace temp with real
    setItems(prev => prev.map(i => i.id === tempId ? saved : i));
  } catch (err) {
    // 4. Rollback on failure
    setItems(prev => prev.filter(i => i.id !== tempId));
  }
};
```

## Tutorials Available

### Tutorial 1: Fetch Basics (Already Exists)
**Start with**: "Start the react-fetch-trycatch tutorial"
- 5-step tutorial teaching useState + useEffect + fetch pattern
- File: `exercises/tutorial-react-fetch-trycatch.json`

### Tutorial 2: React Query (Already Exists)
**Start with**: "Start the react-reactquery tutorial"
- Modern data fetching with caching
- File: `exercises/tutorial-react-reactquery.json`

## Interview Prep Status

Current progress tracked in `interview_progress.json`:

**Completed (2/5 exercises)**:
- ✅ Ticket Filter (7/7 tests)
- ✅ Sortable Table (6/6 tests)

**Remaining (3/5 exercises)**:
- 📋 Form Validator (8 tests) - NEXT UP
- 📋 Task Dashboard (10 tests) - NEW
- 📋 Async Todo (8 tests) - NEW

## Recommended Next Steps

### Option A: Finish Original Track
1. Complete `react-form-validator` exercise
2. Then do async exercises

### Option B: Focus on Async (Worktrace Priority)
1. Take `react-fetch-trycatch` tutorial (15 min)
2. Do `react-task-dashboard` exercise (30 min)
3. Take `react-reactquery` tutorial (optional)
4. Do `react-todo-async` exercise (35 min)

### Option C: Mixed Approach
1. Do `react-form-validator` (finish what you started)
2. Quick `react-fetch-trycatch` tutorial
3. Do `react-task-dashboard` exercise
4. Save advanced async for later

## Why These Match Worktrace

From ChatGPT spec:
> "Since Worktrace is an AI agent that 'watches your work and automates tasks,' they'll care that you can handle async flows nicely."

✅ **Task Dashboard** teaches:
- Clean useEffect usage for fetch on mount
- Proper cleanup with finally blocks
- Error handling without anti-patterns
- User-friendly loading/error states
- Refresh/retry patterns

✅ **Async Todo** teaches:
- Optimistic updates (instant feedback)
- Error recovery (rollback)
- Multiple async operations
- Production-ready patterns

Both exercises have:
- Mock APIs with realistic delays
- Random errors (practice error handling)
- TypeScript typing
- Comprehensive test coverage

## Testing Your Solutions

The AI will run Playwright tests automatically when you say:
- "Check my work"
- "Test my solution"
- "Am I done?"

All async operations have proper wait times built into tests.

## Tips

1. **Start Simple**: Do Task Dashboard before Async Todo
2. **Read Requirements**: Check the JSON file `requirements` array
3. **Use TypeScript**: The interfaces are provided in starter code
4. **Test Often**: Run tests early and often
5. **Ask for Hints**: If stuck, say "I need a hint"

## Files Created
- `exercises/react-task-dashboard.json` (NEW)
- `exercises/react-todo-async.json` (NEW)
- `interview_progress.json` (UPDATED - now tracks 5 exercises)
- `ASYNC_EXERCISES_SUMMARY.md` (detailed explanation)
- `QUICK_START_ASYNC.md` (this file)
